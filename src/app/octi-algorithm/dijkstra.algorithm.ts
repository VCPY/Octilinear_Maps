let Heap = require("heap")
import {GridNode, OctiGraph, OctiNode, Constants, OctiEdge} from "../graph/octiGraph.classes";
import PriorityQueue from "../../../node_modules/ts-priority-queue";

/**
 * Calculates the set to set shortest path
 */
export function setToSet(graph: OctiGraph, from: GridNode[], to: GridNode[]): OctiNode[] {

  const toSinks = to.flatMap(toGridNode => toGridNode.getOctiNode(Constants.SINK));

  graph.allNodes.forEach(node => {
    node.dist = Infinity;
    node.prev = node;
  });
  
  // create a temporary node and add an each to each starting sink node
  const tmpNode = new OctiNode(from[0], -1);
  from
    .map(startNode => startNode.getOctiNode(Constants.SINK))
    .forEach(startNode => tmpNode.addEdge(new OctiEdge(tmpNode, startNode, 0)));
  tmpNode.dist = 0;

  //const Q = new PriorityQueue<OctiNode>({ comparator: comparator, initialValues: [tmpNode, ...graph.allNodes]});
  let Q = [tmpNode, ...graph.allNodes];

  let found = 0;
  while (Q.length > 0) {
    //TODO: replace with priority queue for better performance
    
    const u = min(Q);
    
    Q = Q.filter(n => n != u);

    if (toSinks.includes(u)) {
      found++;
      if (toSinks.length == found)
        return createPath(tmpNode, toSinks);
    }

    u.edges.forEach(edge => {
      const v = edge.getNeighbourOf(u);
      const alt = u.dist + edge.weight;
      if (alt < v.dist) {
        v.dist = alt;
        v.prev = u;
      }
    });
  }

  throw new Error("No path found");
}

function comparator(a: OctiNode, b: OctiNode): number {
  return b.dist - a.dist;
}

function createPath(tmpNode: OctiNode, toNodes: OctiNode[]): OctiNode[] {
  
  const to = min(toNodes);
  const ret = [to];
  
  let u = to;
  // prev is self if not set;
  while (u.prev != tmpNode && u.prev != u) {
    u = u.prev;
    ret.push(u);
  }

  return ret.reverse();
}

// get the toNode with lowest dist
function min(nodes: OctiNode[]): OctiNode {
  return nodes.reduce((r, e) => r.dist < e.dist ? r : e);
}