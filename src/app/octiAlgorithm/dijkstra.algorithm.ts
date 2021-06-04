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

/** Optimization:
 * store each node that gets modified in a dijkstra run, this allows us to reset only modified nodes and
 * avoid iterating over all nodes at the start of each run. */
let lastModified: OctiNode[] = [];

/**
 * Calculates the set to set shortest path using the dijkstra algorithm
 *
 * For better performance multiple optimizations have been made:
 *   a binary heap is used to efficiently get candidate nodes
 *   a heuristic function is used to reach the target with visiting less nodes
 *   only a minimal amount of nodes geth visited and processed
 */
export function setToSet(graph: OctiGraph, from: GridNode[], to: GridNode[]): OctiNode[] {
  var start1 = performance.now();

  const toSinks = to.flatMap(toGridNode => toGridNode.getOctiNode(Constants.SINK));

  lastModified.forEach(node => {
    node.dist = Infinity;
    node.priority = Infinity;
    node.prev = node;
  });
  lastModified = [];

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

    // no no node with non infintiy length remaining
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

        if (!Q.has(v)) {
          lastModified.push(v);
          Q.push(v);
        }
        else
          Q.update(v);
      }
    });
  }

  totalTime += performance.now() - start1;
  return [];
}

/**
 * The heuristic function used in the dijkstra algorithm provided by the paper.
 * We can estimate the path length by getting the shortest Chebyshev distance between the current node and all candidate nodes.
 * @param from
 * @param to
 */
function heuristic(from: OctiNode, to: GridNode[]): number {
  let min = Infinity;
  to.forEach(toNode => {
    const h = chebyshevDist(from.gridNode, toNode) - 1;
    if (h < min) min = h;
  })

  return Constants.COST_HOP * min;
}

/**
 * Chebyshev distance between two nodes has a cost of 1 when walking in any direction
 * @param from
 * @param to
 */
function chebyshevDist(from: GridNode, to:GridNode): number {
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);

  return Math.max(dx, dy);
}

/**
 * The comparison function used for the binary heap.
 * OctiNodes are sorted by priority.
 * @param a
 * @param b
 */
function comparator(a: OctiNode, b: OctiNode): number {
  return b.priority - a.priority;
}

/**
 * Traverse the the grid backwards and gather all nodes forming the path.
 * @param tmpNode
 * @param toNodes
 */
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

/**
 * Get the toNode with lowest dist
  */
function min(nodes: OctiNode[]): OctiNode {
  return nodes.reduce((r, e) => r.dist < e.dist ? r : e);
}
