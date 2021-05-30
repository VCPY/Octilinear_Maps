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
/**
 * Component in which the created graph is drawn.
 */
export class DrawingplaneComponent implements OnInit {

  planeXOffset = 50;
  planeYOffset = 50;
  gapFactor = 50;
  // @ts-ignore
  svg;
  planeWidth = 3000;
  planeHeight = 3000;
  hideSpinner: boolean = false;
  colors: { [id: string]: string } = {}
  keys: string[] = []

  constructor(private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {
    this.algorithmService.OnReceivedResult.subscribe(o => this.callback(o));
  }

  callback(outputGraph: OutputGraph) {
    this.calculatePlaneSize(outputGraph);
    this.createColorPicker(outputGraph)
    this.keys = Object.keys(this.colors)

    this.svg = d3.select("#drawingPlaneSVG").append("svg")
      .attr("width", this.planeWidth)
      .attr("height", this.planeHeight)
      .append("g");

    this.drawPaths(outputGraph);
  }

  /**
   * Draws the nodes and edges of the outputGraph as stations and lines, respectively.
   * @param outputGraph The graph containing the data to be drawn
   * @private
   */
  private drawPaths(outputGraph: OutputGraph) {
    outputGraph.paths.forEach(path => this.drawLines(path));
    this.drawMainStations(outputGraph.stations);
    this.hideSpinner = true;
  }

  /**
   * Draws the lines for the given edge. If the edge.lines >1, then multiple parallel lines are drawn. Draws
   * elements in edge.inBetweenStations as equally spaced points on the created lines.
   * @param edge The edge which should be drawn
   * @private
   */
  private drawLines(edge: OutputEdge) {
    let line = d3.line()
      .x((d) =>
        // @ts-ignore
        this.planeXPosition(d))
      .y((d) =>
        // @ts-ignore
        this.planeYPosition(d))
      .curve(d3.curveLinear);

    let path = this.svg.selectAll(".line")
      .data([edge.points])
      .enter().append("path")
      .attr("d", line)
      .attr("class", "lineclass" + edge.lines[0])
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
            .style("stroke", edge.color)
            .attr("class", "lineclass" + edge.lines[j])
            .attr("x1", this.planeXPosition(data[0]) + offsetX)
            .attr("y1", this.planeYPosition(data[0]) + offsetY)
            .attr("x2", this.planeXPosition(data[1]) + offsetX)
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

  /**
   * Appends a label with the line names for the given edge to the svg
   * @param edge The edge which is labelled
   * @private
   */
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

  /**
   * Removes any line labels from the svg.
   * @private
   */
  private removeLineLabel() {
    this.svg.selectAll("text.labelLine").remove();
    this.svg.selectAll("rect").remove();
  }

  /**
   * Draws nodes as small dots at the given SVGPoint
   * @param nodes Array with length 2. First element is the point where the dot should be drawn,
   * second element the text which should be displayed on a mouseover event.
   * @private
   */
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
          .text(() => element[1])

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
      .on("mouseout", () => {
        that.svg.selectAll("text.label").remove();
        that.svg.selectAll("rect").remove();
      });
  }

  /**
   * Draws the stations as dots in the svg
   * @param stations
   * @private
   */
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

  /**
   * Calculates the X position on the svg plane using the grid position.
   * @param position The x- and y-position in the grid graph.
   * @private
   */
  private planeXPosition(position: Vector2) {
    return (position.x * this.gapFactor) + this.planeXOffset;
  }

  /**
   * Calculates the Y position on the svg plane using the grid position.
   * @param position The x- and y-position in the grid graph.
   * @private
   */
  private planeYPosition(position: Vector2) {
    return this.planeHeight - ((position.y * this.gapFactor) + this.planeYOffset);
  }

  /**
   * Callback for a change in the color pickers in the UI
   * @param event The new color
   * @param el The color picker whose color has changed
   */
  changeColor(event: string, el: string) {
    d3.selectAll(".lineclass" + el)
      .style("stroke", event)
  }

  /**
   * Calculates the size of the SVG Plane.
   * @param outputGraph The graph which should be drawn on the plane.
   * @private
   */
  private calculatePlaneSize(outputGraph: OutputGraph) {
    let min_x = outputGraph.width
    let min_y = outputGraph.height
    let max_x = -1
    let max_y = -1
    outputGraph.paths.forEach(path => {
        path.points.forEach(point => {
          min_x = Math.min(min_x, point.x)
          max_x = Math.max(max_x, point.x)
          min_y = Math.min(min_y, point.y)
          max_y = Math.max(max_y, point.y)
        })
      }
    )
    outputGraph.stations.forEach(station => {
      min_x = Math.min(min_x, station.position.x)
      max_x = Math.max(max_x, station.position.x)
      min_y = Math.min(min_y, station.position.y)
      max_y = Math.max(max_y, station.position.y)
    })

    this.planeHeight = (2 + max_y - min_y) * this.gapFactor + this.planeYOffset;
    this.planeWidth = (2 + max_x - min_x) * this.gapFactor + this.planeXOffset

    outputGraph.paths.forEach(path => {
        path.points.forEach(point => {
          point.y = point.y - min_y
          point.x = point.x - min_x
        })
      }
    )
    outputGraph.stations.forEach(station => {
      station.position.y = station.position.y - min_y
      station.position.x = station.position.x - min_x
    })
  }

  /**
   * Initializes the color pickers for the UI
   * @param outputGraph The graph to draw
   * @private
   */
  private createColorPicker(outputGraph: OutputGraph) {
    outputGraph.paths.forEach(path => {
      path.lines.forEach(line => this.colors[line] = path.color)
    })
  }
}
