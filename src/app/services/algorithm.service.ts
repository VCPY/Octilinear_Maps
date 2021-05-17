import {Injectable} from '@angular/core';
import {InputGraph} from "../inputGraph/inputGraph";
import {OutputGraph} from "../outputGraph/outputGraph";
import {plainToClass} from "class-transformer";
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  worker: Worker;

  private _outputGraphSubject: Subject<OutputGraph> = new Subject<OutputGraph>();

  public readonly OnReceivedResult: Observable<OutputGraph> = this._outputGraphSubject.asObservable();

  constructor() {
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }

    this.worker = new Worker('../workers/algorithm.worker', {type: 'module', name: "algorithm-worker"});
    this.worker.onmessage = ({data}) => {

      // @ts-ignore
      const outputGraph = plainToClass(OutputGraph, data) as OutputGraph;
      console.log("Got result from algorithm worker:", outputGraph);

      this._outputGraphSubject.next(outputGraph);
    };
  }

  perform(inputGraph: InputGraph) {
    this.worker.postMessage(inputGraph);
  }
}
