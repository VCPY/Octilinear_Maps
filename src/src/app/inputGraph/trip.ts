export class Trip {
  tripID: string = "";
  routeID: string = "";
  routeShortName: string = "";
  lineColor: string = "";
  routeType: string = "";
  stops = new Map();

  constructor(tripID: string) {
    this.tripID = tripID
  }

  addStop(id: string, sequence: number) {
    this.stops.set(sequence, id);
  }

}