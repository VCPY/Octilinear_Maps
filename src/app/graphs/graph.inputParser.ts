import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";
import {InputGraph} from "../inputGraph/inputGraph";
import {Trip} from "../inputGraph/trip";

export function parseDataToInputGraph(data: any[]) {
  console.log("Creating InputGraph from gtfs data");
  let inputParser = new GraphInputParser(data[0], data[1], data[2], data[3]);
  let inputGraph: InputGraph = inputParser.parseToInputGraph();
  return inputGraph
}


function getLargerTrip(trip1: Trip, trip2: Trip): Trip {
  let sequences1 = trip1.stops.size;
  let sequences2 = trip2.stops.size;

  if (sequences2 > sequences1) {
    return trip2;
  } else {
    return trip1;
  }
}

export default class GraphInputParser {
  routes: any[];
  stops: any[];
  stopTimes: any[];
  trips: any[];

  constructor(trips: any[], stops: any[], routes: any[], stopTimes: any[]) {
    this.routes = routes;
    this.stops = stops;
    this.stopTimes = stopTimes;
    this.trips = trips;
  }

  parseToInputGraph(): InputGraph {
    let inputGraph: InputGraph = new InputGraph();
    let stations: Station[] = [];
    let stationIdMapper: Map<string, string> = new Map<string, string>();
    let stationIdByName: Map<string, string> = new Map<string, string>();
    let stationsByID: { [id: string]: Station } = {};
    this.stops.forEach(stop => {
      let station = new Station();
      station.stationName = stop["stop_name"];

      if (!stationIdByName.has(stop["stop_name"])) {
        stationIdByName.set(stop["stop_name"], stop["stop_id"]);
        station.stopID = stationIdByName.get(stop["stop_name"]) as string;
        stationIdMapper.set(stop["stop_id"], stop["stop_id"]);

        station.latitude = parseFloat(stop["stop_lat"]);
        station.longitude = parseFloat(stop["stop_lon"]);
        stations.push(station);
        stationsByID[stop["stop_id"]] = station;
      } else {
        stationIdMapper.set(stop["stop_id"], stationIdByName.get(stop["stop_name"]) as string);
      }
    });
    inputGraph.nodes = stations;

    let routeIDsByTripIDs: { [id: string]: string } = {};
    this.trips.forEach(trip => routeIDsByTripIDs[trip["trip_id"]] = trip["route_id"]);

    let routeNamesByRouteID: { [id: string]: string } = {};
    let routeColorByRouteID: { [id: string]: string } = {};
    this.routes.forEach(route => routeNamesByRouteID[route["route_id"]] = route["route_short_name"]);
    this.routes.forEach(route => {
      if (route["route_color"] != undefined) routeColorByRouteID[route["route_id"]] = "#" + route["route_color"]
    })

    let tripsByID: { [id: string]: Trip } = {};
    this.stopTimes.forEach(stopTime => {
      let tripID = stopTime["trip_id"];

      let trip = (tripsByID[tripID] == undefined) ? new Trip(tripID) : tripsByID[tripID];
      trip.addStop(stopTime["stop_id"], stopTime["stop_sequence"]);

      tripsByID[tripID] = trip;
    });

    let allTripIDs = Object.keys(tripsByID);
    let resultTrip: Trip[] = [];
    allTripIDs.forEach(tripID => {
      let trip = tripsByID[tripID];
      trip.routeID = routeIDsByTripIDs[trip.tripID];
      trip.routeShortName = routeNamesByRouteID[trip.routeID];
      trip.lineColor = routeColorByRouteID[trip.routeID];

      if (!containsTrip(resultTrip, trip)) {
        resultTrip.push(trip);
      }
    });

    let edges: InputEdge[] = [];
    resultTrip.forEach((trip: Trip) => {
      let stopSequence = trip.stops;
      for (let i = 2; i < stopSequence.size + 1; i++) {
        let id1 = stopSequence.get("" + (i - 1));
        let id2 = stopSequence.get("" + i);
        let station1 = stationsByID[stationIdMapper.get(id1) as string];
        let station2 = stationsByID[stationIdMapper.get(id2) as string];

        let inputEdge = new InputEdge(trip.routeShortName, station1, station2, trip.lineColor);
        if (inputEdge.station2 == undefined || inputEdge.station1 == undefined) {
          continue
        }
        if (inputEdge.station1.stopID != inputEdge.station2.stopID && !containsEdge(edges, inputEdge)) {
          edges.push(inputEdge);
        }
      }
    });

    inputGraph.edges = edges;

    return inputGraph;
  }

}

export function parseGTFSToObjectArray(lines: string, type: FileType) {
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
        if (typeProperties!.includes(key)) {
          element[key] = elementValue;
        }
      }
      result.push(element);
    }
  });
  return result;
}

function containsEdge(arr: InputEdge[], edge: InputEdge) {
  for (let i = 0; i < arr.length; i++) {
    let arrStation = arr[i]
    if (arrStation.equalsByStation(edge) && arrStation.line[0] == edge.line[0]) {
      return true
    }
  }
  return false
}

function containsTrip(tripsByID: Trip[], trip: Trip) {
  for (let i = 0; i < tripsByID.length; i++) {
    let arrTrip = tripsByID[i]
    if (arrTrip.stops.size != trip.stops.size || trip.routeShortName != arrTrip.routeShortName) {
      continue;
    }

    let equivalent = true;
    for (let j = 1; j < arrTrip.stops.size + 1; j++) {
      let stop1 = arrTrip.stops.get("" + j)
      let stop2 = trip.stops.get("" + j)

      if (stop1 != stop2) {
        equivalent = false;
        break;
      }
    }
    if (equivalent) {
      return true
    }
  }

  return false;
}


export enum FileType {
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