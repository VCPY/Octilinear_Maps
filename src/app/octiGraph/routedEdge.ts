import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";

export class RoutedEdge {
    private _to: Station;
    private _direction: number;
    private _edge: InputEdge;


    constructor(to: Station, direction: number, edge: InputEdge) {
        this._to = to;
        this._direction = direction;
        this._edge = edge;
    }

    get to(): Station {
        return this._to;
    }

    get direction(): number {
        return this._direction;
    }

    get edge(): InputEdge {
        return this._edge;
    }
}