export class Station {
  private _latitude: number = 0;
  private _longitude: number = 0;
  private _stationName: string = "";
  private _stopID: string = "";


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
}

export class InputEdge {
  private _station1: Station = new Station();
  private _station2: Station = new Station();
  private _line: string;

  constructor(line: string) {
    this._line = line;
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
