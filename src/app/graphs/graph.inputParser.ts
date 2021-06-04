import {Station} from "../inputGraph/station";
import {InputEdge} from "../inputGraph/inputEdge";
import {InputGraph} from "../inputGraph/inputGraph";
import {Trip} from "../inputGraph/trip";
import * as XLSX from 'xlsx'

/**
 * Parses the data from the GTFS files to the input graph format
 * @param data array with length 4 containing the content from trips.txt, stops.txt, routes.txt, stop_times.txt
 */
export function parseDataToInputGraph(data: any[]) {
  console.log("Creating InputGraph from gtfs data");
  let inputParser = new GraphInputParser(data[0], data[1], data[2], data[3]);
  return inputParser.parseToInputGraph()
}

/**
 * Parser for parsing GTFS Data to the InputGraph format
 */
export default class GraphInputParser {
  /**
   * Content of the routes.txt file
   */
  routes: any[];
  /**
   * Content of the stops.txt file
   */
  stops: any[];
  /**
   * Content of the stop_times.txt file
   */
  stopTimes: any[];
  /**
   * Content of the trips.txt file
   */
  trips: any[];

  constructor(trips: any[], stops: any[], routes: any[], stopTimes: any[]) {
    this.routes = routes;
    this.stops = stops;
    this.stopTimes = stopTimes;
    this.trips = trips;
  }

  /**
   * Parses the content of the array routes, stops, stopTimes and trips to an InputGraph
   */
  parseToInputGraph(): InputGraph {
    let inputGraph: InputGraph = new InputGraph();
    let stations: Station[] = [];
    let stationIdMapper: Map<string, string> = new Map<string, string>();
    let stationIdByName: Map<string, string> = new Map<string, string>();
    let stationsByID: { [id: string]: Station } = {};
    this.stops.forEach(stop => {
      let station = new Station();
      station.stationName = "" + stop["stop_name"];

      if (!stationIdByName.has("" + stop["stop_name"])) {
        stationIdByName.set("" + stop["stop_name"], "" + stop["stop_id"]);
        station.stopID = stationIdByName.get("" + stop["stop_name"]) as string;
        stationIdMapper.set("" + stop["stop_id"], "" + stop["stop_id"]);

        station.latitude = parseFloat(stop["stop_lat"]);
        station.longitude = parseFloat(stop["stop_lon"]);
        stations.push(station);
        stationsByID["" + stop["stop_id"]] = station;
      } else {
        stationIdMapper.set("" + stop["stop_id"], stationIdByName.get("" + stop["stop_name"]) as string);
      }
    });
    inputGraph.nodes = stations;

    let routeIDsByTripIDs: { [id: string]: string } = {};
    this.trips.forEach(trip => routeIDsByTripIDs["" + trip["trip_id"]] = "" + trip["route_id"]);

    let routeNamesByRouteID: { [id: string]: string } = {};
    let routeColorByRouteID: { [id: string]: string } = {};
    let routeTypeByRouteID: { [id: string]: string } = {};
    this.routes.forEach(route => routeNamesByRouteID["" + route["route_id"]] = "" + route["route_short_name"]);
    this.routes.forEach(route => {
      if (route["route_color"] != undefined) routeColorByRouteID["" + route["route_id"]] = "#" + route["route_color"]
      routeTypeByRouteID["" + route["route_id"]] = "" + route["route_type"];
    })

    let tripsByID: { [id: string]: Trip } = {};
    this.stopTimes.forEach(stopTime => {
      let tripID = stopTime["trip_id"];

      let trip = (tripsByID[tripID] == undefined) ? new Trip(tripID) : tripsByID[tripID];
      trip.addStop("" + stopTime["stop_id"], stopTime["stop_sequence"]);

      tripsByID[tripID] = trip;
    });

    let allTripIDs = Object.keys(tripsByID);
    let resultTrip: Trip[] = [];
    allTripIDs.forEach(tripID => {
      let trip = tripsByID[tripID];
      trip.routeID = routeIDsByTripIDs[trip.tripID];
      trip.routeShortName = routeNamesByRouteID[trip.routeID];
      trip.lineColor = routeColorByRouteID[trip.routeID];
      trip.routeType = routeTypeByRouteID[trip.routeID];

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

        let inputEdge = new InputEdge(trip.routeShortName, station1, station2, trip.lineColor, trip.routeType);
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


/**
 * Checks if the given array contains the given edge.
 * @param arr The array to search through
 * @param edge The edge to search for
 */
function containsEdge(arr: InputEdge[], edge: InputEdge) {
  for (let i = 0; i < arr.length; i++) {
    let arrStation = arr[i]
    if (arrStation.equalsByStation(edge) && arrStation.line[0] == edge.line[0]) {
      return true
    }
  }
  return false
}

/**
 * Checks if the given tripsByID contains the given trip.
 * @param tripsByID The array to search through
 * @param trip The trip to search for
 */
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

/**
 * Enum for the type of file from the GTFS Format
 */
export enum FileType {
  STOPS,
  TRIPS,
  ROUTES,
  STOPTIMES
}

