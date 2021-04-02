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
    let stationsByID: { [id: string]: Station } = {};
    this.stops.forEach(stop => {
      let station = new Station();
      station.stationName = stop["stop_name"];
      station.stopID = stop["stop_id"];
      station.latitude = stop["stop_lat"];
      station.longitude = stop["stop_lon"];
      stations.push(station);
      stationsByID[stop["stop_id"]] = station;
    });
    inputGraph.nodes = stations;

    let routeIDsByTripIDs: { [id: string]: string } = {};
    this.trips.forEach(trip => routeIDsByTripIDs[trip["trip_id"]] = trip["route_id"]);

    let routeNamesByRouteID: { [id: string]: string } = {};
    this.routes.forEach(route => routeNamesByRouteID[route["route_id"]] = route["route_short_name"]);

    let tripsByID: { [id: string]: Trip } = {};
    this.stopTimes.forEach(stopTime => {
      let tripID = stopTime["trip_id"];

      let trip = (tripsByID[tripID] == undefined) ? new Trip(tripID) : tripsByID[tripID];
      trip.addStop(stopTime["stop_id"], stopTime["stop_sequence"]);

      tripsByID[tripID] = trip;
    });

    let allTripIDs = Object.keys(tripsByID);
    allTripIDs.forEach(tripID => {
      let trip = tripsByID[tripID];
      trip.routeID = routeIDsByTripIDs[trip.tripID];
      trip.routeShortName = routeNamesByRouteID[trip.routeID];

      tripsByID[tripID] = trip;
    });


    /**
     * Searches through all trips for the largest (number of stations) trip for a certain route name
     */
    let largestTripByRouteName = new Map();
    Object.values(tripsByID).forEach(trip => {
      let routeName = trip.routeShortName;
      if (largestTripByRouteName.has(routeName)) {
        let currentLargestTrip = largestTripByRouteName.get(routeName);
        largestTripByRouteName.set(routeName, getLargerTrip(currentLargestTrip, trip));
      } else {
        largestTripByRouteName.set(routeName, trip);
      }
    });

    let edges: InputEdge[] = [];
    largestTripByRouteName.forEach((trip: Trip, routeName: string) => {
      let stopSequence = trip.stops;
      for (let i = 2; i < stopSequence.size + 1; i++) {
        let id1 = stopSequence.get("" + (i - 1));
        let id2 = stopSequence.get("" + i);

        let inputEdge = new InputEdge(routeName);
        inputEdge.station1 = stationsByID[id1];
        inputEdge.station2 = stationsByID[id2];
        edges.push(inputEdge);
      }
    });

    inputGraph.edges = edges;
    return inputGraph;
  }

}
