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
      .attr('x', (node: GridNodeOutput) => {
        return this.planeXPosition(node);
      })
      .attr('y', (node: GridNodeOutput) => {
        return this.planeYPosition(node);
      })
      .text((node: GridNodeOutput) => {
        return (node.station as Station).stationName;
      });
  }

  private planeXPosition(node: GridNodeOutput) {
    return (node.x * 50) + this.planeXOffset;
  }

  private planeYPosition(node: GridNodeOutput) {
    return (node.y * 50) + this.planeYOffset;
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
