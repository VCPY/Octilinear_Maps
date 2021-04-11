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

  raiseLineDegreeByOne() {
    this._lineDegree += 1
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
  private _nodes: Station[] = [];
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

  getAdjacentNodes(nodeID: string){
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
