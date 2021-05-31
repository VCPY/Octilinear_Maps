/// <reference lib="webworker" />
import * as algo from "../octiAlgorithm/octiMaps.algorithm";
import * as dijkstra from "../octiAlgorithm/dijkstra.algorithm";
import {plainToClass} from 'class-transformer'
import {Constants} from "../octiGraph/constants";
import {OctiGraph} from "../octiGraph/octiGraph";
import {OctiNode} from "../octiGraph/octiNode";
import {GridNode} from "../octiGraph/gridNode";
import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";
import {InputGraph} from "../inputGraph/inputGraph";
import {Vector2} from "../util";
import {OutputGraph} from "../outputGraph/outputGraph";
import {OutputEdge} from "../outputGraph/outputEdge";
import {OutputStation} from "../outputGraph/outputStation";

/**
 * Takes the data retrieved from the event listener and parses the elements from plain javascript object to their respective classes.
 * @param data The plain object input graph to parse.
 */
function extractInputgraph(data: any): InputGraph {
  // convert from plain js object to typescript object and set correct references
  let inputGraph: InputGraph = plainToClass(InputGraph, data);
  inputGraph.nodes = inputGraph.nodes.map(n => plainToClass(Station, n));
  inputGraph.edges = inputGraph.edges.map(e => plainToClass(InputEdge, e));
  inputGraph.edges.forEach(edge => {
    const id1 = (edge.station1 as any)._stopID;
    const id2 = (edge.station2 as any)._stopID;

    edge.station2 = inputGraph.getNodeByID(id1) as Station;
    edge.station1 = inputGraph.getNodeByID(id2) as Station;
  });

  return inputGraph;
}

/**
 * Listener which takes the retrieved data and applies the algorithm onto it.
 */
addEventListener('message', ({data}) => {
  console.log("[algorithm-worker] preparing");
  let graphData = data["graph"]
  let inputGraph = extractInputgraph(graphData);
  let algorithm = new AlgorithmWorker(inputGraph, data);
  console.log("[algorithm-worker] starting algorithm")
  const outputGraph = algorithm.performAlgorithm(algo.orderEdges(inputGraph));
  console.log("[algorithm-worker] creating output graph");
  console.log("[algorithm-worker] finished");
  postMessage(outputGraph);
});

/**
 * Worker which applies the algorithm from the paper onto the input data.
 */
class AlgorithmWorker {

  private readonly D: number;

  /**
   * Radius in which nodes around a station are considered
   */
  private readonly r: number;
  private readonly _inputGraph: InputGraph;
  private readonly _octiGraph: OctiGraph;
  private readonly _graphOffset;
  private readonly _ignoreError = true;
  private readonly _settledStations = new Map<Station, GridNode>();
  private readonly _foundPaths = new Map<InputEdge, OctiNode[]>();
  private readonly allowCrossing = false

  /**
   * Names of the lines which should be drawn
   * @private
   */
  private readonly exactString: string[] = []

  constructor(inputGraph: InputGraph, data: any) {

    this.exactString = data["exactString"];
    this.allowCrossing = data["allowCrossing"]

    inputGraph = this.filterInputGraph(inputGraph)

    // prepare the input graph
    inputGraph.mergeEqualEdges();
    inputGraph.calculateNodeLineDegrees();
    inputGraph.calculateEdgeOrderingAtNode();
    inputGraph.removeNodesWithoutEdges();

    this.D = algo.calculateAverageNodeDistance(inputGraph) * parseFloat(data["r"]);

    inputGraph.removeTwoDegreeNodes();

    // I think it is more accurate to keep the same ordering as before merging 2-deg nodes,
    // but it looks better when we recalculate it.
    inputGraph.calculateEdgeOrderingAtNode();

    this.r = 1;
    this._inputGraph = inputGraph;

    // create octi graph
    let inputSize = inputGraph.getDimensions();
    this._graphOffset = inputGraph.getMinCoordinates();
    this._octiGraph = new OctiGraph(inputSize[0] / this.D, inputSize[1] / this.D);
  }

