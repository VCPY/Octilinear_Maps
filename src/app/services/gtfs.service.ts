import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { InputGraph, InputEdge, Station } from "../graphs/graph.classes";

@Injectable({
  providedIn: 'root'
})
export class GtfsService {

  private subject = new Subject<InputGraph>();

  worker: Worker;

  constructor() { 
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }
    
    this.worker = new Worker('../workers/gtfs.worker', { type: 'module', name: "gtfs-worker"  });
    this.worker.onmessage = ({ data }) => {
      this.subject.next(data);
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
    nodes.push(this.createStation("1A", "1AID", "-2", "4"));
    nodes.push(this.createStation("1B", "1BID", "-4", "2"));
    nodes.push(this.createStation("1C", "1CID", "2", "1"));
    nodes.push(this.createStation("1D", "1DID", "2", "-2"));
    nodes.push(this.createStation("2", "2ID", "-2.5", "-2"));
    nodes.push(this.createStation("3", "3ID", "-0.5", "3"));
    nodes.push(this.createStation("4A", "4AID", "-2.5", "-4"));
    nodes.push(this.createStation("4B", "4BID", "-0.5", "-2"));
    nodes.push(this.createStation("5", "5ID", "-2", "1"));
    nodes.push(this.createStation("6", "6ID", "0", "0"));
  
    let edges = [];
    edges.push(this.createEdge("1AID", "3ID", "G"));
    edges.push(this.createEdge("3ID", "6ID", "G"));
    edges.push(this.createEdge("6ID", "4BID", "G"));
    edges.push(this.createEdge("4BID", "1DID", "G"));
    edges.push(this.createEdge("1BID", "5ID", "R"));
    edges.push(this.createEdge("5ID", "6ID", "R"));
    edges.push(this.createEdge("6ID", "1CID", "R"));
    edges.push(this.createEdge("3ID", "5ID", "O"));
    edges.push(this.createEdge("5ID", "4AID", "O"));
    edges.push(this.createEdge("4AID", "2ID", "O"));
    edges.push(this.createEdge("2ID", "4AID", "B"));
    edges.push(this.createEdge("4AID", "4BID", "B"));
    edges.push(this.createEdge("4BID", "6ID", "B"));
    edges.push(this.createEdge("6ID", "5ID", "B"));
  
    let inputGraph = new InputGraph();
    inputGraph.nodes = nodes;
    inputGraph.edges = edges;
  
    return inputGraph;
  }
  
  
  private createEdge(station1: string, station2: string, line: string): InputEdge {
    let edge = new InputEdge(line);
    edge.station1 = station1;
    edge.station2 = station2;
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
