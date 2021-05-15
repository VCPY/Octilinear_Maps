import 'reflect-metadata';
import {Type} from "class-transformer";
import {Station} from "./station";
import {InputEdge} from "./inputEdge";
import {StationStatus} from "./stationStatus";

export class InputGraph {
  constructor() {
  }

  @Type(() => Station)
  private _nodes: Station[] = [];

  get nodes(): Station[] {
    return this._nodes;
  }

  set nodes(value: Station[]) {
    this._nodes = value;
  }

  @Type(() => InputEdge)
  private _edges: InputEdge[] = [];

  get edges(): InputEdge[] {
    return this._edges;
  }

  set edges(value: InputEdge[]) {
    this._edges = value;
  }

  getMinCoordinates() {
    let minX = Infinity;
    let minY = Infinity;

    let min = this.nodes.forEach(n => {
      if (n.longitude < minX) minX = n.longitude;
      if (n.latitude < minY) minY = n.latitude;
    });

    return [minX, minY];
  }

  getDimensions() {

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    let min = this.nodes.forEach(n => {
      if (n.longitude < minX) minX = n.longitude;
      if (n.longitude > maxX) maxX = n.longitude;
      if (n.latitude < minY) minY = n.latitude;
      if (n.latitude > maxY) maxY = n.latitude;
    });

    return [maxX - minX, maxY - minY];
  }

  getNodesByStatus(status: StationStatus): Station[] {
    return this.nodes.filter(node => node.status == status)
  }

  getNodeIDsByStatus(status: StationStatus): string[] {
    let nodes = this.getNodesByStatus(status);
    return nodes.map(node => node.stopID);
  }

  getNodeByID(id: string): Station | undefined {
    return this._nodes.find(x => x.stopID == id);
  }

  getAllNotProcessedNodesIDs(): string[] {
    let result = this.getNodeIDsByStatus(StationStatus.unprocessed);
    return result.concat(this.getNodeIDsByStatus(StationStatus.dangling));
  }

  setNodeAsProcessed(id: string) {
    let node = this.getNodeByID(id);
    if (node != undefined) {
      node.status = StationStatus.processed;
    }
  }

  calculateNodeLineDegrees() {
    this.edges.forEach(edge => {
      let station1 = edge.station1.stopID;
      let station2 = edge.station2.stopID;

      let station = this.nodes.find(x => x.stopID == station1);
      if (station !== undefined) {
        station.raiseLineDegreeBy(edge.getLineDegree());
      }
      station = this.nodes.find(x => x.stopID == station2);
      if (station !== undefined) {
        station.raiseLineDegreeBy(edge.getLineDegree())
      }
    });
  }

  /**
   * Checks all nodes with the status "dangling" and returns the one with the highest line degree
   */
  getDanglingNodeWithHighestDegree(): string {
    let highestDegree = -1;
    let danglingNodeIndex = -1;
    let danglingNodes = this.getNodesByStatus(StationStatus.dangling);
    for (let i = 0; i < danglingNodes.length; i++) {
      let currentNode = this.getNodeByID(danglingNodes[i].stopID);
      if (currentNode !== undefined && currentNode.lineDegree > highestDegree) {
        highestDegree = currentNode.lineDegree;
        danglingNodeIndex = i;
      }
    }
    return danglingNodes[danglingNodeIndex].stopID
  }

  getIncidentEdges(nodeID: string): InputEdge[] {
    let result: InputEdge[] = [];
    this.edges.forEach(edge => {
      if (edge.station2.stopID === nodeID || edge.station1.stopID === nodeID) {
        result.push(edge);
      }
    });
    return result;
  }

  getAdjacentNodes(nodeID: string) {
    let nodeIDs: string[] = [];
    this.edges.forEach(edge => {
      if (edge.station2.stopID === nodeID) {
        nodeIDs.push(edge.station1.stopID);
      } else if (edge.station1.stopID === nodeID) {
        nodeIDs.push(edge.station2.stopID);
      }
    });
    return this.nodes.filter(node => nodeIDs.indexOf(node.stopID) != -1);
  }

  calculateEdgeOrderingAtNode() {
    this.nodes.forEach(node => {
      let adjacentEdges = new Set<InputEdge>();
      let adjacentNodes = new Set<Station>();
      this.edges.forEach(edge => {
        if (edge.station1.stopID == node.stopID) {
          adjacentEdges.add(edge);
          adjacentNodes.add(this.getNodeByID(edge.station2.stopID) as Station)
        } else if (edge.station2.stopID == node.stopID) {
          adjacentEdges.add(edge);
          adjacentNodes.add(this.getNodeByID(edge.station1.stopID) as Station)
        }
      });
      if (adjacentNodes.size != 0 && adjacentEdges.size != 0) {
        node.calculateEdgeOrdering(adjacentEdges, adjacentNodes);
        node.adjacentNodes = adjacentNodes;
      }
    })
  }

  removeTwoDegreeNodes() {
    for (let i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i];
      if (node.adjacentNodes.size == 2) {
        let adjacentNodes = Array.from(node.adjacentNodes);
        let foundFirstEdge = false;
        let newEdge: InputEdge;
        for (let j = 0; j < this.edges.length; j++) {
          let edge = this.edges[j];
          if (!foundFirstEdge) {
            if (edge.station2.stopID == node.stopID || edge.station1.stopID == node.stopID) {
              newEdge = edge;
              if (edge.station2.stopID == node.stopID) {
                edge.inBetweenStations.push(edge.station2);
                edge.station2 = edge.station1.stopID == adjacentNodes[0].stopID ? adjacentNodes[1] : adjacentNodes[0];
              } else {
                edge.inBetweenStations.push(edge.station1);
                edge.station1 = edge.station2.stopID == adjacentNodes[0].stopID ? adjacentNodes[1] : adjacentNodes[0];
              }
              adjacentNodes[0].replaceStation(node.stopID, adjacentNodes[1]);
              adjacentNodes[1].replaceStation(node.stopID, adjacentNodes[0]);
              foundFirstEdge = true;
            }
          }
          if ((edge.station1.stopID == node.stopID || edge.station2.stopID == node.stopID) && foundFirstEdge) {
            newEdge!.inBetweenStations.push(...this.edges[j].inBetweenStations);
            this.edges.splice(j, 1);
            break;
          }
        }
      }
    }
  }

  removeNodesWithoutEdges() {
    for (let i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i];
      if (node.adjacentNodes.size == 0) {
        this.nodes.splice(i, 1);
        i--;
      }
    }
  }

  mergeEqualEdges() {
    let result: InputEdge[] = [];
    for (let i = 0; i < this._edges.length; i++) {
      let edge = this._edges[i];
      let equalEdge = this.containsEdge(result, edge);
      if (equalEdge != undefined) {
        equalEdge.addLine(edge.line)
      } else {
        result.push(edge);
      }
    }
    this._edges = result;
  }

  private containsEdge(array: InputEdge[], edge: InputEdge) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].equalsByStation(edge)) {
        return array[i]
      }
    }
    return undefined;
  }

  getEdgeBetween(station: Station, otherStation: Station): InputEdge | undefined {
    return this.edges.find(e => e.contains(station) && e.contains(otherStation));
  }
}