import {Component, OnInit} from '@angular/core';
import {Constants, OctiNode} from "../graph/octiGraph.classes";
import {GridNodeOutput, OctiGraphOutput} from "../graph/octiGraph.outputParser";
import * as d3 from 'd3';
import {InputEdge, Station} from "../graphs/graph.classes";
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
      this.drawLines(value, graph);
    });
    this.drawStations(stations)
  }

  private drawLines(paths: OctiNode[], graph: OctiGraphOutput) {
    let lines: Array<[GridNodeOutput, GridNodeOutput]> = [];
    for (let i = 0; i < paths.length - 1; i++) {
      let one = DrawingplaneComponent.getGridID(paths[i].id);
      let two = DrawingplaneComponent.getGridID(paths[i + 1].id);
      if (one == two) continue;

      let oneNode = graph.getGridNodeById(one) as GridNodeOutput;
      let twoNode = graph.getGridNodeById(two) as GridNodeOutput;
      lines.push([oneNode, twoNode]);
    }

    this.svg.selectAll(".line")
      .data(lines)
      .enter()
      .append("line")
      .style("stroke", "black")
      .attr("x1", (node: GridNodeOutput[]) => this.planeXPosition(node[0]))
      .attr("y1", (node: GridNodeOutput[]) => this.planeYPosition(node[0]))
      .attr("x2", (node: GridNodeOutput[]) => this.planeXPosition(node[1]))
      .attr("y2", (node: GridNodeOutput[]) => this.planeYPosition(node[1]));
  }

  private drawStations(nodes: Set<GridNodeOutput>) {
    let circ = this.svg.selectAll(".dot")
      .append('g')
      .data(nodes)
      .enter();

    circ.append('circle')
      .attr('cx', (node: GridNodeOutput) => {
        return this.planeXPosition(node);
      })
      .attr('cy', (node: GridNodeOutput) => {
        return this.planeYPosition(node);
      })
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

  private planeYPosition(node: GridNodeOutput) {
    return this.planeHeight - ((node.y * this.gapFactor) + this.planeYOffset);
  }

  private static getGridID(id: number): number {
    return parseFloat(("" + id).slice(0, -1) + "0");
  }

  /*private drawGraph(graph: GridNodeOutput[][]) {
    this.svg.selectAll(".dot")
      .append('g')
      .data(graph)
      .enter()
      .append('g')
      .selectAll(".dot")
      .data((d, i, j) => {
        return d;
      })
      .enter()
      .append('circle')
      .attr('cx', (obj) => {
        return (obj.x  * 100) + this.planeXOffset;
      })
      .attr('cy', (obj) => {
        return (obj.y * 100) + this.planeYOffset;
      })
      .attr('r', 20)
      .style('fill', 'black');
  }*/

}
