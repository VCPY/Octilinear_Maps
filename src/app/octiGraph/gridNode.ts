import {OctiNode} from "./octiNode";
import {OctiEdge} from "./octiEdge";
import {Constants} from "./constants";
import {CircularEdgeOrdering} from "../inputGraph/circularOrdering";
import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";

export class GridNode {

    private _id: number;

    /**
     * The x position on the grid of this GridNode
     * and all OctiNodes that belong to it
     */
    private _x: number;

    /**
     * The y position on the grid of this GridNode
     * and all OctiNodes that belong to it
     */
    private _y: number;

    /**
     * All OctiNodes that belong to this GridNode
     */
    private _octiNodes: OctiNode[];

    private _routedEdges: Array<[InputEdge, number]> = [];

    private _station: Station | undefined = undefined;

    constructor(id: number, x: number, y: number) {
        this._id = id;
        this._x = x;
        this._y = y;

        this._octiNodes = new Array(9);

        // create all octi nodes
        for (let i = 0; i < 9; i++) {
            this._octiNodes[i] = new OctiNode(this, this._id + 1 + i, i);
        }

        // all OctiNodes of the same GridNode are fully connected
        // iterate over all uniquie cobinations of nodes
        // and create each edge
        for (let i = 0; i < 8; i++) {
            for (let j = i + 1; j < 8; j++) {
                const node1 = this._octiNodes[i];
                const node2 = this._octiNodes[j];

                const newEdge = new OctiEdge(node1, node2, this.calculateWeight(i, j));
                node1.addEdge(newEdge);
                node2.addEdge(newEdge);
            }
        }

        // add sink edges separatly to ensure that the edge index on the sink node matches the direction
        // of the port node
        for (let i = 0; i < 8; i++) {
            const node = this._octiNodes[i];
            const sinkNode = this._octiNodes[Constants.SINK];
            const newEdge = new OctiEdge(node, sinkNode, Constants.COST_SINK);
            node.addEdge(newEdge);
            sinkNode.addEdge(newEdge);
        }
    }


    get id(): number {
        return this._id;
    }

    get routedEdges(): Array<[InputEdge, number]> {
        return this._routedEdges;
    }

    getCoordinates() {
        return [this._x, this._y]
    }

    getOctiNode(index: number): OctiNode {
        return this._octiNodes[index];
    }

    get octiNodes(): OctiNode[] {
        return this._octiNodes;
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
    }

    get station(): Station | undefined {
        return this._station;
    }

    set station(value: Station | undefined) {
        this._station = value;
    }

    closeSinkEdge() {
        this.getOctiNode(Constants.SINK).setWeightOfEdgesToInfinity();
    }

    closeBendEdges() {
        for (let i = 0; i < 8; i++) {
            const portNode = this.getOctiNode(i);

            /* the first seven edges are the bend edges*/
            for (let i = 0; i < 7; i++) {
                portNode.edges[i].setWeightToInfinity();
            }
        }
    }

    reopenSinkEdges() {
        this.getOctiNode(Constants.SINK).resetWeights();
    }

    /**
     * Calculate the cost between two OctiNodes by their index
     */
    private calculateWeight(a: number, b: number): number {
        if (a == Constants.SINK || b == Constants.SINK) {
            return Constants.COST_SINK;
        }

        const angle = this.calculateOctiAngle(a, b);
        switch (angle) {
            case 1:
                return Constants.COST_45;
            case 2:
                return Constants.COST_90;
            case 3:
                return Constants.COST_135;
            case 4:
                return Constants.COST_180;
            default:
                throw new Error("Invalid angle: " + angle)
        }
    }

    /**
     * There are 8 different directions in a octi grid
     * assume that the directions are orderd clockwise from 0 to 8
     * calculates the "angle" between two directions, i.e. how many steps they are apart
     *
     * 7--0--1
     * |     |
     * 6     2
     * |     |
     * 5--4--3
     *
     * @param a
     * @param b
     */
    private calculateOctiAngle(a: number, b: number): number {
        let angle = (a - b);
        if (angle < -4)
            angle += 8;
        else if (angle > 4)
            angle -= 8;

        return Math.abs(angle);
    }

    /**
     * Closes sink edges between routedEdges and edge where no other edges are allowed.
     */
    closeInBetweenEdges(edge: InputEdge, station: Station, octiNode: OctiNode) {
        if (station.clockwiseOrdering.length == 0) return;

        this._routedEdges.forEach(routedEdge => {
            let routedEdgeIndex = routedEdge[1];
            let octiIndex = octiNode.direction;
            let clockwiseOrderings = station.clockwiseOrdering;
            let orderingEntry = GridNode.findOrderingByEdges(routedEdge[0], edge, clockwiseOrderings) as CircularEdgeOrdering;
            let counterClockwiseOrderings = station.counterClockwiseOrdering;
            let counterOrderingEntry = GridNode.findOrderingByEdges(routedEdge[0], edge, counterClockwiseOrderings) as CircularEdgeOrdering;

            let fromIndex = orderingEntry.from.equalsByStation(routedEdge[0]) ? routedEdgeIndex : octiIndex;
            let toIndex = orderingEntry.from.equalsByStation(routedEdge[0]) ? octiIndex : routedEdgeIndex;

            // Close sink edges between Input Edges without other intermediate edges.
            if (orderingEntry.distance == 1) this.closeEdgesBetweenIndices(fromIndex, toIndex);
            if (counterOrderingEntry.distance == 1) this.closeEdgesBetweenIndices(toIndex, fromIndex);
        });

        this._routedEdges.push([edge, octiNode.direction]);
    }

