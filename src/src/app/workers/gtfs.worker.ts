/// <reference lib="webworker" />

import {FileType, parseDataToInputGraph} from "../graphs/graph.inputParser";
import * as XLSX from "xlsx";

addEventListener('message', ({data}) => {
  console.log("[gtfs-worker] started");
  let trips = data["trips"]
  let routes = data["routes"]
  let stops = data["stops"]
  let stopTimes = data["stopTimes"]
  let tripsObject: any, routesObject: any, stopObject: any, stopTimesObject: any;
  let promises = []
  promises.push(parseGTFSToObjectArray(trips, FileType.TRIPS).then(result => tripsObject = result))
  promises.push(parseGTFSToObjectArray(routes, FileType.ROUTES).then(result => routesObject = result))
  promises.push(parseGTFSToObjectArray(stops, FileType.STOPS).then(result => stopObject = result))
  promises.push(parseGTFSToObjectArray(stopTimes, FileType.STOPTIMES).then(result => stopTimesObject = result))
  Promise.all(promises).then(() => {
    let graph = parseDataToInputGraph([tripsObject, stopObject, routesObject, stopTimesObject])
    postMessage(graph)
  })
});


/**
 * Parses a file to a javascript object. Each line is considered one object
 * @param file The file to parse
 * @param type The type and name of the file.
 */
export async function parseGTFSToObjectArray(file: File, type: FileType) {
  let result: { [id: string]: string }[] = [];
  if (type != FileType.STOPTIMES) {
    type AOA = any[][];
    return new Promise((resolve, reject) => {
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        let data = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
        let keys: any[] = data.shift() || []
        result = createObjectsFromXLSX(data, keys)
        resolve(result)
      }
      reader.readAsText(file, "UTF-8");
    })
  } else {
    await file.text().then((text) => {
      const linesArray = text.split(/\r?\n/);
      let keysString: string = linesArray.shift() || "";
      keysString = keysString.replace(/['"]+/g, '');
      let keys = keysString.split(",");

      linesArray.forEach(line => {
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
    })
    return result;
  }
}


/**
 * Splits a line into its elements
 * @param str The line to split
 */
function splitLine(str: string): string[] {
  let myRegexp = /[^\s"]+|"([^"]*)"/gi;
  let myArray = [];

  let mat = (str.match(/"/g) || []).length;
  let num = -1
  num = (mat / 2) - 1
  let numComma = (str.match(new RegExp(",", "g")) || []).length;

  if (num == numComma) {
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
  } else {
    myArray = str.split(",")
  }
  return myArray
}

/**
 * Creates javascript objects from xlsx data
 * @param data the xlsx data
 * @param keys the keys for the xlsx data
 */
function createObjectsFromXLSX(data: any[][], keys: any[]) {
  let result = []
  for (let i = 0; i < data.length; i++) {
    let el = data[i]
    let obj: { [id: string]: string } = {}
    for (let j = 0; j < el.length; j++) {
      obj[keys[j]] = el[j]
    }
    result.push(obj)
  }
  return result;
}

/**
 * Stores the names of the attributes which should be fetched from the GTFS files.
 */
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


