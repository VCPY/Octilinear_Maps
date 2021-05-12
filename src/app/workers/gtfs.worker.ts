/// <reference lib="webworker" />

import {FileType, parseGTFSToObjectArray} from "../graphs/graph.inputParser";

addEventListener('message', ({data}) => {
  console.log("[gtfs-worker] started");
  readData()
    .then(result => {
      console.log("[gtfs-worker] finished");
      postMessage(result);
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


