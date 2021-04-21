import 'reflect-metadata';
import { Type } from 'class-transformer'

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
  private _clockwiseOrdering: Array<[InputEdge, InputEdge, number]> = [];  // #From, #To, #ordering
  private _counterClockwiseOrdering: Array<[InputEdge, InputEdge, number]> = []; // #From, #To, #ordering

  constructor() {
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

  get clockwiseOrdering(): Array<[InputEdge, InputEdge, number]> {
    return this._clockwiseOrdering;
  }

  get counterClockwiseOrdering(): Array<[InputEdge, InputEdge, number]> {
    return this._counterClockwiseOrdering;
  }

  raiseLineDegreeByOne() {
    this._lineDegree += 1
  }

  calculateEdgeOrdering(edges: Set<InputEdge>, adjacentNodes: Set<Station>) {
    // Edge ordering not needed if just one neighbour is present
    if (adjacentNodes.size == 1) return;

    let upVector = [0, 1];
    let edgesByAngle: { [id: string]: InputEdge } = {};
    edges.forEach(edge => {
      let adjacentId = (edge.station1 == this.stopID) ? edge.station2 : edge.station1;

      let adjacentNode = Array.from(adjacentNodes).find(obj => obj.stopID === adjacentId) as Station;
      let vectorToNode = [adjacentNode.latitude - this.latitude, adjacentNode.longitude - this.longitude];

      let angle: number = Station.calculateAngleBetweenVectors(upVector, vectorToNode);
      edgesByAngle[angle] = edge;
    });
    let angles: string[] = Object.keys(edgesByAngle).sort(((a, b) => {
      return parseFloat(a)-parseFloat(b);
    }));

    // Compare each edge with each other and note down the ordering
    for (let i = 0; i < angles.length; i++) {
      for (let j = i + 1; j < angles.length; j++) {
        let edge1 = edgesByAngle[angles[i]];
        let edge2 = edgesByAngle[angles[j]];
        let clockwiseOrder = j - i;
        let counterClockWiseOrder = angles.length - clockwiseOrder;
        this._clockwiseOrdering.push([edge1, edge2, clockwiseOrder]);
        this._clockwiseOrdering.push([edge2, edge1, counterClockWiseOrder]);
        this._counterClockwiseOrdering.push([edge1, edge2, counterClockWiseOrder]);
        this._counterClockwiseOrdering.push([edge2, edge1, clockwiseOrder])
      }
    }
  }

  private static calculateAngleBetweenVectors(p1: number[], p2: number[]) {
    let tan = Math.atan2(p2[1], p2[0]) - Math.atan2(p1[1], p1[0]);
    let angle = -1 * tan * (180 / Math.PI);
    if (angle < 0) angle = 360 + angle;

    return angle;
  }
}

export class InputEdge {
  private _station1: string = "";
  private _station2: string = "";
  private _line: string;

  constructor(line: string) {
    this._line = line;
  }


  get station1(): string {
    return this._station1;
  }

  set station1(value: string) {
    this._station1 = value;
  }

  get station2(): string {
    return this._station2;
  }

  set station2(value: string) {
    this._station2 = value;
  }

  get line(): string {
    return this._line;
  }

  set line(value: string) {
    this._line = value;
  }

  equalsByStation(other: InputEdge) {
    if (this.station2 == other.station2 && this.station1 == other.station1) {
      return true;
    } else if (this.station1 == other.station2 && this.station2 == other.station1) {
      return true;
    }
    return false;
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

  getDimensions(){
    
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
      let station1 = edge.station1;
      let station2 = edge.station2;

      let station = this.nodes.find(x => x.stopID == station1);
      if (station !== undefined) {
        station.raiseLineDegreeByOne();
      }
      station = this.nodes.find(x => x.stopID == station2);
      if (station !== undefined) {
        station.raiseLineDegreeByOne()
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
      if (edge.station2 === nodeID || edge.station1 === nodeID) {
        result.push(edge);
      }
    });
    return result;
  }

  getAdjacentNodes(nodeID: string) {
    let nodeIDs: string[] = [];
    this.edges.forEach(edge => {
      if (edge.station2 === nodeID) {
        nodeIDs.push(edge.station1);
      } else if (edge.station1 === nodeID) {
        nodeIDs.push(edge.station2);
      }
    });
    return this.nodes.filter(node => nodeIDs.indexOf(node.stopID) != -1);
  }

  calculateEdgeOrderingAtNode() {
    this.nodes.forEach(node => {
      let adjacentEdges = new Set<InputEdge>();
      let adjacentNodes = new Set<Station>();
      this.edges.forEach(edge => {
        if (edge.station1 == node.stopID) {
          adjacentEdges.add(edge);
          adjacentNodes.add(this.getNodeByID(edge.station2) as Station)
        } else if (edge.station2 == node.stopID) {
          adjacentEdges.add(edge);
          adjacentNodes.add(this.getNodeByID(edge.station1) as Station)
        }
      });
      node.calculateEdgeOrdering(adjacentEdges, adjacentNodes);
    })
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
