import {Type} from "class-transformer";
import {OutputEdge} from "./outputEdge";
import {OutputStation} from "./outputStation";

export class OutputGraph {
  constructor(width: number, height: number, stations: OutputStation[], paths: OutputEdge[]) {
    this._width = width;
    this._height = height;
    this._paths = paths;
    this._stations = stations;
  }

  private _width: number;

  get width(): number {
    return this._width;
  }

  private _height: number;

  get height(): number {
    return this._height;
  }

  @Type(() => OutputStation)
  private _stations: OutputStation[];

  get stations(): OutputStation[] {
    return this._stations;
  }

  @Type(() => OutputEdge)
  private _paths: OutputEdge[] = [];

  get paths(): OutputEdge[] {
    return this._paths;
  }
}

