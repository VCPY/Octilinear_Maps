/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  console.log("Worker started");
  readData()
    .then(result => {
      postMessage(result);
    });
});

const urlBase = "https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/"
const urlPrefix = "http://localhost:8080/";

const fileStops = 'stops.txt';
const fileTrips = 'trips.txt';
const fileRoutes = 'routes.txt';
const fileStopTimes = 'stop_times.txt';

async function readData() {
  let tripsPromise = fetchData(urlPrefix + urlBase + fileTrips);
  let stopsPromise = fetchData(urlPrefix + urlBase + fileStops);
  let routesPromise = fetchData(urlPrefix + urlBase + fileRoutes);
  let stopTimesPromise = fetchData(urlPrefix + urlBase + fileStopTimes);

  return Promise.all([tripsPromise, stopsPromise, routesPromise,stopTimesPromise]);
}

async function fetchData(url: string) {
  let result = null;
  await fetch(urlPrefix + url, {'method': "GET"})
    .then(result => {
      return (result.text())
    }).then(text => {
      result = parseGTFSToObjectArray(text);
    });
  return result;
}

function parseGTFSToObjectArray(lines: string) {
  lines = lines.replace(/['"]+/g, '');
  const linesArray = lines.split("\r\n");
  const keys = linesArray.shift()?.split(",") || [];
  const values = linesArray;

  let result: {[id: string]: string}[] = [];
  values.forEach(line => {
    if (line.length !== 0) {
      let element: {[id: string]: string} = {};
      let elementValues = line.split(",");
      for (let i = 0; i < keys.length; i++) {
        let elementValue = elementValues[i];
        // element[keys[i]] = isNumeric(elementValue) ? parseFloat(elementValue) : elementValue
        element[keys[i]] = elementValue;
      }
      result.push(element);
    }
  });
  return result;
}

/*
function isNumeric(str) {
  if (typeof str != "string") return false;
  return !isNaN(str) && !isNaN(parseFloat(str))
}
*/
