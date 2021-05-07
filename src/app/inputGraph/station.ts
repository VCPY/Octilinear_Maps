import {StationStatus} from "./stationStatus";
import {CircularEdgeOrdering} from "./circularOrdering";
import {InputEdge} from "./inputEdge";
import {calculateAngleBetweenVectors} from "../util";

export class Station {
    private _latitude: number = 0;
    private _longitude: number = 0;
    private _stationName: string = "";
    private _stopID: string = "";
    private _lineDegree: number = 0;
    private _status: StationStatus = StationStatus.unprocessed;
    private _clockwiseOrdering: CircularEdgeOrdering[] = [];
    private _counterClockwiseOrdering: CircularEdgeOrdering[] = [];
    private _edgesByAngle: { [id: string]: InputEdge } = {};
    private _adjacentNodes: Set<Station> = new Set();

    constructor() {
    }

    get adjacentNodes(): Set<Station> {
        return this._adjacentNodes;
    }

    set adjacentNodes(value: Set<Station>) {
        this._adjacentNodes = value;
    }

    get latitude(): number {
        return this._latitude;
    }

    set latitude(value: number) {
        this._latitude = value;
    }

    get longitude(): number {
        return this._longitude;
    }

    set longitude(value: number) {
        this._longitude = value;
    }

    get stationName(): string {
        return this._stationName;
    }

    set stationName(value: string) {
        this._stationName = value;
    }

    get stopID(): string {
        return this._stopID;
    }

    set stopID(value: string) {
        this._stopID = value;
    }

    get lineDegree(): number {
        return this._lineDegree;
    }

    set lineDegree(value: number) {
        this._lineDegree = value;
    }

    get status(): StationStatus {
        return this._status;
    }

    set status(value: StationStatus) {
        this._status = value;
    }

    get clockwiseOrdering(): CircularEdgeOrdering[] {
        return this._clockwiseOrdering;
    }

    get counterClockwiseOrdering(): CircularEdgeOrdering[] {
        return this._counterClockwiseOrdering;
    }

    get edgesByAngle(): { [p: string]: InputEdge } {
        return this._edgesByAngle;
    }

    raiseLineDegreeBy(amount: number) {
        this._lineDegree += amount
    }

    calculateEdgeOrdering(edges: Set<InputEdge>, adjacentNodes: Set<Station>) {
        // Edge ordering not needed if just one neighbour is present
        if (adjacentNodes.size == 1) return;

        this._edgesByAngle = {};
        this._clockwiseOrdering = [];
        this._counterClockwiseOrdering = [];
        let upVector = [0, 1];
        edges.forEach(edge => {
            let adjacentId = (edge.station1!.stopID == this.stopID) ? edge.station2!.stopID : edge.station1!.stopID;

            let adjacentNode = Array.from(adjacentNodes).find(obj => obj.stopID === adjacentId) as Station;
            let vectorToNode = [adjacentNode.latitude - this.latitude, adjacentNode.longitude - this.longitude];

            let angle: number = calculateAngleBetweenVectors(upVector, vectorToNode);
            this._edgesByAngle[angle] = edge;
        });

        let angles: string[] = Object.keys(this._edgesByAngle).sort((a, b) => parseFloat(b) - parseFloat(a));

        // Compare each edge with each other and note down the ordering
        for (let i = 0; i < angles.length; i++) {
            for (let j = i + 1; j < angles.length; j++) {
                let edge1 = this._edgesByAngle[angles[i]];
                let edge2 = this._edgesByAngle[angles[j]];
                let clockwiseOrder = j - i;
                let counterClockwiseOrder = angles.length - clockwiseOrder;

                let inBetweenEdges = this.getInBetweenEdges(i, j, angles);
                let inBetweenEdgesCounter = this.getInBetweenEdges(j, i, angles);

                this._clockwiseOrdering.push(new CircularEdgeOrdering(edge1, edge2, clockwiseOrder, inBetweenEdges));
                this._clockwiseOrdering.push(new CircularEdgeOrdering(edge2, edge1, counterClockwiseOrder, inBetweenEdgesCounter));
                this._counterClockwiseOrdering.push(new CircularEdgeOrdering(edge1, edge2, counterClockwiseOrder, inBetweenEdgesCounter));
                this._counterClockwiseOrdering.push(new CircularEdgeOrdering(edge2, edge1, clockwiseOrder, inBetweenEdges));
            }
        }
    }

    private getInBetweenEdges(start: number, end: number, angles: string[]) {
        let inBetweenEdges = [];

        let index = start + 1;
        if (index == angles.length) index = 0;
        while (index != end) {
            inBetweenEdges.push(this._edgesByAngle[angles[index]]);
            index += 1;
            if (index >= angles.length) index = 0;
        }
        return inBetweenEdges;
    }

    replaceStation(before: string, after: Station) {
        let nodeArray = Array.from(this.adjacentNodes);
        for (let i = 0; i < this.adjacentNodes.size; i++) {
            let node = nodeArray[i];
            if (node.stopID == before) {
                nodeArray[i] = after;
                break;
            }
        }
        this.adjacentNodes = new Set<Station>(nodeArray);
    }
}