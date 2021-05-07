import {Component, OnInit} from '@angular/core';
import {GtfsService} from '../services/gtfs.service';
import {AlgorithmService} from '../services/algorithm.service';
import {InputGraph} from "../inputGraph/inputGraph";

@Component({
  selector: 'app-octi-test',
  templateUrl: './octi-test.component.html',
  styleUrls: ['./octi-test.component.css']
})
export class OctiTestComponent implements OnInit {

  constructor(private gtfsService: GtfsService, private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {

    this.octiTest(false);
  }

  private async octiTest(useDummy: boolean) {
    let inputGraph: InputGraph;
    if (useDummy)
      inputGraph = this.gtfsService.createDummyGraph();
    else {
      let stored = localStorage.getItem("inputGraph");
      if (stored === null) {
        inputGraph = await this.gtfsService.fetchAndParse().toPromise();
        localStorage.setItem("inputGraph", JSON.stringify(inputGraph));
      } else {
        console.log("Got inputGraph from local storage");
        inputGraph = JSON.parse(stored);
      }
    }

    this.algorithmService.perform(inputGraph);
  }
}
