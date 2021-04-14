import { Injectable } from '@angular/core';
import { InputGraph } from '../graphs/graph.classes';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  worker: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }
    
    this.worker = new Worker('../workers/algorithm.worker', { type: 'module', name: "algorithm-worker" });
    this.worker.onmessage = ({ data }) => {
      console.log("Got result from algorithm worker:");
      console.log(data);
    };
   }

  perform(inputGraph: InputGraph) {
    this.worker.postMessage(inputGraph);
  }
}
