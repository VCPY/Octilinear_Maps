import 'reflect-metadata';
import {Type} from 'class-transformer'
import {CircularEdgeOrdering} from "../graph/octiGraph.classes";
import {calculateAngleBetweenVectors} from "./graph.calculation";

export enum StationStatus {
  unprocessed,
  dangling,
  processed
}

export class Station {
  private _latitude: number = 0;
  private _longitude: number = 0;
  private _stationName: string = "";
  private _stopID: string = "";
  private _lineDegree: number = 0;
  private _status: StationStatus = StationStatus.unprocessed;
  private _clockwiseOrdering: CircularEdgeOrdering[] = [];
  private _counterClockwiseOrdering: CircularEdgeOrdering[] = [];
  private _edgesByAngle: { [id: string]: InputEdge } = {};
  private _adjacentNodes: Set<Station> = new Set();

  constructor() {
  }

  get adjacentNodes(): Set<Station> {
    return this._adjacentNodes;
  }

  set adjacentNodes(value: Set<Station>) {
    this._adjacentNodes = value;
  }

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
    this._latitude = value;
  }

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;
  }

  get stationName(): string {
    return this._stationName;
  }

  set stationName(value: string) {
    this._stationName = value;
  }

  get stopID(): string {
    return this._stopID;
  }

  set stopID(value: string) {
    this._stopID = value;
  }

  get lineDegree(): number {
    return this._lineDegree;
  }

  set lineDegree(value: number) {
    this._lineDegree = value;
  }

  get status(): StationStatus {
    return this._status;
  }

  set status(value: StationStatus) {
    this._status = value;
  }

  get clockwiseOrdering(): CircularEdgeOrdering[] {
    return this._clockwiseOrdering;
  }

  get counterClockwiseOrdering(): CircularEdgeOrdering[] {
    return this._counterClockwiseOrdering;
  }

  get edgesByAngle(): { [p: string]: InputEdge } {
    return this._edgesByAngle;
  }

  raiseLineDegreeBy(amount: number) {
    this._lineDegree += amount
  }

  calculateEdgeOrdering(edges: Set<InputEdge>, adjacentNodes: Set<Station>) {
    // Edge ordering not needed if just one neighbour is present
    if (adjacentNodes.size == 1) return;

    this._edgesByAngle = {};
    this._clockwiseOrdering = [];
    this._counterClockwiseOrdering = [];
    let upVector = [0, 1];
    edges.forEach(edge => {
      let adjacentId = (edge.station1!.stopID == this.stopID) ? edge.station2!.stopID : edge.station1!.stopID;

      let adjacentNode = Array.from(adjacentNodes).find(obj => obj.stopID === adjacentId) as Station;
      let vectorToNode = [adjacentNode.latitude - this.latitude, adjacentNode.longitude - this.longitude];

      let angle: number = calculateAngleBetweenVectors(upVector, vectorToNode);
      this._edgesByAngle[angle] = edge;
    });

    let angles: string[] = Object.keys(this._edgesByAngle).sort((a, b) => parseFloat(b) - parseFloat(a));

    // Compare each edge with each other and note down the ordering
    for (let i = 0; i < angles.length; i++) {
      for (let j = i + 1; j < angles.length; j++) {
        let edge1 = this._edgesByAngle[angles[i]];
        let edge2 = this._edgesByAngle[angles[j]];
        let clockwiseOrder = j - i;
        let counterClockwiseOrder = angles.length - clockwiseOrder;

        let inBetweenEdges = this.getInBetweenEdges(i, j, angles);
        let inBetweenEdgesCounter = this.getInBetweenEdges(j, i, angles);

        this._clockwiseOrdering.push(new CircularEdgeOrdering(edge1, edge2, clockwiseOrder, inBetweenEdges));
        this._clockwiseOrdering.push(new CircularEdgeOrdering(edge2, edge1, counterClockwiseOrder, inBetweenEdgesCounter));
        this._counterClockwiseOrdering.push(new CircularEdgeOrdering(edge1, edge2, counterClockwiseOrder, inBetweenEdgesCounter));
        this._counterClockwiseOrdering.push(new CircularEdgeOrdering(edge2, edge1, clockwiseOrder, inBetweenEdges));
      }
    }
  }

  private getInBetweenEdges(start: number, end: number, angles: string[]) {
    let inBetweenEdges = [];

    let index = start + 1;
    if (index == angles.length) index = 0;
    while (index != end) {
      inBetweenEdges.push(this._edgesByAngle[angles[index]]);
      index += 1;
      if (index >= angles.length) index = 0;
    }
    return inBetweenEdges;
  }

  replaceStation(before: string, after: Station) {
    let nodeArray = Array.from(this.adjacentNodes);
    for (let i = 0; i < this.adjacentNodes.size; i++) {
      let node = nodeArray[i];
      if (node.stopID == before) {
        nodeArray[i] = after;
        break;
      }
    }
    this.adjacentNodes = new Set<Station>(nodeArray);
  }
}

export class InputEdge {
  private _station1: Station;
  private _station2: Station;
  private _line: string[] = [];
  private _inBetweenStations: Station[] = [];

  constructor(line: string, station1: Station, station2: Station) {
    this._line.push(line);
    this._station1 = station1;
    this._station2 = station2;
  }


  get station1(): Station {
    return this._station1;
  }

  set station1(value: Station) {
    this._station1 = value;
  }

  get station2(): Station {
    return this._station2;
  }

  set station2(value: Station) {
    this._station2 = value;
  }

  get inBetweenStations(): Station[] {
    return this._inBetweenStations;
  }

  set inBetweenStations(value: Station[]) {
    this._inBetweenStations = value;
  }

  getLineDegree() {
    return this._line.length
  }

  get line(): string[] {
    return this._line;
  }

  set line(value: string[]) {
    this._line = value;
  }

  equalsByStation(other: InputEdge) {
    if (this.station2.stopID == other.station2.stopID && this.station1.stopID == other.station1.stopID) {
      return true;
    } else if (this.station1.stopID == other.station2.stopID && this.station2.stopID == other.station1.stopID) {
      return true;
    }
    return false;
  }

  addLine(line: string[]) {
      this._line.push(...line)
  }
}

export class Line {
  private _name: String;
  private _color: String;

  constructor(name: String, color: String) {
    this._name = name;
    this._color = color;
  }


  get name(): String {
    return this._name;
  }

  set name(value: String) {
    this._name = value;
  }

  get color(): String {
    return this._color;
  }

  set color(value: String) {
    this._color = value;
  }
}

export class InputGraph {
  @Type(() => Station)
  private _nodes: Station[] = [];

  @Type(() => InputEdge)
  private _edges: InputEdge[] = [];

  constructor() {
  }


  get nodes(): Station[] {
    return this._nodes;
  }

  set nodes(value: Station[]) {
    this._nodes = value;
  }

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
          if (!foundFirstEdge){
            if (edge.station2.stopID == node.stopID || edge.station1.stopID == node.stopID){
              newEdge = edge;
              if (edge.station2.stopID == node.stopID){
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
}

export class Trip {
  tripID: string = "";
  routeID: string = "";
  routeShortName: string = "";
  stops = new Map();

  constructor(tripID: string) {
    this.tripID = tripID
  }

  addStop(id: string, sequence: number) {
    this.stops.set(sequence, id);
  }

}

export function getLargerTrip(trip1: Trip, trip2: Trip): Trip {
  let sequences1 = trip1.stops.size;
  let sequences2 = trip2.stops.size;

  if (sequences2 > sequences1) {
    return trip2;
  } else {
    return trip1;
  }
}
