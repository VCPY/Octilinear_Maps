import {Component, OnInit} from '@angular/core';
import {Constants, OctiNode} from "../graph/octiGraph.classes";
import {GridNodeOutput, OctiGraphOutput} from "../graph/octiGraph.outputParser";
import * as d3 from 'd3';
import {InputEdge} from "../graphs/graph.classes";
import {plainToClass} from "class-transformer";

@Component({
  selector: 'app-drawingplane',
  templateUrl: './drawingplane.component.html',
  styleUrls: ['./drawingplane.component.css']
})
export class DrawingplaneComponent implements OnInit {

  planeXOffset = 50;
  planeYOffset = 50;
  gapFactor = 50;
  // @ts-ignore
  svg;
  planeWidth = 3000;
  planeHeight = 3000;

  constructor() {
  }

  ngOnInit(): void {
    Constants.octiGraph.registerListener(this.callback.bind(this));
  }

  callback(graph: Object, paths: Map<InputEdge, OctiNode[]>) {
    if (graph != undefined && paths != undefined) {
      let octiGraph = plainToClass(OctiGraphOutput, graph) as OctiGraphOutput;
      this.planeWidth = octiGraph.width*this.gapFactor + this.planeXOffset;
      this.planeHeight = octiGraph.height*this.gapFactor + this.planeYOffset;

      this.svg = d3.select("#drawingPlaneSVG").append("svg")
        .attr("width", this.planeWidth)
        .attr("height", this.planeHeight )
        .append("g");
      this.drawPaths(paths, octiGraph);
    }
  }

  private drawPaths(paths: Map<InputEdge, OctiNode[]>, graph: OctiGraphOutput) {
    let stations = new Set<GridNodeOutput>();
    paths.forEach((value, key) => {
      value = plainToClass(OctiNode, value);
      key = plainToClass(InputEdge, key);

      let firstPointID = DrawingplaneComponent.getGridID(value[0].id);
      let lastPointID = DrawingplaneComponent.getGridID(value[value.length - 1].id);
      let firstPoint = graph.getGridNodeById(firstPointID) as GridNodeOutput;
      let lastPoint = graph.getGridNodeById(lastPointID) as GridNodeOutput;
      stations.add(firstPoint);
      stations.add(lastPoint);
      this.drawLines(key, value, graph);
    });
    this.drawMainStations(stations)
  }

  private drawLines(edge: InputEdge, pathArray: OctiNode[], graph: OctiGraphOutput) {
    let lines: IntermediateStation[] = [];
    for (let i = 0; i < pathArray.length - 1; i++) {
      let one = DrawingplaneComponent.getGridID(pathArray[i].id);
      let two = DrawingplaneComponent.getGridID(pathArray[i + 1].id);
      if (one == two) continue;

      let oneNode = graph.getGridNodeById(one) as GridNodeOutput;
      let twoNode = graph.getGridNodeById(two) as GridNodeOutput;
      lines.push(new IntermediateStation(oneNode.x, oneNode.y));
      lines.push(new IntermediateStation(twoNode.x, twoNode.y));
    }

    let self = this;
    let line = d3.line()
      .x((d) =>
        // @ts-ignore
        self.planeXPosition2(d))
      .y((d) =>
        // @ts-ignore
        self.planeYPosition(d))
      .curve(d3.curveLinear);

    let lineSVG = this.svg.selectAll(".line")
      .data([lines])
      .enter();

    let path = lineSVG.append("path")
      .attr("d", line)
      .style("fill", "none")
      .style("stroke", "black");

    let pathNode = path.node();
    let pathLength = pathNode.getTotalLength();
    let step = pathLength / (edge.inBetweenStations.length + 1);
    let intermediatePoints: Array<[SVGPoint, string]> = [];
    for (let i = 1; i <= edge.inBetweenStations.length; i++) {
      // @ts-ignore
      intermediatePoints.push([pathNode.getPointAtLength(step * i), edge.inBetweenStations[i-1]]);
    }
    this.drawIntermediateStations(intermediatePoints);
  }

  private drawIntermediateStations(nodes: Array<[SVGPoint, string]>){
    let circ = this.svg.selectAll(".interDot")
      .append('g')
      .data(nodes)
      .enter();

      circ.append('circle')
      .attr('cx', (p: [SVGPoint, string]) => p[0].x)
      .attr('cy', (p: [SVGPoint, string]) => p[0].y)
      .attr('r', 5)
      .style('fill', 'white')
      .style('stroke', 'black');

      // Use if the intermediate stations should be labeled
    /*circ.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr('x', (p: [SVGPoint, string]) => p[0].x)
      .attr('y', (p: [SVGPoint, string]) => p[0].y)
      .text((p:  [SVGPoint, string]) => {
        return p[1];
      });*/
  }

  private drawMainStations(nodes: Set<GridNodeOutput>) {
    let circ = this.svg.selectAll(".dot")
      .append('g')
      .data(nodes)
      .enter();

    circ.append('circle')
      .attr('cx', (node: GridNodeOutput) => this.planeXPosition(node))
      .attr('cy', (node: GridNodeOutput) => this.planeYPosition(node))
      .attr('r', 10)
      .style('fill', 'black');

    circ.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr("transform", (node: GridNodeOutput) => {
        return "translate(" + this.planeXPosition(node) + "," + this.planeYPosition(node) + ") rotate(-30)";
      })

      .text((node: GridNodeOutput) => {
        return node.stationName;
      });
  }

  private planeXPosition(node: GridNodeOutput) {
    return (node.x * this.gapFactor) + this.planeXOffset;
  }

  private planeXPosition2(node: IntermediateStation) {
    return (node.x * 50) + this.planeXOffset;
  }

  private planeYPosition(node: GridNodeOutput) {
    return this.planeHeight - ((node.y * this.gapFactor) + this.planeYOffset);
  }

  private planeYPosition2(node: IntermediateStation) {
    return (node.y * 50) + this.planeXOffset;
  }

  private static getGridID(id: number): number {
    return parseFloat(("" + id).slice(0, -1) + "0");
  }
}

class IntermediateStation {
  x: number = -1;
  y: number = -1;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
