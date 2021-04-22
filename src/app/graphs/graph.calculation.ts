import {Station} from "./graph.classes";

export function calculateAngleBetweenVectors(p1: number[], p2: number[]) {
  let tan = Math.atan2(p2[1], p2[0]) - Math.atan2(p1[1], p1[0]);
  let angle = -1 * tan * (180 / Math.PI);
  if (angle < 0) angle = 360 + angle;

  return angle;
}

export function compareByLineDegree(a: Station, b: Station) {
  return b.lineDegree - a.lineDegree
}

export function euclideanDistance(station1: Station, station2: Station): number {
  let latDiff = Math.pow((station1.latitude - station2.latitude), 2);
  let longDiff = Math.pow((station1.longitude - station2.longitude), 2);
  return Math.sqrt(latDiff + longDiff);
}
