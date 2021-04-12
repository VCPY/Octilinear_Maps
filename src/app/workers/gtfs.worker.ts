/// <reference lib="webworker" />

import {InputEdge, InputGraph, Station} from "../graphs/graph.classes";
import GraphInputParser from "../graphs/graph.inputParser";
import {orderEdges} from "../octi-algorithm/octiMaps.algorithm";

addEventListener('message', ({data}) => {
  console.log("Worker started");
  readData()
    .then(result => {
      postMessage(result);
      let inputParser = new GraphInputParser(result[0], result[1], result[2], result[3]);
      let inputGraph: InputGraph = inputParser.parseToInputGraph();
      //let inputGraph = dummyGraph();

      let orderedEdges = orderEdges(inputGraph);
    });
});

const urlBase = "https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/";
const urlPrefix = "http://localhost:8080/";

const fileStops = 'stops.txt';
const fileTrips = 'trips.txt';
const fileRoutes = 'routes.txt';
const fileStopTimes = 'stop_times.txt';

async function readData(): Promise<any> {
  let tripsPromise = fetchData(urlPrefix + urlBase + fileTrips, FileType.TRIPS);
  let stopsPromise = fetchData(urlPrefix + urlBase + fileStops, FileType.STOPS);
  let routesPromise = fetchData(urlPrefix + urlBase + fileRoutes, FileType.ROUTES);
  let stopTimesPromise = fetchData(urlPrefix + urlBase + fileStopTimes, FileType.STOPTIMES);

  return Promise.all([tripsPromise, stopsPromise, routesPromise, stopTimesPromise]);
  // return Promise.all([0,0,0,0]) // Use when using the dummy graph
}

async function fetchData(url: string, type: FileType) {
  let result = null;
  await fetch(urlPrefix + url, {'method': "GET"})
    .then(result => {
      return (result.text())
    }).then(text => {
      result = parseGTFSToObjectArray(text, type);
    });
  return result;
}

function parseGTFSToObjectArray(lines: string, type: FileType) {
  lines = lines.replace(/['"]+/g, '');
  const linesArray = lines.split("\r\n");
  const keys = linesArray.shift()?.split(",") || [];
  const values = linesArray;

  let result: { [id: string]: string }[] = [];
  values.forEach(line => {
    if (line.length !== 0) {
      let element: { [id: string]: string } = {};
      let elementValues = line.split(",");
      for (let i = 0; i < keys.length; i++) {
        let elementValue = elementValues[i];
        let key = keys[i];
        let typeProperties = FileTypeProperties.getPropertiesByType(type);
        if (typeProperties.includes(key)) {
          element[key] = elementValue;
        }
      }
      result.push(element);
    }
  });
  return result;
}

enum FileType {
  STOPS,
  TRIPS,
  ROUTES,
  STOPTIMES
}

class FileTypeProperties {
  static stops = ["stop_id", "stop_lat", "stop_lon", "stop_name"];
  static trips = ["route_id", "trip_id"];
  static routes = ["route_id", "route_short_name", "route_color"];
  static stoptimes = ["trip_id", "stop_id", "stop_sequence"];

  static getPropertiesByType(type: FileType) {
    switch (type) {
      case FileType.ROUTES:
        return this.routes;
      case FileType.STOPS:
        return this.stops;
      case FileType.STOPTIMES:
        return this.stoptimes;
      case FileType.TRIPS:
        return this.trips;
    }
  }
}

function dummyGraph(): InputGraph {
  let nodes = [];
  nodes.push(createStation("1A", "1AID", "-2", "4"));
  nodes.push(createStation("1B", "1BID", "-4", "2"));
  nodes.push(createStation("1C", "1CID", "2", "1"));
  nodes.push(createStation("1D", "1DID", "2", "-2"));
  nodes.push(createStation("2", "2ID", "-2.5", "-2"));
  nodes.push(createStation("3", "3ID", "-0.5", "3"));
  nodes.push(createStation("4A", "4AID", "-2.5", "-2"));
  nodes.push(createStation("4B", "4BID", "-0.5", "-2"));
  nodes.push(createStation("5", "5ID", "-2", "1"));
  nodes.push(createStation("6", "6ID", "0", "0"));

  let edges = [];
  edges.push(createEdge("1AID", "3ID", "G"));
  edges.push(createEdge("3ID", "6ID", "G"));
  edges.push(createEdge("6ID", "4BID", "G"));
  edges.push(createEdge("4BID", "1DID", "G"));
  edges.push(createEdge("1BID", "5ID", "R"));
  edges.push(createEdge("5ID", "6ID", "R"));
  edges.push(createEdge("6ID", "1CID", "R"));
  edges.push(createEdge("3ID", "5ID", "O"));
  edges.push(createEdge("5ID", "4AID", "O"));
  edges.push(createEdge("4AID", "2ID", "O"));
  edges.push(createEdge("2ID", "4AID", "B"));
  edges.push(createEdge("4AID", "4BID", "B"));
  edges.push(createEdge("4BID", "6ID", "B"));
  edges.push(createEdge("6ID", "5ID", "B"));

  let inputGraph = new InputGraph();
  inputGraph.nodes = nodes;
  inputGraph.edges = edges;

  return inputGraph;
}


function createEdge(station1: string, station2: string, line: string): InputEdge {
  let edge = new InputEdge(line);
  edge.station1 = station1;
  edge.station2 = station2;
  return edge;
}

function createStation(name: string, id: string, longitude: string, latitude: string) {
  let station = new Station();
  station.stationName = name;
  station.stopID = id;
  station.latitude = parseFloat(latitude);
  station.longitude = parseFloat(longitude);
  return station
}

