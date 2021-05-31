import {OctiEdge} from "./octiEdge";
import {GridNode} from "./gridNode";

/**
 * TODO: Add information
 */
export class OctiNode {
  constructor(gridNode: GridNode, id: number, direction: number = 0) {
    this._gridNode = gridNode;
    this._id = id;
    this._direction = direction;
  }

  private _id: number;

  get id(): number {
    return this._id;
  }

  private _direction: number;

  get direction(): number {
    return this._direction;
  }

  /**
   * Edges to neighbouring OctiNodes (sink and port nodes)
   */
  private _edges: OctiEdge[] = [];

  get edges(): OctiEdge[] {
    return this._edges;
  }

  /**
   * The GridNode this OctiNode belongs to
   */
  private _gridNode: GridNode;

  get gridNode(): GridNode {
    return this._gridNode;
  }

  // used for path finding
  private _dist: number = Infinity;

  get dist(): number {
    return this._dist;
  }

  set dist(value: number) {
    this._dist = value;
  }

  private _priority: number = Infinity;


  get priority(): number {
    return this._priority;
  }

  set priority(value: number) {
    this._priority = value;
  }

  private _prev: OctiNode = this;

  get prev(): OctiNode {
    return this._prev;
  }

  set prev(value: OctiNode) {
    this._prev = value;
  }

  addEdge(edge: OctiEdge) {
    this._edges.push(edge);
  }

  closeAllEdges() {
    this._edges.forEach(e => e.weight = Infinity);
  }

  getEdge(neighborNode: OctiNode): OctiEdge | undefined {
    for (let i = 0; i < this.edges.length; i++) {
      let edge = this.edges[i];
      if (edge.nodeA == neighborNode || edge.nodeB == neighborNode) return edge;
    }
    return undefined
  }
}