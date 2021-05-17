import {Station} from "../inputGraph/station";
import {Vector2} from "../util";

export class OutputEdge {

  private _points: Vector2[];
  private _lines: string[];
  private _inBetweenStations: string[] = [];


  constructor(points: Vector2[], line: string[], inBetweenStations: Station[]) {
    this._points = points;
    this._lines = line;
    this._inBetweenStations = inBetweenStations?.map(station => station.stationName);
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
}