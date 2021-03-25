const urlStops = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/stops.txt';
const urlTrips = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/trips.txt';
const urlRoutes = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/routes.txt';
const urlStopTimes = 'https://www.wienerlinien.at/ogd_realtime/doku/ogd/gtfs/stop_times.txt';
const urlPrefix = "http://localhost:8080/";

async function readData() {
  let result = null;
  let tripsPromise = fetchData(urlTrips);
  let stopsPromise = fetchData(urlStops);
  let routesPromise = fetchData(urlRoutes);
  let stopTimesPromise = fetchData(urlStopTimes);
  await Promise.all([tripsPromise, stopsPromise, routesPromise,stopTimesPromise]).then(values => {
    result = values;
  });
  return result;
}

async function fetchData(url) {
  let result = null;
  await fetch(urlPrefix + url, {'method': "GET"})
    .then(result => {
      return (result.text())
    }).then(text => {
      result = parseGTFSToObjectArray(text);
    });
  return result;
}

function parseGTFSToObjectArray(lines) {
  lines = lines.replace(/['"]+/g, '');
  const linesArray = lines.split("\r\n");
  const keys = linesArray.shift().split(",");
  const values = linesArray;

  let result = [];
  values.forEach(line => {
    if (line.length !== 0) {
      let element = {};
      let elementValues = line.split(",");
      for (let i = 0; i < keys.length; i++) {
        let elementValue = elementValues[i];
        element[keys[i]] = isNumeric(elementValue) ? parseFloat(elementValue) : elementValue
      }
      result.push(element);
    }
  });
  return result;
}

function isNumeric(str) {
  if (typeof str != "string") return false;
  return !isNaN(str) && !isNaN(parseFloat(str))
}
