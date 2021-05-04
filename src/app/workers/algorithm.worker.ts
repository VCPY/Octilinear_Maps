/// <reference lib="webworker" />

import * as algo from "../octi-algorithm/octiMaps.algorithm";
import * as dijkstra from "../octi-algorithm/dijkstra.algorithm";
import {InputEdge, InputGraph, Station} from "../graphs/graph.classes";
import {plainToClass} from 'class-transformer'
import {Constants, GridNode, OctiGraph, OctiNode} from "../graph/octiGraph.classes";
import {parseOctiGraphForOutput, parsePathsForOutput} from "../graph/octiGraph.outputParser";

addEventListener('message', ({data}) => {
  console.log("[algorithm-worker] started");
  let inputGraph = plainToClass(InputGraph, data);
  inputGraph.edges = inputGraph.edges.map(e => plainToClass(InputEdge, e));
  inputGraph.nodes = inputGraph.nodes.map(n => plainToClass(Station, n));
  let algorithm = new AlgorithmWorker(inputGraph);
  let algoData = algorithm.performAlgorithm(algo.orderEdges(inputGraph));
  let plainGraphData = parseOctiGraphForOutput(algoData[0] as OctiGraph);
  let plainPathData = parsePathsForOutput(algoData[1] as Map<InputEdge, OctiNode[]>);
  console.log("[algorithm-worker] finished");
  postMessage([plainGraphData, plainPathData]);
});


class AlgorithmWorker {

  private readonly D: number;
  private readonly r: number;
  private readonly _inputGraph: InputGraph;
  private readonly _octiGraph: OctiGraph;
  private readonly _graphOffset;
  private readonly _ignoreError = true;

  constructor(inputGraph: InputGraph) {
    this.D = algo.calculateAverageNodeDistance(inputGraph) * 0.75;
    this.r = 1;
    this._inputGraph = inputGraph;

    inputGraph.mergeEqualEdges();
    inputGraph.calculateNodeLineDegrees();
    inputGraph.calculateEdgeOrderingAtNode();
    inputGraph.removeNodesWithoutEdges();
    inputGraph.removeTwoDegreeNodes();
    inputGraph.calculateEdgeOrderingAtNode();

    // create octi graph
    let inputSize = inputGraph.getDimensions();
    this._graphOffset = inputGraph.getMinCoordinates();
    this._octiGraph = new OctiGraph(inputSize[0] / this.D, inputSize[1] / this.D);
    //console.log("Octigraph: ", this._octiGraph);

    //this.performAlgorithm(algo.orderEdges(this._inputGraph));
  }

  performAlgorithm(edgeOrdering: InputEdge[]) {
    const settledStations = new Map<Station, GridNode>();
    const foundPaths = new Map<InputEdge, OctiNode[]>();

    // perform algorithm over all edges
    edgeOrdering.forEach(edge => {

      const station1 = this._inputGraph.getNodeByID(edge.station1) as Station;
      const station2 = this._inputGraph.getNodeByID(edge.station2) as Station;

      // some paths won't be found, for now just exclude them
      if (this.isEdgecase(station1, station2)) return;
      if (this.isEdgecase(station2, station1)) return;

      const allCandidates = this.getCandidateNodes(settledStations, station1, station2);
      const from = allCandidates[0];
      const to = allCandidates[1];

      // Check if an edge between the two stations has been routed before
      let path: OctiNode[] = [];
      foundPaths.forEach((value: OctiNode[], key: InputEdge) => {
        if (edge.station2 == key.station2 && edge.station1 == key.station1) {
          path = value;
          return
        }
        if (edge.station2 == key.station1 && edge.station1 == key.station2) {
          path = value.reverse();
          return;
        }
      });
      if (path.length == 0) {
        // Check the circular ordering and block edges if the station has been used before
        if (from.length == 1 && Array.from(settledStations.values()).includes(from[0])) {
          from[0].reserveEdges(edge, station1);
          from[0].addLineBendPenalty();
        }
        if (to.length == 1 && Array.from(settledStations.values()).includes(to[0])) {
          to[0].reserveEdges(edge, station2);
          to[0].addLineBendPenalty();
        }

        try {
          path = dijkstra.setToSet(this._octiGraph, from, to);
        }
        catch (e) {
          if (this._ignoreError) {
            console.log(`No path found for edge: (${station1.stationName} - ${station2.stationName})`)
            return;
          }
          else
            throw new Error(`No path found for edge: (${station1.stationName} - ${station2.stationName})`);
        }
        // Close edges to nodes which would break the circular ordering
        path[0].gridNode.closeInBetweenEdges(edge, station1, path[1]);
        path[path.length - 1].gridNode.closeInBetweenEdges(edge, station2, path[path.length - 2]);
      }
      foundPaths.set(edge, path);

      settledStations.set(station1, path[0].gridNode);
      path[0].gridNode.station = station1;
      settledStations.set(station2, path[path.length - 1].gridNode);
      path[path.length - 1].gridNode.station = station2;

      this.resetSinkCost(from);
      this.resetSinkCost(to);

      for (let i = 0; i < path.length - 1; i++) {
        let one: OctiNode = path[i];
        let two: OctiNode = path[i + 1];
        let octiEdge = one.getEdge(two);
        if (octiEdge != undefined) {
          octiEdge.used = true;
          this._octiGraph.closeDiagonalEdge(octiEdge)
        }
      }

      //to update grid weights (4.3)
      path.forEach(node => node.setWeightOfGridNodeToInfinity());
    });
    console.log("Found paths:", foundPaths);
    return [this._octiGraph, foundPaths];
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
              const penalty = distance1 / this.D * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight = penalty);

              ret1.push(node);
            } else {
              //set penalty on all sink edges
              const penalty = distance2 / this.D * (Constants.COST_MOVE + Constants.COST_HOP);
              node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight = penalty);

              ret2.push(node);
            }
          }
        }
      }
    }

    if (settledStations.has(station1)) {
      let settledStation = settledStations.get(station1) as GridNode;
      settledStation.reopenEdges();
      ret1 = [settledStation];
    }

    if (settledStations.has(station2)) {
      let settledStation = settledStations.get(station2) as GridNode;
      settledStation.reopenEdges();
      ret2 = [settledStation];
    }
    // from, to
    return [ret1, ret2];
  }

  private resetSinkCost(nodes: GridNode[]) {
    nodes.flatMap(node => node.getOctiNode(Constants.SINK).edges)
      .forEach(edge => edge.weight = Constants.SINK);
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
