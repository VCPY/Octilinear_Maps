import {Constants} from "./constants";
import {OctiNode} from "./octiNode";
import {OctiEdge} from "./octiEdge";
import {GridNode} from "./gridNode";

/**
 * An OctiGraph consists of multiple OctiNodes that are connected by OctiEdges.
 * For an higher level of abstration, the OctiNodes are grouped together in multiple GridNodes.
 * These GridNodes are connected using matching OctiNodes, called port nodes.
 */
export class OctiGraph {

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

          const isDiagonal = Math.abs(dir.x) + Math.abs(dir.y) == 2;
          const newEdge = new OctiEdge(portNode, otherPortNode, isDiagonal ? Constants.COST_HOP_DIAGONAL : Constants.COST_HOP);
          portNode.addEdge(newEdge);
          otherPortNode.addEdge(newEdge);
        }
      }
    }
  }

  private _gridNodes: GridNode[][] = [];

  get gridNodes(): GridNode[][] {
    return this._gridNodes;
  }

  get allNodes(): OctiNode[] {
    return this.gridNodes.flatMap(n => n.flatMap(n => n.octiNodes));
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  hasNode(x: number, y: number): boolean {
    if (x < 0 || x >= this._width) return false;
    if (y < 0 || y >= this._height) return false;

    return true;
  }

  getNode(x: number, y: number): GridNode {
    return this._gridNodes[x][y];
  }

  /**
   * For the given edge, the edge which is crossing it within the Graph is returned. Both edges must be diagonally placed.
   * @param edge
   */
  getDiagonal(edge: OctiEdge) {
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

      return octiNodeA.getEdge(octiNodeB) as OctiEdge;
    }
    return undefined;
  }

  /**
   * For the given edge, its crossing (diagonally) edge is closed by setting the weight to infinity. If crossing is allowed
   * within the graph, then the weight is set to Constants.COST_CROSSING.
   * @param edge The edge whose crossing edge should be closed.
   * @param allowCrossing Boolean if crossing of edges within the graph is allowed.
   */
  closeDiagonalEdge(edge: OctiEdge, allowCrossing: boolean) {
    const diagonal = this.getDiagonal(edge);
    if (diagonal != undefined) {
      if (allowCrossing)
        diagonal.weight = Constants.COST_CROSSING;
      else
        diagonal.weight = Infinity;
    }
  }
}