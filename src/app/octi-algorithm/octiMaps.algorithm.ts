import {InputEdge, InputGraph, Station, StationStatus} from "../graphs/graph.classes";

export function orderEdges(graph: InputGraph) {
  // Set the line degree for each node and sort them by line degree
  graph.calculateNodeLineDegrees();
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
            if (edge.station1 == adjacentNode.stopID || edge.station2 == adjacentNode.stopID) {
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

function compareByLineDegree(a: Station, b: Station) {
  return b.lineDegree - a.lineDegree
}


