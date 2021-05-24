import {OctiNode} from "./octiNode";
import {OctiEdge} from "./octiEdge";
import {Constants} from "./constants";
import {Station} from "../inputGraph/station";
import {RoutedEdge} from "./routedEdge";
import {InputEdge} from "../inputGraph/inputEdge";

export class GridNode {
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

  private _id: number;

  get id(): number {
    return this._id;
  }

  /**
   * The x position on the grid of this GridNode
   * and all OctiNodes that belong to it
   */
  private _x: number;

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
  }

  /**
   * The y position on the grid of this GridNode
   * and all OctiNodes that belong to it
   */
  private _y: number;

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
  }

  /**
   * All OctiNodes that belong to this GridNode
   */
  private _octiNodes: OctiNode[];

  get octiNodes(): OctiNode[] {
    return this._octiNodes;
  }

  private _routedEdges: RoutedEdge[] = [];

  get routedEdges(): RoutedEdge[] {
    return this._routedEdges;
  }

  private _station: Station | undefined = undefined;

  get station(): Station | undefined {
    return this._station;
  }

  set station(value: Station | undefined) {
    this._station = value;
  }

  getCoordinates() {
    return [this._x, this._y]
  }

  getOctiNode(index: number): OctiNode {
    return this._octiNodes[index];
  }

  closeSinkEdge() {
    this.getOctiNode(Constants.SINK).closeAllEdges();
  }

  closeBendEdges(weight = Infinity) {
    for (let i = 0; i < 8; i++) {
      const portNode = this.getOctiNode(i);

      /* the first seven edges are the bend edges*/
      for (let i = 0; i < 7; i++) {
        portNode.edges[i].weight = weight;
      }
    }
  }

  reopenSinkEdges() {
    this.getOctiNode(Constants.SINK).edges
      .filter(e => !e.used)
      .forEach(e => e.weight = Constants.COST_SINK);
  }

  reopenBendEdges() {
    for (let i = 0; i < 8; i++) {
      const portNode = this.getOctiNode(i);

      /* the first seven edges are the bend edges*/
      for (let i = 0; i < 7; i++) {
          portNode.edges[i].resetWeight();
      }
    }
  }

  saveRouting(other: Station, direction: number, edge: InputEdge) {
    this._routedEdges.push(new RoutedEdge(other, direction, edge));
  }

  removeRouting(edge: InputEdge) {
    this._routedEdges = this._routedEdges.filter(routedEdge => {
      return routedEdge.edge != edge;
    });
  }

  /**
   * Closes sink edges so that the path from station can only enter according to
   * the circular ordering. And also closes sink edges to reserve space for unrouted
   * edges.
   * (4.3)
   */
  blockForCircularOrdering(stationToRoute: Station) {

    if (this._station == undefined) return;
    if (this._station.adjacentNodes.size <= 2) return;

    const orderingCount = this._station.edgeOrdering.length;
    const toRouteIndex = this._station.edgeOrdering.findIndex(s => s == stationToRoute);
    let prevInOrdering = 0;
    let nextInOrdering = 0;

    // if we skip a station that means it is unrouted so we reserve space for it
    let skipped = 0;
    for (let i = toRouteIndex + 1; i < toRouteIndex + orderingCount; i++) {
      const candidate = this._station.edgeOrdering[i % orderingCount];

      const routed = this._routedEdges.find(edge => edge.to == candidate);
      if (routed != undefined) {
        nextInOrdering = Constants.fixIndex(routed.direction - skipped);
        break;
      }
      skipped++;
    }

    skipped = 0;
    for (let i = toRouteIndex - 1; i > toRouteIndex - orderingCount; i--) {
      const candidate = this._station.edgeOrdering[(i + orderingCount) % orderingCount];

      const routed = this._routedEdges.find(edge => edge.to == candidate);
      if (routed != undefined) {
        prevInOrdering = Constants.fixIndex(routed.direction + skipped);
        break;
      }
      skipped++;
    }

    this.closeEdgesBetweenIndices(nextInOrdering, prevInOrdering);
  }

  closeEdgesBetweenIndices(from: number, to: number) {
    let value = from;
    value = value % 8;
    while (value != to) {
      this.octiNodes[Constants.SINK].edges[value].weight = Infinity;
      value += 1;
      value = Constants.fixIndex(value);
    }
    this.octiNodes[Constants.SINK].edges[value].weight = Infinity;
  }

  /*
  * rior to routing an edge ei, we calculate the line bend penalty between
  * every routed edge ej, j < i and ei for each of the possible placements
  * of ei on adjacent sink edges.
  * The sum of the line bend penalties on each adjacent sink edge is then
  * used as the cost for this sink edge
  * */
  addLineBendPenalty() {
    // assume that edges to sink node get added in order from 0 to 7
    this.getOctiNode(Constants.SINK).edges
      // possible placements for ei
      .forEach((candidateSinkEdge, index) => {
        // skip blocked edges
        if (candidateSinkEdge.weight == Infinity) return;
        //if (this._routedEdges.map(_routedEdge => _routedEdge.direction).includes(index)) return;

        let penaltySum = 0;

        this._routedEdges.forEach((routedEdge) => {
          // condition from the paper
          //if (routedEdge.direction >= index) return;
          penaltySum += this.calculateWeight(index, routedEdge.direction);
        });

        candidateSinkEdge.weight = penaltySum;
      });
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
}
