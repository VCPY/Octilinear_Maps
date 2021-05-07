import {OctiNode} from "./octiNode";

/**
 * An edge between two OctiNodes
 *
 * Note: Nodes are sorted by ID.
 *   NodeA has a lower ID than NodeB
 */
export class OctiEdge {
  private _originalWeight: number;

  constructor(node1: OctiNode, node2: OctiNode, weight: number = 0) {
    if (node1.id < node2.id) {
      this._nodeA = node1;
      this._nodeB = node2;
    } else {
      this._nodeA = node2;
      this._nodeB = node1;
    }

    this._weight = weight;
    this._originalWeight = weight
  }

  private _nodeA: OctiNode;

  get nodeA(): OctiNode {
    return this._nodeA;
  }

  private _nodeB: OctiNode;

  get nodeB(): OctiNode {
    return this._nodeB;
  }

  private _weight: number;

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
    this._originalWeight = this._weight;
  }

  private _used: boolean = false;

  get used(): boolean {
    return this._used;
  }

  set used(value: boolean) {
    this._used = value;
  }

  getNeighbourOf(node: OctiNode): OctiNode {
    if (node.id == this._nodeA.id) return this._nodeB;
    if (node.id == this._nodeB.id) return this._nodeA;
    throw new Error("Invalid node");
  }

  resetWeight() {
    this._weight = this._originalWeight
  }

  setWeightToInfinity() {
    if (this.weight != Infinity) {
      this._originalWeight = this.weight;
    }
    this._weight = Infinity;
  }

  closeEdge() {
    this._used = true;
    this._originalWeight = Infinity;
    this._weight = Infinity;
  }
}