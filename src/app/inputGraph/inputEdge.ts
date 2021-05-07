import {Station} from "./station";

export class InputEdge {
  constructor(line: string, station1: Station, station2: Station) {
    this._line.push(line);
    this._station1 = station1;
    this._station2 = station2;
  }

  private _station1: Station;

  get station1(): Station {
    return this._station1;
  }

  set station1(value: Station) {
    this._station1 = value;
  }

  private _station2: Station;

  get station2(): Station {
    return this._station2;
  }

  set station2(value: Station) {
    this._station2 = value;
  }

  private _line: string[] = [];

  get line(): string[] {
    return this._line;
  }

  set line(value: string[]) {
    this._line = value;
  }

  private _inBetweenStations: Station[] = [];

  get inBetweenStations(): Station[] {
    return this._inBetweenStations;
  }

  set inBetweenStations(value: Station[]) {
    this._inBetweenStations = value;
  }

  getLineDegree() {
    return this._line.length
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