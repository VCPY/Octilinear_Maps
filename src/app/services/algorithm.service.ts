import {Injectable} from '@angular/core';
import {Constants} from "../octiGraph/constants";
import {InputGraph} from "../inputGraph/inputGraph";
import {Filters} from "../inputGraph/inputGraph.filter";

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  worker: Worker;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }

    this.worker = new Worker('../workers/algorithm.worker', {type: 'module', name: "algorithm-worker"});
    this.worker.onmessage = ({data}) => {
      console.log("Got result from algorithm worker:", data);
      Constants.octiGraph.graph = data[0];
      Constants.octiGraph.paths = data[1];
    };
  }

  perform(inputGraph: InputGraph) {
    this.worker.postMessage({graph: inputGraph, allowCrossing: Filters.ALLOWCROSSING});
  }
}
