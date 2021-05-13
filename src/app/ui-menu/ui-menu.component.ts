import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FileType, parseDataToInputGraph, parseGTFSToObjectArray} from "../graphs/graph.inputParser";
import {AlgorithmService} from "../services/algorithm.service";
import {Filters} from "../inputGraph/inputGraph.filter";

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.css']
})
export class UiMenuComponent implements OnInit {

  fileNames = ["stop_times", "stops", "trips", "routes"]
  stops: string | undefined = undefined
  stopTimes: string | undefined = undefined
  trips: string | undefined = undefined
  routes: string | undefined = undefined

  constructor(public dialog: MatDialog, private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {
    this.openDialog()
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogDataSelection, {
      width: "500px",
      data: ""
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      let self = this
      let data = result["data"]
      let promises: any = []
      if (data != undefined) {
        let keys = Object.keys(data)
        keys.forEach((key) => {
          let file = data[key]
          switch (file.name) {
            case "trips.txt":
              promises.push(file.text()
                .then((text: string) => {
                  self.trips = text
                }))
              break;
            case "stops.txt":
              promises.push(file.text()
                .then((text: string) => {
                  self.stops = text
                }))
              break;
            case "routes.txt":
              promises.push(file.text()
                .then((text: string) => {
                  self.routes = text
                }))
              break;
            case "stop_times.txt":
              promises.push(file.text()
                .then((text: string) => {
                  self.stopTimes = text
                }))
              break;
            default: //Ignore
          }
        })
        Promise.all(promises).then((result: any[]) => {
          let inputGraph = parseDataToInputGraph([parseGTFSToObjectArray(self.trips!, FileType.TRIPS),
            parseGTFSToObjectArray(self.stops!, FileType.STOPS),
            parseGTFSToObjectArray(self.routes!, FileType.ROUTES),
            parseGTFSToObjectArray(self.stopTimes!, FileType.STOPTIMES)])
          this.algorithmService.perform(inputGraph);
        })
      }
      data = result["selection"]
      if (data != undefined) {
        // TODO: Load the according input Graph
        switch (data) {
          case "Vienna":
            let b = 0
            break;
          default:
            alert("Error: Data could not be found")
        }
      }

    })
  }
}

@Component({
  selector: 'dialog-data-selection',
  templateUrl: 'dialog-data-selection.html',
  styleUrls: ['./dialog-data-selection.css']
})
export class DialogDataSelection {

  uploadedFiles: FileList | undefined = undefined;
  preparedDataSelection = undefined
  firstPage: boolean = true
  allowCrossing: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<DialogDataSelection>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
  }

  saveFiles(files: FileList | null) {
    if (files) {
      this.uploadedFiles = files
    }
  }

  sendUploadedFiles() {
    if (this.uploadedFiles) {
      let keys = Object.keys(this.uploadedFiles)
      let amount = 0
      keys.forEach((key: any) => {
        let file = this.uploadedFiles![key];
        switch (file.name) {
          case "stops.txt":
            amount += 1
            break;
          case "routes.txt":
            amount += 1
            break;
          case "stop_times.txt":
            amount += 1
            break;
          case "trips.txt":
            amount += 1
            break;
          default: //Ignore
        }
      })
      if (amount !== 4) {
        alert("One of the following files is missing: 'stop_times.txt', 'stops.txt', 'trips.txt', 'routes.txt'")
        return
      }
      this.switchPage()
    } else {
      alert("Please select a directory")
      return
    }
  }

  selectPreparedData() {
    if (this.preparedDataSelection == undefined) {
      alert("Please select a dataset")
      return
    }
    this.switchPage()
  }

  switchPage() {
    this.firstPage = !this.firstPage
  }

  sendData() {
    Filters.setCrossing(this.allowCrossing)
    if (this.uploadedFiles) {
      this.dialogRef.close({data: this.uploadedFiles})
    } else if (this.preparedDataSelection) {
      this.dialogRef.close({selection: this.preparedDataSelection})
    }
  }
}
