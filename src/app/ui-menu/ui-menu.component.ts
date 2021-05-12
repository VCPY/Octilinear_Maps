import {Component, Inject, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import GraphInputParser from "../graphs/graph.inputParser";
import {InputGraph} from "../inputGraph/inputGraph";
import {FileType, parseGTFSToObjectArray} from "../workers/gtfs.worker";

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

  constructor(public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.openDialog()
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogDataSelection, {
      width: "500px",
      data: ""
    });

    dialogRef.afterClosed().subscribe(result => {
      let self = this
      let data = result["data"]
      let promises: any = []
      if (data != undefined) {
        let keys = Object.keys(data)
        keys.forEach((key) => {
          let file = data[key]
          let fileName = file.name
          switch (fileName) {
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
          //TODO: work with the data
          //let inputParser = new GraphInputParser(this.trips, this.stops, this.routes, this.stopTimes);
          //let inputGraph: InputGraph = inputParser.parseToInputGraph();
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

  uploadedFiles: FileList | null = null;
  preparedDataSelection = undefined

  constructor(
    public dialogRef: MatDialogRef<DialogDataSelection>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
  }

  saveFiles(files: FileList | null) {
    this.uploadedFiles = files
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
      this.dialogRef.close({data: this.uploadedFiles})
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
    this.dialogRef.close({selection: this.preparedDataSelection})
  }
}
