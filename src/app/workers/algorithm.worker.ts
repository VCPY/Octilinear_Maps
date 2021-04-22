/// <reference lib="webworker" />

import * as algo from "../octi-algorithm/octiMaps.algorithm";
import * as dijkstra from "../octi-algorithm/dijkstra.algorithm";
import {InputEdge, InputGraph, Station} from "../graphs/graph.classes";
import {plainToClass} from 'class-transformer'
import {Constants, GridNode, OctiGraph, OctiNode} from "../graph/octiGraph.classes";

addEventListener('message', ({data}) => {
  console.log("[algorithm-worker] started");
  let inputGraph = plainToClass(InputGraph, data);
  new AlgorithmWorker(inputGraph);
  postMessage(inputGraph);
});


class AlgorithmWorker {

  private readonly D: number;
  private readonly r: number;
  private readonly _inputGraph: InputGraph;
  private readonly _octiGraph: OctiGraph;
  private readonly _graphOffset;

  constructor(inputGraph: InputGraph) {
    this.D = 0.5;
    this.r = 1;
    this._inputGraph = inputGraph;

    inputGraph.calculateNodeLineDegrees();
    inputGraph.calculateEdgeOrderingAtNode();

    // create octi graph
    let inputSize = inputGraph.getDimensions();
    this._graphOffset = inputGraph.getMinCoordinates();
    this._octiGraph = new OctiGraph(inputSize[0] / this.D, inputSize[1] / this.D);
    console.log("Octigraph: ", this._octiGraph);

    this.performAlgorithm(algo.orderEdges(this._inputGraph));
  }

  private performAlgorithm(edgeOrdering: InputEdge[]) {
    const settledStations = new Map<Station, GridNode>();
    const foundPaths = new Map<InputEdge, OctiNode[]>();

    // perform algorithm over all edges
    edgeOrdering.forEach(edge => {

      const station1 = this._inputGraph.getNodeByID(edge.station1) as Station;
      const station2 = this._inputGraph.getNodeByID(edge.station2) as Station;

      let from = this.getCandidateNodes(settledStations, station1);
      let to = this.getCandidateNodes(settledStations, station2)
        .filter(c => !from.includes(c)); //TODO: replace this with voronoi check

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
        if (from.length == 1) from[0].reserveEdges(edge, station1);
        if (to.length == 1) to[0].reserveEdges(edge, station2);

        path = dijkstra.setToSet(this._octiGraph, from, to);

        // Close edges to nodes which would break the circular ordering
        path[0].gridNode.closeInBetweenEdges(edge, station1, path[1]);
        path[path.length - 1].gridNode.closeInBetweenEdges(edge, station2, path[path.length - 2]);
      }
      foundPaths.set(edge, path);

      settledStations.set(station1, path[0].gridNode);
      settledStations.set(station2, path[path.length - 1].gridNode);

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
  }

  private getCandidateNodes(settledStations: Map<Station, GridNode>, station: Station): GridNode[] {
    if (settledStations.has(station)) {
      let settledStation = settledStations.get(station) as GridNode;
      settledStation.reopenEdges();
      return [settledStation as GridNode];
    }

    // convert geo to grid coordinates
    const centerX = (station.longitude - this._graphOffset[0]) / this.D;
    const centerY = (station.latitude - this._graphOffset[1]) / this.D;

    const ret = [];
    for (let i = -this.r; i <= this.r; i++) {
      for (let j = -this.r; j <= this.r; j++) {

        //check for distance to center
        const distance = Math.sqrt(i * i + j * j);
        if (this._octiGraph.hasNode(centerX + i, centerY + j)
          && distance <= this.r) {
          const node = this._octiGraph.getNode(centerX + i, centerY + j);
          ret.push(node);

          //set penalty on all sink edges
          const penalty = distance / this.D * (Constants.COST_MOVE + Constants.COST_HOP);
          node.getOctiNode(Constants.SINK).edges.forEach(edge => edge.weight = penalty);
        }
      }
    }

    return ret;
  }

  private resetSinkCost(nodes: GridNode[]) {
    nodes.flatMap(node => node.getOctiNode(Constants.SINK).edges)
      .forEach(edge => edge.weight = Constants.SINK);
  }
}