  /**
   *  Runs the algorithm with an edge ordering
   */
  performAlgorithm(edgeOrdering: InputEdge[]) {
    this._foundPaths.clear();
    this._settledStations.clear();

    // perform algorithm over all edges
    edgeOrdering.forEach(edge => {

      const station1 = edge.station1;
      const station2 = edge.station2;

      const allCandidates = this.getCandidateNodes(station1, station2);
      const from = allCandidates[0];
      const to = allCandidates[1];


      if (this.isSettled(from)) {
        // Block sink edges to ensure this routing won't block a future routing
        from[0].blockForCircularOrdering(edge);
        from[0].addLineBendPenalty();
      }
      if (this.isSettled(to)) {
        // Block sink edges to ensure this routing won't block a future routing
        to[0].blockForCircularOrdering(edge);
        to[0].addLineBendPenalty();
      }

      let path = dijkstra.setToSet(this._octiGraph, from, to);
      if (path.length == 0 && this._ignoreError) {
        console.log(`[algorithm-worker] No path found for edge: (${station1.stationName} - ${station2.stationName})`)
        return;
      } else if (path.length == 0)
        throw new Error(`No path found for edge: (${station1.stationName} - ${station2.stationName})`);

      this.storePath(path, edge, station1, station2);
    });

    console.log("Total time in dijkstra:", dijkstra.totalTime, "section time:", dijkstra.sectionTime);
    console.log("[algorithm-worker] starting local search");
    dijkstra.resetTime();

    /* local search */
    Array.from(this._settledStations.keys()).forEach(station => {
      this.performLocalSearch(station);
    });

    console.log("Total time in dijkstra:", dijkstra.totalTime, "section time:", dijkstra.sectionTime);
    console.log(`Found ${this._foundPaths.size} of ${this._inputGraph.edges.length}`);

    this._inputGraph.edges.forEach(e => {
      if (!this._foundPaths.has(e)) console.log("Did not find ", e);
    });

    return this.createOutputGraph();
  }

  private isSettled(from: GridNode[]): boolean {
    if (from.length != 1) return false;
    return Array.from(this._settledStations.values()).includes(from[0]);
  }

