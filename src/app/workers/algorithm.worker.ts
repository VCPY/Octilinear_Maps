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
import {parseOctiGraphForOutput, parsePathsForOutput} from "../outputGraph/outputNode";

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

addEventListener('message', ({data}) => {
  console.log("[algorithm-worker] started");

  let inputGraph = extractInputgraph(data);
  let algorithm = new AlgorithmWorker(inputGraph);
  let algoData = algorithm.performAlgorithm(algo.orderEdges(inputGraph));
  let plainGraphData = parseOctiGraphForOutput(algoData[0] as OctiGraph);
  let plainPathData = parsePathsForOutput(algoData[1] as Map<InputEdge, OctiNode[]>);
  console.log("[algorithm-worker] finished");
  postMessage([plainGraphData, plainPathData]);
});

class AlgorithmWorker {

  private readonly D: number;

  /*
  Radius in which nodes around a station are considered
   */
  private readonly r: number;
  private readonly _inputGraph: InputGraph;
  private readonly _octiGraph: OctiGraph;
  private readonly _graphOffset;
  private readonly _ignoreError = true;

  constructor(inputGraph: InputGraph) {
    // prepare the input graph
    inputGraph.mergeEqualEdges();
    inputGraph.calculateNodeLineDegrees();
    inputGraph.calculateEdgeOrderingAtNode();
    inputGraph.removeNodesWithoutEdges();

    this.D = algo.calculateAverageNodeDistance(inputGraph) * 0.75;

    inputGraph.removeTwoDegreeNodes();

    this.r = 1;
    this._inputGraph = inputGraph;

    // create octi graph
    let inputSize = inputGraph.getDimensions();
    this._graphOffset = inputGraph.getMinCoordinates();
    this._octiGraph = new OctiGraph(inputSize[0] / this.D, inputSize[1] / this.D);
  }

  /* Runs the algorithm with an edge ordering */
  performAlgorithm(edgeOrdering: InputEdge[]) {
    const settledStations = new Map<Station, GridNode>();
    const foundPaths = new Map<InputEdge, OctiNode[]>();

    // perform algorithm over all edges
    edgeOrdering.forEach(edge => {

      const station1 = edge.station1;
      const station2 = edge.station2;

      // some paths won't be found, for now just exclude them
      if (this.isEdgecase(station1, station2)) return;
      if (this.isEdgecase(station2, station1)) return;

      const allCandidates = this.getCandidateNodes(settledStations, station1, station2);
      const from = allCandidates[0];
      const to = allCandidates[1];


      if (this.isSettled(from, settledStations)) {
        // Block sink edges to ensure this routing won't block a future routing
        from[0].blockForCircularOrdering(station2);
        from[0].addLineBendPenalty();
      }
      if (this.isSettled(to, settledStations)) {
        // Block sink edges to ensure this routing won't block a future routing
        to[0].blockForCircularOrdering(station1);
        to[0].addLineBendPenalty();
      }

      let path = dijkstra.setToSet(this._octiGraph, from, to);
      if (path.length == 0 && this._ignoreError) {
        console.log(`No path found for edge: (${station1.stationName} - ${station2.stationName})`)
        return;
      } else if (path.length == 0)
        throw new Error(`No path found for edge: (${station1.stationName} - ${station2.stationName})`);

      foundPaths.set(edge, path);

      // save the settled stations
      settledStations.set(station1, path[0].gridNode);
      path[0].gridNode.station = station1;
      settledStations.set(station2, path[path.length - 1].gridNode);
      path[path.length - 1].gridNode.station = station2;

      // sotre routing in grid  nodes
      path[0].gridNode.saveRouting(station2, path[1].direction, edge);
      path[path.length - 1].gridNode.saveRouting(station1, path[path.length - 2].direction, edge);

      // Prevent paths from crossing (4.3)
      path.map(node => node.gridNode)
        .forEach(node => {
          node.closeSinkEdge();
          node.closeBendEdges();
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
          this._octiGraph.closeDiagonalEdge(octiEdge)
        }
      }
    });

    return [this._octiGraph, foundPaths];
  }

  private isSettled(from: GridNode[], settledStations: Map<Station, GridNode>): boolean {
    if (from.length != 1) return false;
    return Array.from(settledStations.values()).includes(from[0]);
  }

  private isEdgecase(station1: Station, station2: Station): boolean {
    // might be needed again

    return false;
  }

  private getCandidateNodes(settledStations: Map<Station, GridNode>, station1: Station, station2: Station): GridNode[][] {
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
          if (Array.from(settledStations.values()).includes(node)) break;

          // check distance to both stations, assign to lower
          const distance1 = Math.sqrt((coordinates1.x - x) * (coordinates1.x - x) + (coordinates1.y - y) * (coordinates1.y - y));
          const distance2 = Math.sqrt((coordinates2.x - x) * (coordinates2.x - x) + (coordinates2.y - y) * (coordinates2.y - y));
          if (distance1 <= this.r || distance2 <= this.r) {
            if (distance1 < distance2) {
              //set penalty on all sink edges
              const penalty = distance1 * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight += penalty);

              ret1.push(node);
            } else {
              //set penalty on all sink edges
              const penalty = distance2 * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight += penalty);

              ret2.push(node);
            }
          }
        }
      }
    }

    if (settledStations.has(station1)) {
      let settledStation = settledStations.get(station1) as GridNode;
      settledStation.reopenSinkEdges();
      ret1 = [settledStation];
    }

    if (settledStations.has(station2)) {
      let settledStation = settledStations.get(station2) as GridNode;
      settledStation.reopenSinkEdges();
      ret2 = [settledStation];
    }
    // from, to
    return [ret1, ret2];
  }

  private getGrapCoordinates(station: Station): Vector2 {
    return new Vector2(
      (station.longitude - this._graphOffset[0]) / this.D,
      (station.latitude - this._graphOffset[1]) / this.D);
  }
}

class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}
