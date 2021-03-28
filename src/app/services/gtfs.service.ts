import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GtfsService {

  constructor() { 
    if (typeof Worker !== 'undefined') {
      // Create a new
      const worker = new Worker('../workers/gtfs.worker', { type: 'module' });
      worker.onmessage = ({ data }) => {
        console.log(`page got message: ${data}`);
      };
      worker.postMessage('hello');
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }
}
