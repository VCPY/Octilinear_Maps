import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";
import {InputGraph} from "../inputGraph/inputGraph";
import {parseDataToInputGraph} from "../graphs/graph.inputParser";

@Injectable({
  providedIn: 'root'
})
export class GtfsService {

  worker: Worker;
  private subject = new Subject<InputGraph>();

  constructor() {
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }

    this.worker = new Worker('../workers/gtfs.worker', {type: 'module', name: "gtfs-worker"});
    this.worker.onmessage = ({data}) => {
      let inputGraph = parseDataToInputGraph(data)
      this.subject.next(inputGraph);
      this.subject.complete();
    };
  }

  // this will probably break with multiple calls
  fetchAndParse(): Observable<InputGraph> {
    //TODO: pass url of gtfs files
    this.worker.postMessage("");

    return this.subject.asObservable();
  }

  createDummyGraph(): InputGraph {
    let nodes = [];
    let st1A = this.createStation("1A", "1AID", "-2", "4");
    nodes.push(st1A);
    let st1B = this.createStation("1B", "1BID", "-4", "2");
    nodes.push(st1B);
    let st1C = this.createStation("1C", "1CID", "2", "1");
    nodes.push(st1C);
    let st1D = this.createStation("1D", "1DID", "2", "-2");
    nodes.push(st1D);
    let st2 = this.createStation("2", "2ID", "-2.5", "-2");
    nodes.push(st2);
    let st3 = this.createStation("3", "3ID", "-0.5", "3");
    nodes.push(st3);
    let st4A = this.createStation("4A", "4AID", "-2.5", "-4");
    nodes.push(st4A);
    let st4B = this.createStation("4B", "4BID", "-0.5", "-2");
    nodes.push(st4B);
    let st5 = this.createStation("5", "5ID", "-2", "1");
    nodes.push(st5);
    let st6 = this.createStation("6", "6ID", "0", "0");
    nodes.push(st6);

    let edges = [];
    edges.push(this.createEdge(st1A, st3, "G"));
    edges.push(this.createEdge(st3, st6, "G"));
    edges.push(this.createEdge(st6, st4B, "G"));
    edges.push(this.createEdge(st4B, st1D, "G"));
    edges.push(this.createEdge(st1B, st5, "R"));
    edges.push(this.createEdge(st5, st6, "R"));
    edges.push(this.createEdge(st6, st1C, "R"));
    edges.push(this.createEdge(st3, st5, "O"));
    edges.push(this.createEdge(st5, st4A, "O"));
    edges.push(this.createEdge(st4A, st2, "O"));
    edges.push(this.createEdge(st2, st4A, "B"));
    edges.push(this.createEdge(st4A, st4B, "B"));
    edges.push(this.createEdge(st4B, st6, "B"));
    edges.push(this.createEdge(st6, st5, "B"));

    let inputGraph = new InputGraph();
    inputGraph.nodes = nodes;
    inputGraph.edges = edges;

    return inputGraph;
  }


  private createEdge(station1: Station, station2: Station, line: string): InputEdge {
    let edge = new InputEdge(line, station1, station2, "#000000");
    return edge;
  }

  private createStation(name: string, id: string, longitude: string, latitude: string) {
    let station = new Station();
    station.stationName = name;
    station.stopID = id;
    station.latitude = parseFloat(latitude);
    station.longitude = parseFloat(longitude);
    return station
  }
}