  /**
  * Returns grid nodes in a radius r around station1 and station2
  * the first array are nodes that are closer to station1, the second one are nodes closer to station2
  * Each node will have it's sink edges opend and weight increased by the distance penalty to their respective station
  */
  private getCandidateNodes(station1: Station, station2: Station): GridNode[][] {
    // convert geo to grid coordinates
    const coordinates1 = this.getGrapCoordinates(station1);
    const coordinates2 = this.getGrapCoordinates(station2);

    let ret1: GridNode[] = [];
    let ret2: GridNode[] = [];
    for (let i = -this.r - 1; i <= this.r + 1; i++) {
      for (let j = -this.r - 1; j <= this.r + 1; j++) {
        // check around both stations
        for (let center of [coordinates1, coordinates2]) {
          const x = Math.round(center.x + i);
          const y = Math.round(center.y + j);

          if (!this._octiGraph.hasNode(x, y)) break;
          const node = this._octiGraph.getNode(x, y);

          // avoid duplicates
          if (ret1.includes(node) || ret2.includes(node)) break;
          // ignore if this node is settled
          if (Array.from(this._settledStations.values()).includes(node)) break;

          // check distance to both stations, assign to lower
          const distance1 = Math.sqrt((coordinates1.x - x) * (coordinates1.x - x) + (coordinates1.y - y) * (coordinates1.y - y));
          const distance2 = Math.sqrt((coordinates2.x - x) * (coordinates2.x - x) + (coordinates2.y - y) * (coordinates2.y - y));
          if (distance1 <= this.r || distance2 <= this.r) {
            if (distance1 < distance2) {
              //set penalty on all sink edges
              const penalty = distance1 * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight = Constants.COST_SINK + penalty);

              ret1.push(node);
            } else {
              //set penalty on all sink edges
              const penalty = distance2 * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight = Constants.COST_SINK + penalty);

              ret2.push(node);
            }
          }
        }
      }
    }

    if (this._settledStations.has(station1)) {
      let settledStation = this._settledStations.get(station1) as GridNode;
      settledStation.reopenSinkEdges();
      ret1 = [settledStation];
    }

    if (this._settledStations.has(station2)) {
      let settledStation = this._settledStations.get(station2) as GridNode;
      settledStation.reopenSinkEdges();
      ret2 = [settledStation];
    }
    // from, to
    return [ret1, ret2];
  }

  /**
   * Filters the edges of the inputgraph by the names within this.exactString
   * @param inputGraph
   */
  filterInputGraph(inputGraph: InputGraph) {
    if (this.exactString.length != 0)
      inputGraph.edges = inputGraph.edges.filter(e => this.exactString.some(x => x === e.line[0]))
    return inputGraph
  }

  /**
   * Stores a found path by:
   *   storing it in foundPats
   *   storing each station in settledStation
   *   storing the settled edge in each end GridNode
   *   closing all edges along the path
   *   closing all edges on end GridNodes
   *   closing diagonal edges
   */
  private storePath(path: OctiNode[], edge: InputEdge, station1: Station, station2: Station)
  {
    this._foundPaths.set(edge, path);
    this._settledStations.set(station1, path[0].gridNode);
    this._settledStations.set(station2, path[path.length - 1].gridNode);

    path[0].gridNode.station = station1;
    path[path.length - 1].gridNode.station = station2;

    // store routing in grid  nodes
    path[0].gridNode.saveRouting(station2, path[1].direction, edge);
    path[path.length - 1].gridNode.saveRouting(station1, path[path.length - 2].direction, edge);

    // Prevent paths from crossing (4.3)
    path.map(node => node.gridNode)
      .forEach(node => {
        node.closeSinkEdge();
        node.closeBendEdges(this.allowCrossing ? Constants.COST_CROSSING : Infinity);
      });

    /* To prevent crossing paths at diagonal grid edges,
    we close for each diagonal grid edge used in the
    previously found path all crossing diagonal grid
    edges by setting their cost to ∞.*/
    for (let i = 0; i < path.length - 1; i++) {
      let one: OctiNode = path[i];
      let two: OctiNode = path[i + 1];
      let octiEdge = one.getEdge(two);
      if (octiEdge != undefined) {
        octiEdge.used = true;
        octiEdge.weight = Infinity;
        this._octiGraph.closeDiagonalEdge(octiEdge, this.allowCrossing)
      }
    }
  }

  /**
   * Performs the local search step from the paper (4.6)
   *
   * Tries to move each of the stations in each direction to find a better overal routing
   */
  private performLocalSearch(station: Station) {
    const originalPosition = this._settledStations.get(station) as GridNode;

    const allReRoutings = [];

    // repeat for each direction
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {

        // exclude out of grid and settled stations
        if (!this._octiGraph.hasNode(originalPosition.x + x, originalPosition.y + y)) continue;
        const candidateGirdNode = this._octiGraph.getNode(originalPosition.x + x, originalPosition.y + y);
        if (candidateGirdNode.station != undefined) continue;

        this.removeAllRoutingsTo(station);

        const result = this.routeAllStationEdges(station, candidateGirdNode);
        result.x = x;
        result.y = y;

        if (result.found.size == station.edgeOrdering.length)
          allReRoutings.push(result);
      }
    }

    this.removeAllRoutingsTo(station);

    if (allReRoutings.length == 0)
    {
      console.log(`[algorithm-worker] Local search failed for: ${station.stationName}`);
      return;
    }

    const best = allReRoutings.reduce((a, b) => a.cost < b.cost ? a : b);
    //console.log(station.stationName, "offset by", best.x, best.y);

    best.found.forEach((path, edge) =>
      this.storePath(path, edge, station, edge.otherStation(station)))
  }

  /**
   * Resets all routings to station in the grid graph
   * by reopening all edges and removing the stored paths
   */
  private removeAllRoutingsTo(station: Station) {
    station.edgeOrdering.forEach(edge => {
      const path = this._foundPaths.get(edge);
      if (path == undefined) return;

      this.reopenPath(path);

      path.slice(2, path.length - 3).forEach(node => {
        node.gridNode.reopenSinkEdges();
        node.gridNode.reopenBendEdges();
      });

      path[0].gridNode.removeRouting(edge);
      path[path.length - 1].gridNode.removeRouting(edge);

      if (path[0].gridNode.station == station) {
        path[0].gridNode.station = undefined;
        path[0].gridNode.closeBendEdges();
        path[0].gridNode.reopenSinkEdges();
      }

      if (path[path.length - 1].gridNode.station == station) {
        path[path.length - 1].gridNode.station = undefined;
        path[path.length - 1].gridNode.reopenBendEdges();
        path[path.length - 1].gridNode.reopenSinkEdges();
      }

      // open edges of each path
      this._foundPaths.delete(edge);
    });

    this._settledStations.delete(station);
  }

  /**
   * Routes all edges from a station clockwise
   *
   * @returns The total cost of each routing, and each path
   */
  private routeAllStationEdges(station: Station, candidateGirdNode: GridNode) {
    let costSum = 0;
    const foundLocal = new Map<InputEdge, OctiNode[]>();
    // reroute all edges
    station.edgeOrdering.forEach(edge => {
      const otherStation = edge.otherStation(station);
      if (!this._settledStations.has(otherStation)) return;
      const otherGridNode = this._settledStations.get(otherStation) as GridNode;

      const path = this.routePath(candidateGirdNode, otherGridNode, station, otherStation, edge);
      if (path.length == 0) return;

      costSum += path[path.length - 1].dist;
      foundLocal.set(edge, path);
    });

    return {cost: costSum, found: foundLocal, x: 0, y: 0};
  }

  /**
   * Routes a path between two stations
   */
  private routePath(candidateGirdNode: GridNode, otherGridNode: GridNode, station: Station, otherStation: Station, edge: InputEdge) {

    // Block sink edges to ensure this routing won't block a future routing
    candidateGirdNode.reopenSinkEdges();
    candidateGirdNode.blockForCircularOrdering(edge);
    candidateGirdNode.addLineBendPenalty();
    otherGridNode.reopenSinkEdges();
    otherGridNode.blockForCircularOrdering(edge);
    otherGridNode.addLineBendPenalty();

    const path = dijkstra.setToSet(this._octiGraph, [candidateGirdNode],[otherGridNode]);
    if (path.length == 0) return [];

    this.storePath(path, edge, station, otherStation);

    return path;
  }

  /**
   * Opens all edges along a path
   * and resets the used flag
   * */
  private reopenPath(path: OctiNode[]) {

    // set edges to no used
    for (let i = 0; i < path.length - 1; i++) {
      let one: OctiNode = path[i];
      let two: OctiNode = path[i + 1];
      let octiEdge = one.getEdge(two);
      if (octiEdge != undefined) {
        octiEdge.used = false;
        octiEdge.resetWeight();
        const diagonal = this._octiGraph.getDiagonal(octiEdge);
        if (diagonal != undefined)
          diagonal.resetWeight();
      }
    }
  }

  private getGrapCoordinates(station: Station): Vector2 {
    return new Vector2(
      (station.longitude - this._graphOffset[0]) / this.D,
      (station.latitude - this._graphOffset[1]) / this.D);
  }

  /**
   * Creates an output graph for drawing from the calculated data.
   * @private
   */
  private createOutputGraph(): OutputGraph {
    const stations: OutputStation[] = [];
    this._settledStations.forEach((node, station) => {
      stations.push(new OutputStation(new Vector2(node.x, node.y), station.stationName));
    });

    const paths: OutputEdge[] = [];
    this._foundPaths.forEach((nodes, edge) => {

      // remove grid nodes that occure multiple times
      const uniqueGridNodes = [...new Set(nodes.map(n => n.gridNode))];
      const points = uniqueGridNodes.map(n => new Vector2(n.x, n.y));

      let startingStation = edge.station1
      // Sort edges to have the correct ordering for drawing
      edge.inBetweenStations = edge.inBetweenStations.sort((a: Station, b: Station) => {
        let dist1 = this.euclideanDistance([startingStation.latitude, startingStation.longitude], [a.latitude, a.longitude])
        let dist2 = this.euclideanDistance([startingStation.latitude, startingStation.longitude], [b.latitude, b.longitude])
        if (uniqueGridNodes[0].station == edge.station2) return dist2 - dist1
        else return dist1 - dist2
      })

      paths.push(new OutputEdge(points, edge.line, edge.inBetweenStations, edge.color))
    });

    return new OutputGraph(this._octiGraph.width, this._octiGraph.height, stations, paths);
  }

  private euclideanDistance(point1: number[], point2: number[]) {
    return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2))
  }
}
