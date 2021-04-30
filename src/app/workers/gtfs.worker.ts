/// <reference lib="webworker" />

import {InputGraph} from "../graphs/graph.classes";
import GraphInputParser from "../graphs/graph.inputParser";

addEventListener('message', ({data}) => {
  console.log("[gtfs-worker] started");
  readData()
    .then(result => {
      console.log("[gtfs-worker] creating InputGraph from gtfs data");
      let inputParser = new GraphInputParser(result[0], result[1], result[2], result[3]);
      let inputGraph: InputGraph = inputParser.parseToInputGraph();

      inputGraph.edges = inputGraph.edges.filter(e => e.line.startsWith("U"));
      inputGraph.edges = inputGraph.edges.filter(e => !e.line.startsWith("U1E"));

      console.log("[gtfs-worker] finished");
      postMessage(inputGraph);
    });
});

const urlBase = "https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/";
const urlPrefix = "http://localhost:8080/";

const fileStops = 'stops.txt';
const fileTrips = 'trips.txt';
const fileRoutes = 'routes.txt';
const fileStopTimes = 'stop_times.txt';

async function readData(): Promise<any> {
  console.log("[gtfs-worker] downloading files");
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
  const linesArray = lines.split("\r\n");
  let keysString: string = linesArray.shift() || "";
  keysString = keysString.replace(/['"]+/g, '');
  let keys = keysString.split(",");
  const values = linesArray;

  let result: { [id: string]: string }[] = [];
  values.forEach(line => {
    if (line.length !== 0) {
      let element: { [id: string]: string } = {};
      let elementValues = splitLine(line);
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

function splitLine(str: string): string[] {
  var myRegexp = /[^\s"]+|"([^"]*)"/gi;
  var myArray = [];

  do {
    var match = myRegexp.exec(str);
    if (match != null) {
      myArray.push(match[1] ? match[1] : match[0]);
    }
  } while (match != null);

  for (let i = 0; i < myArray.length; i++) {
    if (myArray[i] == ",") {
      myArray.splice(i, 1);
      i--;
    }
  }
  return myArray
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
