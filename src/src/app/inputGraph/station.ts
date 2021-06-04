import {StationStatus} from "./stationStatus";
import {InputEdge} from "./inputEdge";
import {calculateAngleBetweenVectors} from "../util";

export class Station {
  constructor() {
  }

  private _latitude: number = 0;

  get latitude(): number {
    return this._latitude;
  }

  set latitude(value: number) {
    this._latitude = value;
  }

  private _longitude: number = 0;

  get longitude(): number {
    return this._longitude;
  }

  set longitude(value: number) {
    this._longitude = value;
  }

  private _stationName: string = "";

  get stationName(): string {
    return this._stationName;
  }

  set stationName(value: string) {
    this._stationName = value;
  }

  private _stopID: string = "";

  get stopID(): string {
    return this._stopID;
  }

  set stopID(value: string) {
    this._stopID = value;
  }

  private _lineDegree: number = 0;

  get lineDegree(): number {
    return this._lineDegree;
  }

  set lineDegree(value: number) {
    this._lineDegree = value;
  }

  /**
   * Status needed for the algorithm
   * @private
   */
  private _status: StationStatus = StationStatus.unprocessed;

  get status(): StationStatus {
    return this._status;
  }

  set status(value: StationStatus) {
    this._status = value;
  }

  private _adjacentNodes: Set<Station> = new Set();

  get adjacentNodes(): Set<Station> {
    return this._adjacentNodes;
  }

  set adjacentNodes(value: Set<Station>) {
    this._adjacentNodes = value;
  }

  /**
   * All edges from this station in a clockwise ordering.
   */
  private _edgeOrdering: InputEdge[] = [];

  get edgeOrdering(): InputEdge[] {
    return this._edgeOrdering;
  }

  raiseLineDegreeBy(amount: number) {
    this._lineDegree += amount
  }

  /**
   * Calculates the edge ordering for this station.
   *
   * This is done by comparing the angle from the y axis to each adjecent edge.
   *
   * @param adjacentEdges
   * @param adjacentNodes
   */
  calculateEdgeOrdering(adjacentEdges: Set<InputEdge>, adjacentNodes: Set<Station>) {
    let upVector = [0, 1];
    this._edgeOrdering = Array.from(adjacentEdges.values())
      .map(adjacentEdge => {
        const adjacentNode = adjacentEdge.otherStation(this);
        const vectorToNode = [adjacentNode.latitude - this.latitude, adjacentNode.longitude - this.longitude];
        let angle: number = calculateAngleBetweenVectors(upVector, vectorToNode);

        return {adjacentNode, angle, adjacentEdge};
      })
      .sort((a, b) => {
        return b.angle - a.angle;
      })
      .map(x => x.adjacentEdge);
  }

  /**
   * Replace an edge to a station with another one. This is usefull for merging 2-degree nodes.
   * All edge information gets updated correctly.
   * @param beforeId The Id of the station to be removed
   * @param after The new station.
   * @param newEdge The new edge, connecting this station with the new station.
   */
  replaceStation(beforeId: string, after: Station, newEdge: InputEdge) {
    let nodeArray = Array.from(this.adjacentNodes);
    for (let i = 0; i < this.adjacentNodes.size; i++) {
      let node = nodeArray[i];
      if (node.stopID == beforeId) {
        nodeArray[i] = after;
        break;
      }
    }

    for (let i = 0; i < this._edgeOrdering.length; i++) {
      if (this._edgeOrdering[i].otherStation(this).stopID == beforeId) {
        this._edgeOrdering[i] = newEdge;
        break;
      }
    }

    this.adjacentNodes = new Set<Station>(nodeArray);
  }
}