import {InputEdge} from "./inputEdge";

export class CircularEdgeOrdering {
    private _from: InputEdge;
    private _to: InputEdge;
    private _distance: number;
    private _inBetweenEdges: InputEdge[];

    constructor(from: InputEdge, to: InputEdge, distance: number, inBetweenEdges: InputEdge[]) {
        this._from = from;
        this._to = to;
        this._distance = distance;
        this._inBetweenEdges = inBetweenEdges;
    }


    get from(): InputEdge {
        return this._from;
    }

    get to(): InputEdge {
        return this._to;
    }

    get distance(): number {
        return this._distance;
    }

    get inBetweenEdges(): InputEdge[] {
        return this._inBetweenEdges;
    }
}