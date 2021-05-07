export class OutputOctiEdge {
    private _nodeA: number;
    private _nodeB: number;
    private _weight: number;
    private _used: boolean;

    constructor(nodeA: number, nodeB: number, weight: number, used: boolean) {
        this._nodeA = nodeA;
        this._nodeB = nodeB;
        this._weight = weight;
        this._used = used;
    }

    get nodeA(): number {
        return this._nodeA;
    }

    set nodeA(value: number) {
        this._nodeA = value;
    }

    get nodeB(): number {
        return this._nodeB;
    }

    set nodeB(value: number) {
        this._nodeB = value;
    }

    get weight(): number {
        return this._weight;
    }

    set weight(value: number) {
        this._weight = value;
    }

    get used(): boolean {
        return this._used;
    }

    set used(value: boolean) {
        this._used = value;
    }
}