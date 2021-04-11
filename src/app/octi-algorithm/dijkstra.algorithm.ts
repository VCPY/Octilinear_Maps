import {OctiGraph} from "../graph/octiGraph.classes";

export function calculateShortestPath(graph: OctiGraph, startNodeID: string, endNodeID: string): string[] {
  const Graph = require('node-dijkstra');
  let gridNodes = graph.gridNodes;
  const route = new Graph();

  for (let i = 0; i < graph.width; i++) {
    for (let j = 0; j < graph.height; j++) {
      let node = gridNodes[i][j];
      let neighbours: { [id: string]: number } = {};
      for (let a = -1; a <= 1; a++) {
        if (i + a < 0 || i + a > graph.width - 1) {
          continue;
        }
        for (let b = -1; b <= 1; b++) {
          if (j + b < 0 || j + b > graph.height - 1) {
            continue;
          }
          if (a == 0 && b == 0) {
            continue;
          }
          let neighbourNode = gridNodes[i + a][j + b];
          //TODO: Consider weights and replace the one
          neighbours["" + neighbourNode.id] = 1;
        }
      }
      route.addNode("" + node.id, neighbours);
    }
  }

  return route.path(startNodeID, endNodeID);
}
