import {Component, OnInit} from '@angular/core';
import {OutputGraph} from "../outputGraph/outputGraph";
import * as d3 from 'd3';
import {AlgorithmService} from "../services/algorithm.service";
import {OutputEdge} from "../outputGraph/outputEdge";
import {Vector2} from "../util";
import {OutputStation} from "../outputGraph/outputStation";

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

  constructor(private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {
    this.algorithmService.OnReceivedResult.subscribe(o => this.callback(o));
  }

  callback(outputGraph: OutputGraph) {
    this.planeWidth = outputGraph.width * this.gapFactor + this.planeXOffset;
    this.planeHeight = outputGraph.height * this.gapFactor + this.planeYOffset;

    this.svg = d3.select("#drawingPlaneSVG").append("svg")
      .attr("width", this.planeWidth)
      .attr("height", this.planeHeight)
      .append("g");

    this.drawPaths(outputGraph);
  }

  private drawPaths(outputGraph: OutputGraph) {
    outputGraph.paths.forEach(path => {
      this.drawLines(path);
    });
    this.drawMainStations(outputGraph.stations);
  }

  private drawLines(edge: OutputEdge) {

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
      .data([edge.points])
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
      intermediatePoints.push([pathNode.getPointAtLength(step * i), edge.inBetweenStations[i - 1]]);
    }
    this.drawIntermediateStations(intermediatePoints);
  }

  private drawIntermediateStations(nodes: Array<[SVGPoint, string]>) {
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

  private drawMainStations(stations: OutputStation[]) {
    let circ = this.svg.selectAll(".dot")
      .append('g')
      .data(stations)
      .enter();

    circ.append('circle')
      .attr('cx', (s: OutputStation) => this.planeXPosition(s.position))
      .attr('cy', (s: OutputStation) => this.planeYPosition(s.position))
      .attr('r', 10)
      .style('fill', 'black');

    circ.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr("transform", (station: OutputStation) => {
        return "translate(" + this.planeXPosition(station.position) + "," + this.planeYPosition(station.position) + ") rotate(-30)";
      })

      .text((station: OutputStation) => {
        return station.name;
      });
  }

  private planeXPosition(position: Vector2) {
    return (position.x * this.gapFactor) + this.planeXOffset;
  }

  private planeXPosition2(position: Vector2) {
    return (position.x * 50) + this.planeXOffset;
  }

  private planeYPosition(position: Vector2) {
    return this.planeHeight - ((position.y * this.gapFactor) + this.planeYOffset);
  }

  private planeYPosition2(position: Vector2) {
    return (position.y * 50) + this.planeXOffset;
  }
}
