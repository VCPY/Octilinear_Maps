import {Type} from "class-transformer";
import {OutputNode} from "./outputNode";

export class OutputGraph {
  constructor(width: number, height: number, gridnodes: OutputNode[][]) {
    this._width = width;
    this._height = height;
    this._gridnodes = gridnodes;
  }

  private _width: number;

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  private _height: number;

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  @Type(() => OutputNode) private _gridnodes: OutputNode[][] = [];

  get gridnodes(): OutputNode[][] {
    return this._gridnodes;
  }

  set gridnodes(value: OutputNode[][]) {
    this._gridnodes = value;
  }

  getGridNodeById(gridID: number): OutputNode | undefined {
    for (let i = 0; i < this._gridnodes.length; i++) {
      for (let j = 0; j < this._gridnodes[0].length; j++) {
        if (this._gridnodes[i][j].id == gridID) return this._gridnodes[i][j];
      }
    }
    return undefined
  }
}

