import {Type} from "class-transformer";
import {OutputOctiEdge} from "./outputOctiEdge";

export class OutputOctiNode {
  constructor(id: number, edges: OutputOctiEdge[]) {
    this._id = id;
    this._edges = edges;
  }

  private _id: number;

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  @Type(() => OutputOctiEdge) private _edges: OutputOctiEdge[] = [];

  get edges(): OutputOctiEdge[] {
    return this._edges;
  }

  set edges(value: OutputOctiEdge[]) {
    this._edges = value;
  }
}