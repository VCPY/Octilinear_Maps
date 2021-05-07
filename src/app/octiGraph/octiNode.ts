import {OctiEdge} from "./octiEdge";
import {GridNode} from "./gridNode";

export class OctiNode {
    private _id: number;
    private _direction: number;

    /**
     * Edges to neighbouring OctiNodes (sink and port nodes)
     */
    private _edges: OctiEdge[] = [];

    /**
     * The GridNode this OctiNode belongs to
     */
    private _gridNode: GridNode;

    // used for path finding
    private _dist: number = 0;
    private _prev: OctiNode = this;

    constructor(gridNode: GridNode, id: number, direction: number = 0) {
        this._gridNode = gridNode;
        this._id = id;
        this._direction = direction;
    }

    addEdge(edge: OctiEdge) {
        this._edges.push(edge);
    }

    get id(): number {
        return this._id;
    }

    get direction(): number {
        return this._direction;
    }

    get dist(): number {
        return this._dist;
    }

    set dist(value: number) {
        this._dist = value;
    }

    get edges(): OctiEdge[] {
        return this._edges;
    }

    get prev(): OctiNode {
        return this._prev;
    }

    set prev(value: OctiNode) {
        this._prev = value;
    }

    get gridNode(): GridNode {
        return this._gridNode;
    }

    setWeightOfEdgesToInfinity(): void {
        this._edges.forEach(edge => edge.setWeightToInfinity())
    }

    /* by an edge connecting with other node*/
    setWeightToInfinity(otherNode: OctiNode): void {
        this._edges.forEach(edge => {
            if (edge.nodeB == this && edge.nodeA == otherNode) {
                edge.closeEdge();
                return
            } else if (edge.nodeB == otherNode && edge.nodeA == this) {
                edge.closeEdge();
                return;
            }
        })
    }

    closeEdges() {
        this._edges.forEach(edge => edge.closeEdge())
    }

    resetWeights() {
        this._edges.forEach(edge => {
            if (!edge.used) edge.resetWeight()
        })
    }

    getEdge(neighborNode: OctiNode): OctiEdge | undefined {
        for (let i = 0; i < this.edges.length; i++) {
            let edge = this.edges[i];
            if (edge.nodeA == neighborNode || edge.nodeB == neighborNode) return edge;
        }
        return undefined
    }
}