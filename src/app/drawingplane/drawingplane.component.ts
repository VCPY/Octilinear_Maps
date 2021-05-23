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
  hideSpinner: boolean = false;

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
    this.hideSpinner = true;
  }

  private drawLines(edge: OutputEdge) {
    let line = d3.line()
      .x((d) =>
        // @ts-ignore
        this.planeXPosition2(d))
      .y((d) =>
        // @ts-ignore
        this.planeYPosition(d))
      .curve(d3.curveLinear);

    let path = this.svg.selectAll(".line")
      .data([edge.points])
      .enter().append("path")
      .attr("d", line)
      .style("fill", "none")
      .style("stroke-width", "2px")
      .style("stroke", edge.color)
      .on("mouseover", () => this.createLineLabel(edge))
      .on("mouseout", () => this.removeLineLabel());

    if (edge.lines.length > 1) {
      for (let j = 1; j < edge.lines.length; j++) {
        // Calculate the offset to the first drawn line
        let step = Math.ceil(j / 2);
        if (j % 2 != 0) step *= -1;

        for (let i = 0; i < edge.points.length - 1; i++) {
          let data = [edge.points[i], edge.points[i + 1]]
          let dx = Math.abs(edge.points[i].x - edge.points[i + 1].x)
          let dy = Math.abs(edge.points[i].y - edge.points[i + 1].y)

          let offsetX = 2.5 * step
          let offsetY = 0
          if (dx == 0) {
            offsetX = 2.5 * step
          } else if (dy == 0) {
            offsetX = 0
            offsetY = 2.5 * step
          } else if (dx == 1 && dy == 1) {
            offsetX = 3 * step
          } else if (dx == -1 && dy == 1) {
            offsetX = -3 * step
          }

          this.svg
            .append("line")
            .style("fill", "none")
            .style("class", "hello")
            .style("stroke-width", "2px")
            .style("stroke", "red")
            .attr("x1", this.planeXPosition2(data[0]) + offsetX)
            .attr("y1", this.planeYPosition(data[0]) + offsetY)
            .attr("x2", this.planeXPosition2(data[1]) + offsetX)
            .attr("y2", this.planeYPosition(data[1]) + offsetY)
            .on("mouseover", () => this.createLineLabel(edge))
            .on("mouseout", () => this.removeLineLabel())
        }
      }
    }

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

  private createLineLabel(edge: OutputEdge) {
    let bar = this.svg.append("g")
      .attr("transform", function (d: any, i: any) {
        return "translate(0," + i * 50 + ")";
      })

    let text = bar.append("text")
      .attr("class", "labelLine")
      .style("text-anchor", "middle")
      .attr("x", d3.pointer(event)[0] + 50)
      .attr("y", d3.pointer(event)[1] - 10)
      .text(() => {
        let result = ""
        for (let i = 0; i < edge.lines.length - 1; i++) {
          result += edge.lines[i] + ", "
        }
        result += edge.lines[edge.lines.length - 1]
        return result
      })

    let bbox = text.node().getBBox()
    bar.insert("rect", "text")
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("x", bbox.x - 2.5)
      .attr("y", bbox.y - 2.5)
      .attr("fill", "#8FD7EF")
      .attr("width", bbox.width + 5)
      .attr("height", bbox.height + 5)
      .attr("padding", 20)
      .attr("opacity", 1);
  }

  private removeLineLabel() {
    this.svg.selectAll("text.labelLine").remove();
    this.svg.selectAll("rect").remove();
  }

  private drawIntermediateStations(nodes: Array<[SVGPoint, string]>) {
    let that = this;
    let circ = this.svg.selectAll(".interDot")
      .append('g')
      .data(nodes)
      .enter();

    circ.append('circle')
      .attr('cx', (p: [SVGPoint, string]) => p[0].x)
      .attr('cy', (p: [SVGPoint, string]) => p[0].y)
      .attr('r', 5)
      .style('fill', 'white')
      .style('stroke', 'black')
      .on('mouseover', (event: any, element: any) => {
        let bar = that.svg.append("g")
          .attr("transform", function (d: any, i: any) {
            return "translate(0," + i * 50 + ")";
          })

        let text = bar.append("text")
          .attr("class", "label")
          .style("text-anchor", "middle")
          .attr("x", d3.pointer(event)[0] + 50)
          .attr("y", d3.pointer(event)[1] - 10)
          .text((d: any, i: any) => {
            return element[1]
          })

        let bbox = text.node().getBBox()
        bar.insert("rect", "text")
          .attr("rx", 6)
          .attr("ry", 6)
          .attr("x", bbox.x - 2.5)
          .attr("y", bbox.y - 2.5)
          .attr("fill", "#ACFFA8")
          .attr("width", bbox.width + 5)
          .attr("height", bbox.height + 5)
          .attr("padding", 20)
          .attr("opacity", 1);


      })
      .on("mouseout", function (d: any, i: any) {
        that.svg.selectAll("text.label").remove();
        that.svg.selectAll("rect").remove();
      })
    ;
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
