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
  // @ts-ignore
  svg;

  constructor() {
  }

  ngOnInit(): void {
    this.svg = d3.select("#drawingPlaneSVG").append("svg")
      .attr("width", "100%")
      .attr("height", 500)
      .attr("paddingTop", 50)
      .append("g");
    Constants.octiGraph.registerListener(this.callback.bind(this));
  }

  callback(graph: Object, paths: Map<InputEdge, OctiNode[]>) {

    if (graph != undefined && paths != undefined) {
      this.drawPaths(paths, plainToClass(OctiGraphOutput, graph));
    }
  }

  private drawPaths(paths: Map<InputEdge, OctiNode[]>, graph: OctiGraphOutput) {
    let stations = new Set<GridNodeOutput>();
    paths.forEach((value, key) => {
      value = plainToClass(OctiNode, value);
      key = plainToClass(InputEdge, key);

      let firstPointID = ("" + value[0].id).slice(0, -1) + "0";
      let lastPointID = ("" + value[value.length - 1].id).slice(0, -1) + "0";
      let firstPoint = graph.getGridNodeById(parseFloat(firstPointID)) as GridNodeOutput;
      let lastPoint = graph.getGridNodeById(parseFloat(lastPointID)) as GridNodeOutput;
      stations.add(firstPoint);
      stations.add(lastPoint);
    });
    this.drawStations(stations)
  }

  private drawStations(nodes: Set<GridNodeOutput>) {
    this.svg.selectAll(".dot")
      .append('g')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('cx', (node:GridNodeOutput) => {
        return (node.x * 20) + this.planeXOffset;
      })
      .attr('cy', (node:GridNodeOutput) => {
        return (node.y * 20) + this.planeYOffset;
      })
      .attr('r', 10)
      .style('fill', 'black');
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
