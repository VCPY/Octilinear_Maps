import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";

/**
 * TODO: Add information
 */
export class RoutedEdge {
  constructor(to: Station, direction: number, edge: InputEdge) {
    this._to = to;
    this._direction = direction;
    this._edge = edge;
  }

  private _to: Station;

  get to(): Station {
    return this._to;
  }

  private _direction: number;

  get direction(): number {
    return this._direction;
  }

  private _edge: InputEdge;

  get edge(): InputEdge {
    return this._edge;
  }
}