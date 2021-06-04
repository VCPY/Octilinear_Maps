import {Vector2} from "../util";

export class OutputStation {
  private _position: Vector2;
  private _name: string;

  constructor(position: Vector2, name: string) {
    this._position = position;
    this._name = name;
  }

  get position(): Vector2 {
    return this._position;
  }

  get name(): string {
    return this._name;
  }
}