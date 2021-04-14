import { Component, Input, OnInit } from '@angular/core';
import { InputGraph } from '../graphs/graph.classes';
import { GtfsService } from '../services/gtfs.service';
import { AlgorithmService } from '../services/algorithm.service';

@Component({
  selector: 'app-octi-test',
  templateUrl: './octi-test.component.html',
  styleUrls: ['./octi-test.component.css']
})
export class OctiTestComponent implements OnInit {

  constructor(private gtfsService: GtfsService, private algorithmService: AlgorithmService) { }

  ngOnInit(): void {

    this.octiTest(true);
  }

  private async octiTest(useDummy: boolean)
  {
    let inputGraph: InputGraph;
    if (useDummy)
      inputGraph = this.gtfsService.createDummyGraph();
    else
      inputGraph = await this.gtfsService.fetchAndParse().toPromise();

    this.algorithmService.perform(inputGraph);
  }
}
