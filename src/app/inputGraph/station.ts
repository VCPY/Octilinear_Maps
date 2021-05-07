import {StationStatus} from "./stationStatus";
import {InputEdge} from "./inputEdge";
import {calculateAngleBetweenVectors} from "../util";

export class Station {
    private _latitude: number = 0;
    private _longitude: number = 0;
    private _stationName: string = "";
    private _stopID: string = "";
    private _lineDegree: number = 0;
    private _status: StationStatus = StationStatus.unprocessed;
    private _adjacentNodes: Set<Station> = new Set();
    private _edgeOrdering: Station[] = [];

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

    get edgeOrdering(): Station[] {
        return this._edgeOrdering;
    }

    get status(): StationStatus {
        return this._status;
    }

    set status(value: StationStatus) {
        this._status = value;
    }

    raiseLineDegreeBy(amount: number) {
        this._lineDegree += amount
    }

    calculateEdgeOrdering(edges: Set<InputEdge>, adjacentNodes: Set<Station>) {
        let upVector = [0, 1];
        this._edgeOrdering = Array.from(adjacentNodes.values())
            .map(adjacentNode => {
                const vectorToNode =  [adjacentNode.latitude - this.latitude, adjacentNode.longitude - this.longitude];
                let angle: number = calculateAngleBetweenVectors(upVector, vectorToNode);

                return {adjacentNode, angle};
            })
            .sort((a, b) => {
                return b.angle - a.angle;
            })
            .map(x => x.adjacentNode);
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