import {StationStatus} from "../inputGraph/stationStatus";
import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";
import {InputGraph} from "../inputGraph/inputGraph";

function compareByLineDegree(a: Station, b: Station) {
  return b.lineDegree - a.lineDegree
}

function euclideanDistance(station1: Station, station2: Station): number {
  let latDiff = Math.pow((station1.latitude - station2.latitude), 2);
  let longDiff = Math.pow((station1.longitude - station2.longitude), 2);
  return Math.sqrt(latDiff + longDiff);
}


export function orderEdges(graph: InputGraph) {
  // Sort edges by line degree
  graph.nodes.sort(compareByLineDegree);

  let orderedEdges: InputEdge[] = [];

  // Iterate over all unprocessed nodes
  let unprocessedNodes = graph.getNodesByStatus(StationStatus.unprocessed);
  unprocessedNodes.forEach(node => {
    // (2) Set the node as dangling
    node.status = StationStatus.dangling;

    // (3) Get all dangling nodes
    let danglingNodes = graph.getNodesByStatus(StationStatus.dangling);
    while (danglingNodes.length != 0) {

      // Get the node to process
      let nodeHighestDegree = graph.getDanglingNodeWithHighestDegree();

      // Get all adjacent nodes and sort them by line degree
      let incidentEdges: InputEdge[] = graph.getIncidentEdges(nodeHighestDegree);
      let adjacentNodes: Station[] = graph.getAdjacentNodes(nodeHighestDegree);
      adjacentNodes.sort(compareByLineDegree);

      let sortedEdges = [];
      // Iterate over all adjacent nodes
      while (adjacentNodes.length != 0) {
        let adjacentNode = adjacentNodes[0];
        let unprocessedNodesIDs = graph.getAllNotProcessedNodesIDs();
        if (unprocessedNodesIDs.indexOf(adjacentNode.stopID) !== -1) {
          // Adjacent node has not been processed yet, find edges leading to the node
          for (let i = 0; i < incidentEdges.length; i++) {
            let edge = incidentEdges[i];
            if (edge.station1.stopID == adjacentNode.stopID || edge.station2.stopID == adjacentNode.stopID) {
              // Found an edge leading to the adjacent node, remove the processed edge
              sortedEdges.push(edge);
              incidentEdges.splice(i, 1);
              i--;
            }
          }
        }
        // Remove the processed adjacent node
        adjacentNodes.shift();
      }

      // All adjacent nodes have been checked, set the node as processed
      graph.setNodeAsProcessed(nodeHighestDegree);

      // Add the new edges to the ordered edges
      orderedEdges = orderedEdges.concat(sortedEdges);
      // Update the dangling nodes
      danglingNodes = graph.getNodesByStatus(StationStatus.dangling);
    }
  });

  return orderedEdges;
}

/**
 * Calculates the average distance between adjacent nodes. Needed to calculate constants
 */
export function calculateAverageNodeDistance(graph: InputGraph): number {
  let sum: number = 0;
  graph.edges.forEach(edge => {
    sum += euclideanDistance(edge.station1, edge.station2);
  });
  return sum / graph.edges.length;
}


