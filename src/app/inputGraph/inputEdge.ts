import {Station} from "./station";

/**
 * Represents an edge between two stations. Used in the InputGraph for the algorithm.
 */
export class InputEdge {
  constructor(line: string, station1: Station, station2: Station, color: string) {
    this._line.push(line);
    this._station1 = station1;
    this._station2 = station2;
    if (color == undefined) this._color = "#000000"
    else this._color = color.length < 6 ? "#000000" : color;
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

  /**
   * Array containing the lines which travel along this edge
   * @private
   */
  private _line: string[] = [];

  get line(): string[] {
    return this._line;
  }

  set line(value: string[]) {
    this._line = value;
  }

  /**
   * Stations with a line degree of two which lie on this edge
   * @private
   */
  private _inBetweenStations: Station[] = [];

  get inBetweenStations(): Station[] {
    return this._inBetweenStations;
  }

  set inBetweenStations(value: Station[]) {
    this._inBetweenStations = value;
  }

  private _color: string

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;
  }

  /**
   * Returns the number of lines
   */
  getLineDegree() {
    return this._line.length
  }

  /**
   * Checks if @param other equals this edge by the id of the stations only. The order of the stations is irrelevant.
   * @param other The edge the compare this edge with
   */
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

  otherStation(station: Station): Station {
    if (this.station1 == station) return this.station2;
    return this.station1;
  }
}