    closeEdgesBetweenIndices(from: number, to: number) {
        let value = from + 1;
        value = value % 8;
        while (value != to) {
            this.octiNodes[value].edges[7].setWeightToInfinity();
            value += 1;
            value = value % 8;
        }
    }

    private static findOrderingByEdges(edge1: InputEdge, edge2: InputEdge, orderings: CircularEdgeOrdering[]): CircularEdgeOrdering | undefined {
        for (let i = 0; i < orderings.length; i++) {
            let ordering = orderings[i];
            let orderEdge1 = ordering.from;
            let orderEdge2 = ordering.to;
            if (orderEdge1.equalsByStation(edge1) && orderEdge2.equalsByStation(edge2))
                return ordering;
            else if (orderEdge2.equalsByStation(edge1) && orderEdge1.equalsByStation(edge2))
                return ordering;
        }
        return undefined
    }

    /**
     * Checks the position of already set edges and compares them with the new edge. Reserves in between edges
     * if the ordering is accordingly.
     */
    reserveEdges(edge: InputEdge, station: Station) {
        this.routedEdges.forEach(routedEdge => {
            let clockwiseOrdering = GridNode.findOrderingByEdges(edge, routedEdge[0], station.clockwiseOrdering) as CircularEdgeOrdering;
            this.checkEdgesByOrdering(clockwiseOrdering, routedEdge, true);
            let counterClockwiseOrdering = GridNode.findOrderingByEdges(edge, routedEdge[0], station.counterClockwiseOrdering) as CircularEdgeOrdering;
            this.checkEdgesByOrdering(counterClockwiseOrdering, routedEdge, false);
        });
    }

    addLineBendPenalty() {
        // assume that edges to sink node get added in order from 0 to 7
        this.getOctiNode(Constants.SINK).edges.forEach((candidateSinkEdge, index) => {
            // skip blocked edges
            if (candidateSinkEdge.weight == Infinity) return;
            if (this.routedEdges.map(routedEdge => routedEdge[1]).includes(index)) return;

            let penaltySum = 0;

            this.routedEdges.forEach((routedEdge) => {
                const routedDirection = routedEdge[1];

                // condition from the paper
                if (routedDirection >= index) return;
                penaltySum = this.calculateWeight(index, routedDirection);
            });

            candidateSinkEdge.weight = penaltySum;
        });
    }

    private checkEdgesByOrdering(ordering: CircularEdgeOrdering, routedEdge: [InputEdge, number], clockwise: boolean) {
        if (ordering.distance != 1) {
            // At least one edge should be routed in between
            let inBetweenEdgeDrawn: boolean = this.isAnyEdgeSet(ordering.inBetweenEdges);
            if (!inBetweenEdgeDrawn) {
                if (routedEdge[0].equalsByStation(ordering.from)) {
                    if (clockwise) {
                        this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] + 1) % 8, true);
                    } else {
                        this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] - 1) % 8, false);
                    }
                } else {
                    if (clockwise) {
                        this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] - 1) % 8, false);
                    } else {
                        this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] + 1) % 8, true);
                    }
                }
            }
        }
    }

    /*
     * Finds the sink edges between two edges and blocks the necessary amount
     */
    private closeIntermediateEdges(amount: number, startIndex: number, clockwise: boolean = false) {
        let values = GridNode.determineIndexIntermediateEdges(amount, startIndex, clockwise);
        // for port nodes the edge with index 7 is the sink edge
        values.forEach(value => this.getOctiNode(value).edges[7].setWeightToInfinity())
    }

    private static determineIndexIntermediateEdges(amount: number, startValue: number, clockwise: boolean = false) {
        let valuesToReserve = [];
        let value = startValue;
        if (value == -1) value = 7;
        if (!clockwise) {
            while (amount != 0) {
                valuesToReserve.push(value);
                value = (value - 1);
                if (value == -1) value = 7;
                amount -= 1;
            }
        } else {
            while (amount != 0) {
                valuesToReserve.push(value);
                value = (value + 1) % 8;
                amount -= 1;
            }
        }
        return valuesToReserve;
    }

    /**
     * Checks if any of the edges in edges has been routed on the map
     */
    private isAnyEdgeSet(edges: InputEdge[]) {
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            for (let j = 0; j < this.routedEdges.length; j++) {
                let routeEdge = this.routedEdges[j][0];
                if (edge.equalsByStation(routeEdge)) return true;
            }
        }
        return false;
    }
}