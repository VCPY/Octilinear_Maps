import {InputEdge, Station} from "../graphs/graph.classes";

export class Constants {
  static readonly COST_SINK = 2;
  static readonly COST_45 = 2;
  static readonly COST_90 = 1.5;
  static readonly COST_135 = 1;
  static readonly COST_180 = 0;

  static readonly TOP = 0;
  static readonly TOP_RIGHT = 1;
  static readonly RIGHT = 2;
  static readonly BOTTOM_RIGHT = 3;
  static readonly BOTTOM = 4;
  static readonly BOTTOM_LEFT = 5;
  static readonly LEFT = 6;
  static readonly TOP_LEFT = 7;
  static readonly SINK = 8;

  static readonly COST_MOVE = 0.5;
  static readonly COST_HOP = 1; //TODO: set it with the correct value
  static octiGraph: { internalGraph: any, internalPaths: any, aListener: any, graph: any, paths: any, registerListener: (path: any) => void } = {
    internalGraph: undefined,
    internalPaths: undefined,
    aListener: function (graph: any, paths: any) {
    },
    set graph(val) {
      this.internalGraph = val;
      this.aListener(this.internalGraph, this.internalPaths);
    },
    get graph() {
      return this.internalGraph;
    },
    set paths(val) {
      this.internalPaths = val;
      this.aListener(this.internalGraph, this.internalPaths);
    },
    get paths() {
      return this.internalGraph;
    },
    registerListener: function (listener: any) {
      this.aListener = listener;
    }
  }
}

export class OctiGraph {

  private _gridNodes: GridNode[][] = [];
  private readonly _width;
  private readonly _height;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;

    let gridNodeId = 0;

    // instantiate all gridNodes, which create all OctiNodes
    for (let x = 0; x < width; x++) {
      this._gridNodes[x] = [];

      for (let y = 0; y < height; y++) {
        this._gridNodes[x][y] = new GridNode(gridNodeId, x, y);
        gridNodeId += 10; // each GridNode uses 10 ids for OctiNodes
      }
    }

    // for each GridNode add an edge to its neighbours
    // only 4 are needed to avoid duplicate edges
    const directions = [
      {x: 0, y: 1, portIndex: Constants.TOP},
      {x: 1, y: 1, portIndex: Constants.TOP_RIGHT},
      {x: 1, y: 0, portIndex: Constants.RIGHT},
      {x: 1, y: -1, portIndex: Constants.BOTTOM_RIGHT},
    ];

    // add edges between gridNodes
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {

        const gridNode = this._gridNodes[x][y];
        for (let dir of directions) {
          const otherX = x + dir.x;
          const otherY = y + dir.y;
          if (otherX < 0 || otherX >= width) continue;
          if (otherY < 0 || otherY >= height) continue;

          const portNode = gridNode.getOctiNode(dir.portIndex);

          const otherGridNode = this._gridNodes[otherX][otherY];
          const otherPortNode = otherGridNode.getOctiNode(dir.portIndex + 4 % 8); // other direction

          const newEdge = new OctiEdge(portNode, otherPortNode, Constants.COST_HOP);
          portNode.addEdge(newEdge);
          otherPortNode.addEdge(newEdge);
        }
      }
    }
  }

  hasNode(x: number, y: number): boolean {
    if (x < 0 || x >= this._width) return false;
    if (y < 0 || y >= this._height) return false;

    return true;
  }

  getNode(x: number, y: number): GridNode {
    return this._gridNodes[x][y];
  }

  get allNodes(): OctiNode[] {
    return this.gridNodes.flatMap(n => n.flatMap(n => n.octiNodes));
  }

  get gridNodes(): GridNode[][] {
    return this._gridNodes;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  closeDiagonalEdge(edge: OctiEdge) {
    let nodeA = edge.nodeA;
    let nodeB = edge.nodeB;
    if (nodeA.gridNode == nodeB.gridNode) {
      return;
    }

    let [xA, yA] = nodeA.gridNode.getCoordinates();
    let [xB, yB] = nodeB.gridNode.getCoordinates();

    // Check if the two gridNodes are diagonal to each other
    if (Math.abs(xA - xB) == 1 && Math.abs(yA - yB) == 1) {
      // Get the according gridnodes with a diagonal edge
      let diagonalNodeA = this.getNode(xA, yB);
      let diagonalNodeB = this.getNode(xB, yA);
      let [xAD, yAD] = diagonalNodeA.getCoordinates();
      let [xBD, yBD] = diagonalNodeB.getCoordinates();
      let octiNodeA: OctiNode, octiNodeB: OctiNode;
      if (xAD > xBD && yAD > yBD) {
        /**
         * B - X
         * - \ -
         * X - A
         */
        octiNodeA = diagonalNodeA.getOctiNode(5);
        octiNodeB = diagonalNodeB.getOctiNode(1);
      } else if (xAD < xBD && yAD < yBD) {
        /**
         * A - X
         * - \ -
         * X - B
         */
        octiNodeA = diagonalNodeA.getOctiNode(1);
        octiNodeB = diagonalNodeB.getOctiNode(5);
      } else if (xAD < xBD && yBD < yAD) {
        /**
         * X - A
         * - / -
         * B - X
         */
        octiNodeA = diagonalNodeA.getOctiNode(3);
        octiNodeB = diagonalNodeB.getOctiNode(7);
      } else {
        /**
         * X - B
         * - / -
         * A - X
         */
        octiNodeA = diagonalNodeA.getOctiNode(7);
        octiNodeB = diagonalNodeB.getOctiNode(3);
      }
      octiNodeA.setWeightToInfinity(octiNodeB);
    }
  }
}

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

  setWeightOfGridNodeToInfinity(): void {
    this.gridNode.setAllWeightsToInfinity();
  }

  setWeightOfEdgesToInfinity(): void {
    this._edges.forEach(edge => edge.setWeightToInfinity())
  }

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

