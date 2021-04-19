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

  constructor(gridNode: GridNode, id: number) {
    this._gridNode = gridNode;
    this._id = id;
  }

  addEdge(edge: OctiEdge) {
    this._edges.push(edge);
  }

  get id(): number {
    return this._id;
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

  setWeightForAllEdgesToInfinity(): void {
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
    this._originalWeight = this.weight;
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

  constructor(id: number, x: number, y: number) {
    this._id = id;
    this._x = x;
    this._y = y;

    this._octiNodes = new Array(9);

    // create all octi nodes
    for (let i = 0; i < 9; i++) {
      this._octiNodes[i] = new OctiNode(this, this._id + 1 + i);
    }

    // all OctiNodes of the same GridNode are fully connected
    // iterate over all uniquie cobinations of nodes
    // and create each edge
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 9; j++) {
        const node1 = this._octiNodes[i];
        const node2 = this._octiNodes[j];

        const newEdge = new OctiEdge(node1, node2, this.calculateWeight(i, j));
        node1.addEdge(newEdge);
        node2.addEdge(newEdge);
      }
    }
  }


  get id(): number {
    return this._id;
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

  reopenEdges() {
    this._octiNodes.forEach(node => {
      node.resetWeights();
    })
  }

  /**
   * Calculate the cost bewteen to OctiNodes by their index
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
}
