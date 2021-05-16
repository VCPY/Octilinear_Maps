import {BinaryHeap} from "./binaryHeap";
import {Constants} from "../octiGraph/constants";
import {OctiGraph} from "../octiGraph/octiGraph";
import {OctiNode} from "../octiGraph/octiNode";
import {OctiEdge} from "../octiGraph/octiEdge";
import {GridNode} from "../octiGraph/gridNode";

/* Used for profiling dijkstra performance */
export let totalTime = 0;
export let sectionTime = 0;

export function resetTime() {
  totalTime = 0;
  sectionTime = 0;
}

/**
 * Calculates the set to set shortest path
 */
export function setToSet(graph: OctiGraph, from: GridNode[], to: GridNode[]): OctiNode[] {
  var start1 = performance.now();

  const toSinks = to.flatMap(toGridNode => toGridNode.getOctiNode(Constants.SINK));

  graph.allNodes.forEach(node => {
    node.dist = Infinity;
    node.priority = Infinity;
    node.prev = node;
  });

  // create a temporary node and add an each to each starting sink node
  const tmpNode = new OctiNode(from[0], -1);
  from
    .map(startNode => startNode.getOctiNode(Constants.SINK))
    .forEach(startNode => tmpNode.addEdge(new OctiEdge(tmpNode, startNode, 0)));
  tmpNode.dist = 0;
  tmpNode.priority = 0;

  var start2 = performance.now();
  let Q = new BinaryHeap<OctiNode>(comparator);
  Q.push(tmpNode);
  let found = 0;
  sectionTime += performance.now() - start2;
  while (Q.size() > 0) {
    const u = Q.pop();

    // no no node with non infinty lenght remaining
    if (u.dist == Infinity) {
      if (found > 0) {
        totalTime += performance.now() - start1;
        return createPath(tmpNode, toSinks);
      }
      // fail if we haven't reached any of the to nodes
      else break;
    }

    if (toSinks.includes(u)) {
      found++;
      if (toSinks.length == found) {
        totalTime += performance.now() - start1;
        return createPath(tmpNode, toSinks);
      }
    }

    u.edges.forEach(edge => {
      const v = edge.getNeighbourOf(u);
      const alt = u.dist + edge.weight;

      if (alt < v.dist) {
        v.dist = alt;
        v.priority = alt + heuristic(v, to);
        v.prev = u;

        if (!Q.has(v))
          Q.push(v);
        else
          Q.update(v);
      }
    });
  }

  totalTime += performance.now() - start1;
  return [];
}

function heuristic(from: OctiNode, to: GridNode[]): number {
  return Constants.COST_HOP * Math.min(...to.map(toNode => dist(from.gridNode, toNode) - 1));
}

function dist(from: GridNode, to:GridNode): number {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);

  return Math.max(dx, dy);
}

function comparator(a: OctiNode, b: OctiNode): number {
  return b.priority - a.priority;
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
