import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GtfsService {

  worker: Worker;

  constructor() { 
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }
    
    this.worker = new Worker('../workers/gtfs.worker', { type: 'module' });
    this.worker.onmessage = ({ data }) => {
      console.log("Service got message from worker");
    };
  }

  fetchAndParse() {
    this.worker.postMessage("");
  }
}
