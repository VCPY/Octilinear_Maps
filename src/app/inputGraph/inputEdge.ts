import {Station} from "./station";

/**
 * Represents a connection between two stations. Used in the InputGraph for the algorithm.
 */
export class InputEdge {
  constructor(line: string, station1: Station, station2: Station, color: string, routeType: string) {
    this._line.push(line);
    this._station1 = station1;
    this._station2 = station2;
    if (color == undefined) this._color.push("#000000");
    else this._color.push(color.length < 6 ? "#000000" : color);
    this._routeType = routeType;
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

  /**
   * The colors of the lines for drawing the graph.
   * @private
   */
  private _color: string[] = []

  get color(): string[] {
    return this._color;
  }

  set color(value: string[]) {
    this._color = value;
  }

  /**
   * The type of this route, following the gtfs specification
   *
   * This is only valid before merging multiple edges. Use this obnly in the filtering stage.
   */
  private _routeType: string = "";

  get routeType(): string {
    return this._routeType;
  }

  /**
   * Returns the number of lines stored in this._line
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

  /**
   * Adds a line to this._line
   * @param line
   */
  addLine(line: string[], color: string[]) {
    this._line.push(...line);
    this._color.push(...color);
  }

  /**
   * Given a station, this method retrieves the according other station. Both are part of this edge.
   * @param station
   */
  otherStation(station: Station): Station {
    if (this.station1 == station) return this.station2;
    return this.station1;
  }
}