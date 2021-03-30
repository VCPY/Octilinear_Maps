/// <reference lib="webworker" />

addEventListener('message', ({data}) => {
  console.log("Worker started");
  readData()
    .then(result => {
      postMessage(result);
    });
});

const urlBase = "https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/";
const urlPrefix = "http://localhost:8080/";

const fileStops = 'stops.txt';
const fileTrips = 'trips.txt';
const fileRoutes = 'routes.txt';
const fileStopTimes = 'stop_times.txt';

async function readData() {
  let tripsPromise = fetchData(urlPrefix + urlBase + fileTrips, FileType.TRIPS);
  let stopsPromise = fetchData(urlPrefix + urlBase + fileStops, FileType.STOPS);
  let routesPromise = fetchData(urlPrefix + urlBase + fileRoutes, FileType.ROUTES);
  let stopTimesPromise = fetchData(urlPrefix + urlBase + fileStopTimes, FileType.STOPTIMES);

  return Promise.all([tripsPromise, stopsPromise, routesPromise, stopTimesPromise]);
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
