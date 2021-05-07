import {Station} from "../inputGraph/station";

export class OutputEdge {
  private _station1ID: string = "";
  private _station2ID: string = "";
  private _station1Name: string = "";
  private _station2Name: string = "";
  private _line: string[];
  private _inBetweenStations: string[] = [];


  constructor(station1ID: string, station2ID: string, station1Name: string, station2Name: string, line: string[]) {
    this._station1ID = station1ID;
    this._station2ID = station2ID;
    this._station1Name = station1Name;
    this._station2Name = station2Name;
    this._line = line;
  }

  addInBetweenStations(stations: Station[]) {
    this._inBetweenStations = stations.map(station => station.stationName)
  }
}