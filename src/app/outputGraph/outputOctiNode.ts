import {Type} from "class-transformer";
import {OutputOctiEdge} from "./outputOctiEdge";

export class OutputOctiNode {
    private _id: number;
    @Type(() => OutputOctiEdge) private _edges: OutputOctiEdge[] = [];

    constructor(id: number, edges: OutputOctiEdge[]) {
        this._id = id;
        this._edges = edges;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get edges(): OutputOctiEdge[] {
        return this._edges;
    }

    set edges(value: OutputOctiEdge[]) {
        this._edges = value;
    }
}