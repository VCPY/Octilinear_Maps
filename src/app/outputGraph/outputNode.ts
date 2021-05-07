import {Type} from "class-transformer";
import {OutputOctiNode} from "./outputOctiNode";
import {OutputEdge} from "./outputEdge";
import {InputEdge} from "../inputGraph/inputEdge";
import {Station} from "../inputGraph/station";
import {OctiNode} from "../octiGraph/octiNode";
import {OctiGraph} from "../octiGraph/octiGraph";
import {GridNode} from "../octiGraph/gridNode";
import {OutputGraph} from "./outputGraph";
import {OctiEdge} from "../octiGraph/octiEdge";
import {OutputOctiEdge} from "./outputOctiEdge";
import {RoutedEdge} from "../octiGraph/routedEdge";

export function parseOctiGraphForOutput(octiGraph: OctiGraph) {
  return new OutputGraph(octiGraph.width, octiGraph.height, parseGridNodeForOutput(octiGraph.gridNodes));
}

function parseGridNodeForOutput(gridNodes: GridNode[][]): OutputNode[][] {
  return gridNodes.map(gridNodesArray =>
    gridNodesArray.map(gridNode =>
      new OutputNode(gridNode.id, gridNode.x, gridNode.y, parseOctiNodeForOutput(gridNode.octiNodes), gridNode.routedEdges, gridNode.station)
    )
  );
}

function parseOctiEdgeForOutput(edges: OctiEdge[]) {
  return edges.map(edge => new OutputOctiEdge(edge.nodeA.id, edge.nodeB.id, edge.weight, edge.used));
}

function parseInputEdgeForOutput(edge: InputEdge): OutputEdge {
  let output = new OutputEdge(edge.station1.stopID, edge.station2.stopID, edge.station1.stationName, edge.station2.stationName, edge.line);
  output.addInBetweenStations(edge.inBetweenStations);
  return output;
}

function parseOctiNodeForOutput(octiNodes: OctiNode[]): OutputOctiNode[] {
  return octiNodes.map(node => new OutputOctiNode(node.id, parseOctiEdgeForOutput(node.edges)));
}

export function parsePathsForOutput(data: Map<InputEdge, OctiNode[]>) {
  let result = new Map<OutputEdge, OutputOctiNode[]>();
  data.forEach((value: OctiNode[], key: InputEdge) => {
    result.set(parseInputEdgeForOutput(key), parseOctiNodeForOutput(value));
  });
  return result
}

export class OutputNode {
  constructor(id: number, x: number, y: number, octiNodes: OutputOctiNode[], routedEdges: RoutedEdge[], station: Station | undefined) {
    this._id = id;
    this._x = x;
    this._y = y;
    this._octiNodes = octiNodes;

    if (routedEdges != undefined) {
      routedEdges.forEach(value => {
        let helper = parseInputEdgeForOutput(value.edge);
        this._routedEdges.push([helper, value.direction]);
      });
    }

    if (station != undefined) {
      this._stationID = (station as Station).stopID;
      this._stationName = (station as Station).stationName;
    }
  }

  private _id: number;

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  private _x: number;

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
  }

  private _y: number;

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
  }

  private _stationID: string = "";

  get stationID(): string {
    return this._stationID;
  }

  set stationID(value: string) {
    this._stationID = value;
  }

  private _stationName: string = "";

  get stationName(): string {
    return this._stationName;
  }

  set stationName(value: string) {
    this._stationName = value;
  }

  @Type(() => OutputOctiNode) private _octiNodes: OutputOctiNode[] = [];

  get octiNodes(): OutputOctiNode[] {
    return this._octiNodes;
  }

  set octiNodes(value: OutputOctiNode[]) {
    this._octiNodes = value;
  }

  private _routedEdges: Array<[OutputEdge, number]> = [];

  get routedEdges(): Array<[OutputEdge, number]> {
    return this._routedEdges;
  }

  set routedEdges(value: Array<[OutputEdge, number]>) {
    this._routedEdges = value;
  }
}