/**
 * An edge between two OctiNodes
 *
 * Note: Nodes are sorted by ID.
 *   NodeA has a lower ID than NodeB
 */
export class OctiEdge {
  private _nodeA: OctiNode;
  private _nodeB: OctiNode;
  private _weight: number;
  private _originalWeight: number;
  private _used: boolean = false;

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

  get weight(): number {
    return this._weight;
  }

  set weight(value: number) {
    this._weight = value;
    this._originalWeight = this._weight;
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

  get used(): boolean {
    return this._used;
  }

  set used(value: boolean) {
    this._used = value;
  }

  get nodeA(): OctiNode {
    return this._nodeA;
  }

  get nodeB(): OctiNode {
    return this._nodeB;
  }
}

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

  private _station: Station|undefined = undefined;

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

  reopenEdges() {
    this._octiNodes.forEach(node => {
      node.resetWeights();
    })
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
      case 1: return Constants.COST_45;
      case 2: return Constants.COST_90;
      case 3: return Constants.COST_135;
      case 4: return Constants.COST_180;
      default: throw new Error("Invalid angle: " + angle)
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
      this.octiNodes[value].closeEdges();
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

  setAllWeightsToInfinity() {
    this.octiNodes.forEach(node => node.setWeightOfEdgesToInfinity());
  }

  /**
   * Checks the position of already set edges and compares them with the new edge. Reserves in between edges
   * if the ordering is accordingly.
   */
  reserveEdges(edge: InputEdge, station: Station) {
    this.routedEdges.forEach(routedEdge => {
      let clockwiseOrdering = GridNode.findOrderingByEdges(edge, routedEdge[0], station.clockwiseOrdering) as CircularEdgeOrdering;
      this.checkEdgesByOrdering(clockwiseOrdering, routedEdge);
      let counterClockwiseOrdering = GridNode.findOrderingByEdges(edge, routedEdge[0], station.counterClockwiseOrdering) as CircularEdgeOrdering;
      this.checkEdgesByOrdering(counterClockwiseOrdering, routedEdge);
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

  private checkEdgesByOrdering(ordering: CircularEdgeOrdering, routedEdge: [InputEdge, number]) {
    if (ordering.distance != 1) {
      // At least one edge should be routed in between
      let inBetweenEdgeDrawn: boolean = this.isAnyEdgeSet(ordering.inBetweenEdges);
      if (!inBetweenEdgeDrawn) {
        if (routedEdge[0].equalsByStation(ordering.from))
          this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] - 1) % 8, true);
        else
          this.closeIntermediateEdges(ordering.distance - 1, (routedEdge[1] + 1) % 8, false)
      }
    }
  }

  /*
   * Finds the sink edges between two edges and blocks the necessary amount
   */
  private closeIntermediateEdges(amount: number, startIndex: number, clockwise: boolean = false) {
    let values = GridNode.determineIndexIntermediateEdges(amount, startIndex, clockwise);
    values.forEach(value => this.getOctiNode(value).setWeightOfEdgesToInfinity())
  }

  private static determineIndexIntermediateEdges(amount: number, startValue: number, clockwise: boolean = false) {
    let valuesToReserve = [];
    let value = startValue;
    if (value==-1) value=7;
    if (!clockwise) {
      while (amount != 0) {
        valuesToReserve.push(value);
        value = (value + 1) % 8;
        amount -= 1;
      }
    } else {
      while (amount != 0) {
        valuesToReserve.push(value);
        value = (value - 1);
        if (value == -1) value = 7;
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

export class CircularEdgeOrdering {
  private _from: InputEdge;
  private _to: InputEdge;
  private _distance: number;
  private _inBetweenEdges: InputEdge[];

  constructor(from: InputEdge, to: InputEdge, distance: number, inBetweenEdges: InputEdge[]) {
    this._from = from;
    this._to = to;
    this._distance = distance;
    this._inBetweenEdges = inBetweenEdges;
  }


  get from(): InputEdge {
    return this._from;
  }

  get to(): InputEdge {
    return this._to;
  }

  get distance(): number {
    return this._distance;
  }

  get inBetweenEdges(): InputEdge[] {
    return this._inBetweenEdges;
  }
}
