export class OutputOctiEdge {
  constructor(nodeA: number, nodeB: number, weight: number, used: boolean) {
    this._nodeA = nodeA;
    this._nodeB = nodeB;
    this._weight = weight;
    this._used = used;
  }

  private _nodeA: number;

  get nodeA(): number {
    return this._nodeA;
  }

  set nodeA(value: number) {
    this._nodeA = value;
  }

  private _nodeB: number;

  get nodeB(): number {
    return this._nodeB;
  }

  set nodeB(value: number) {
    this._nodeB = value;
  }

  private _weight: number;

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
  }

  private _used: boolean;

  get used(): boolean {
    return this._used;
  }

  set used(value: boolean) {
    this._used = value;
  }
}