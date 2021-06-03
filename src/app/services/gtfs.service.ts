import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {InputGraph} from "../inputGraph/inputGraph";

@Injectable({
  providedIn: 'root'
})
export class GtfsService {

  worker: Worker;
  private subject = new Subject<InputGraph>();

  private _inputGraphSubject: Subject<InputGraph> = new Subject<InputGraph>();

  public readonly OnReceivedResult: Observable<InputGraph> = this._inputGraphSubject.asObservable();

  constructor() {
    if (typeof Worker !== 'undefined') {
      // worker not supported
    }

    this.worker = new Worker('../workers/gtfs.worker', {type: 'module', name: "gtfs-worker"});
    this.worker.onmessage = ({data}) => {
      //TODO:
      console.log("On message called")
      this._inputGraphSubject.next(data);
    };
  }

  loadData(routes: any[], trips: any[], stops: any[], stopTimes: any[]){
    this.worker.postMessage({routes: routes, trips: trips, stops: stops, stopTimes: stopTimes})
    return this.subject.asObservable();
  }
}