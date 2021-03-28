import { Component, OnInit } from '@angular/core';
import { GtfsService } from '../services/gtfs.service';

@Component({
  selector: 'app-gtfs-test',
  templateUrl: './gtfs-test.component.html',
  styleUrls: ['./gtfs-test.component.css']
})
export class GtfsTestComponent implements OnInit {

  constructor(private gtfsService: GtfsService) {}

  ngOnInit(): void {
    this.gtfsService.fetchAndParse();
  }

}
