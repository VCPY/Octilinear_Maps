import {InputEdge, Station} from "../graphs/graph.classes";
import {GridNode, OctiEdge, OctiGraph, OctiNode} from "./octiGraph.classes";
import {Type} from "class-transformer";

export function parseOctiGraphForOutput(octiGraph: OctiGraph) {
  return new OctiGraphOutput(octiGraph.width, octiGraph.height, parseGridNodeForOutput(octiGraph.gridNodes));
}

function parseGridNodeForOutput(gridNodes: GridNode[][]): GridNodeOutput[][] {
  return gridNodes.map(gridNodesArray =>
    gridNodesArray.map(gridNode =>
      new GridNodeOutput(gridNode.id, gridNode.x, gridNode.y, parseOctiNodeForOutput(gridNode.octiNodes), gridNode.routedEdges, gridNode.station)
    )
  );
}

function parseOctiNodeForOutput(octiNodes: OctiNode[]): OctiNodeOutput[] {
  return octiNodes.map(node => new OctiNodeOutput(node.id, parseOctiEdgeForOutput(node.edges)));
}

function parseOctiEdgeForOutput(edges: OctiEdge[]) {
  return edges.map(edge => new OctiEdgeOutput(edge.nodeA.id, edge.nodeB.id, edge.weight, edge.used));
}

function parseInputEdgeForOutput(edge: InputEdge): OutputEdge {
  let output = new OutputEdge(edge.station1.stopID, edge.station2.stopID, edge.station1.stationName, edge.station2.stationName, edge.line);
  output.addInBetweenStations(edge.inBetweenStations);
  return output;
}

export function parsePathsForOutput(data: Map<InputEdge, OctiNode[]>) {
  let result = new Map<OutputEdge, OctiNodeOutput[]>();
  data.forEach((value: OctiNode[], key: InputEdge) => {
    result.set(parseInputEdgeForOutput(key), parseOctiNodeForOutput(value));
  });
  return result
}

export class OctiGraphOutput {
  private _width: number;
  private _height: number;
  @Type(() => GridNodeOutput) private _gridnodes: GridNodeOutput[][] = [];

  constructor(width: number, height: number, gridnodes: GridNodeOutput[][]) {
    this._width = width;
    this._height = height;
    this._gridnodes = gridnodes;
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  get gridnodes(): GridNodeOutput[][] {
    return this._gridnodes;
  }

  set gridnodes(value: GridNodeOutput[][]) {
    this._gridnodes = value;
  }

  getGridNodeById(gridID: number): GridNodeOutput | undefined {
    for (let i = 0; i < this._gridnodes.length; i++) {
      for (let j = 0; j < this._gridnodes[0].length; j++) {
        if (this._gridnodes[i][j].id == gridID) return this._gridnodes[i][j];
      }
    }
    return undefined
  }
}

export class GridNodeOutput {
  private _id: number;
  private _x: number;
  private _y: number;
  private _stationID: string = "";
  private _stationName: string = "";
  @Type(() => OctiNodeOutput) private _octiNodes: OctiNodeOutput[] = [];
  private _routedEdges: Array<[OutputEdge, number]> = [];

  constructor(id: number, x: number, y: number, octiNodes: OctiNodeOutput[], routedEdges: Array<[InputEdge, number]>, station: Station | undefined) {
    this._id = id;
    this._x = x;
    this._y = y;
    this._octiNodes = octiNodes;

    if (routedEdges != undefined) {
      routedEdges.forEach(value => {
        let helper = parseInputEdgeForOutput(value[0]);
        this._routedEdges.push([helper, value[1]]);
      });
    }

    if (station != undefined) {
      this._stationID = (station as Station).stopID;
      this._stationName = (station as Station).stationName;
    }
  }

  get stationID(): string {
    return this._stationID;
  }

  set stationID(value: string) {
    this._stationID = value;
  }

  get stationName(): string {
    return this._stationName;
  }

  set stationName(value: string) {
    this._stationName = value;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
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

  get octiNodes(): OctiNodeOutput[] {
    return this._octiNodes;
  }

  set octiNodes(value: OctiNodeOutput[]) {
    this._octiNodes = value;
  }

  get routedEdges(): Array<[OutputEdge, number]> {
    return this._routedEdges;
  }

  set routedEdges(value: Array<[OutputEdge, number]>) {
    this._routedEdges = value;
  }
}

export class OctiNodeOutput {
  private _id: number;
  @Type(() => OctiEdgeOutput) private _edges: OctiEdgeOutput[] = [];

  constructor(id: number, edges: OctiEdgeOutput[]) {
    this._id = id;
    this._edges = edges;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get edges(): OctiEdgeOutput[] {
    return this._edges;
  }

  set edges(value: OctiEdgeOutput[]) {
    this._edges = value;
  }
}

export class OctiEdgeOutput {
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

export class OutputEdge {
  private _station1ID: string = "";
  private _station2ID: string = "";
  private _station1Name: string = "";
  private _station2Name: string = "";
  private _line: string;
  private _inBetweenStations: string[] = [];


  constructor(station1ID: string, station2ID: string, station1Name: string, station2Name: string, line: string) {
    this._station1ID = station1ID;
    this._station2ID = station2ID;
    this._station1Name = station1Name;
    this._station2Name = station2Name;
    this._line = line;
  }

  addInBetweenStations(stations: Station[]) {
    this._inBetweenStations = stations.map(station => station.stationName)
  }

}
