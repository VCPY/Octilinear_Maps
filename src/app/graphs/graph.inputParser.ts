import {getLargerTrip, InputEdge, InputGraph, Station, Trip} from './graph.classes'

export default class GraphInputParser {
  routes: any[];
  stops: any[];
  stopTimes: any[];
  trips: any[];

  constructor(trips: [], stops: [], routes: [], stopTimes: []) {
    this.routes = routes;
    this.stops = stops;
    this.stopTimes = stopTimes;
    this.trips = trips;
  }

  parseToInputGraph(): InputGraph {
    let inputGraph: InputGraph = new InputGraph();
    let stations: Station[] = [];
    let stationsById: { [id: string]: Station } = {};
    this.stops.forEach(stop => {
      let station = new Station();
      station.stationName = stop["stop_name"];
      station.stopID = stop["stop_id"];
      station.latitude = stop["stop_lat"];
      station.longitude = stop["stop_lon"];
      stations.push(station);
      stationsById[stop["stop_id"]] = station;
    });
    inputGraph.nodes = stations;

    let routeIdByTripId: { [id: string]: string } = {};
    this.trips.forEach(trip => routeIdByTripId[trip["trip_id"]] = trip["route_id"]);

    let routeNameByRouteId: { [id: string]: string } = {};
    this.routes.forEach(route => routeNameByRouteId[route["route_id"]] = route["route_short_name"]);

    let tripsById: { [id: string]: Trip } = {};
    this.stopTimes.forEach(stopTime => {
      let tripID = stopTime["trip_id"];
      let trip = (tripsById[tripID] == undefined) ? new Trip(tripID) : tripsById[tripID];
      trip.addStop(stopTime["stop_id"], stopTime["stop_sequence"]);
      tripsById[tripID] = trip;
    });

    let allRouteKeys = Object.keys(tripsById);
    allRouteKeys.forEach(key => {
      let obj = tripsById[key];
      obj.routeID = routeIdByTripId[obj.tripID];
      obj.routeShortName = routeNameByRouteId[obj.routeID];
      tripsById[key] = obj;
    });

    let largestTripByName = new Map();
    Object.values(tripsById).forEach(trip => {
      if (largestTripByName.has(trip.routeShortName)) {
        let currentLargestTrip = largestTripByName.get(trip.routeShortName);
        largestTripByName.set(trip.routeShortName, getLargerTrip(currentLargestTrip, trip));
      } else {
        largestTripByName.set(trip.routeShortName, trip);
      }
    });

    let edges: InputEdge[] = [];
    largestTripByName.forEach((trip: Trip, lineName: string) => {
      let stopSequence = trip.stops;
      for (let i = 2; i < stopSequence.size + 1; i++) {
        let inputEdge = new InputEdge(lineName);
        let id1 = stopSequence.get("" + (i - 1));
        let id2 = stopSequence.get("" + i);
        inputEdge.station1 = stationsById[id1];
        inputEdge.station2 = stationsById[id2];
        edges.push(inputEdge);
      }
    });

    inputGraph.edges = edges;
    return inputGraph;
  }

}
