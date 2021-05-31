import {Station} from "../inputGraph/station";
import {Vector2} from "../util";

export class OutputEdge {

  private _points: Vector2[];
  private _lines: string[];
  private _inBetweenStations: string[] = [];
  private _color: string

  constructor(points: Vector2[], line: string[], inBetweenStations: Station[], color: string) {
    this._points = points;
    this._lines = line;
    this._inBetweenStations = inBetweenStations?.map(station => station.stationName);
    this._color = color
  }


  get points(): Vector2[] {
    return this._points;
  }

  get lines(): string[] {
    return this._lines;
  }

  get inBetweenStations(): string[] {
    return this._inBetweenStations;
  }

  get color(): string {
    return this._color;
  }
}