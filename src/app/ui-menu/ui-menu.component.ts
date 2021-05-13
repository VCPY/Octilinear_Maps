import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FileType, parseDataToInputGraph, parseGTFSToObjectArray} from "../graphs/graph.inputParser";
import {AlgorithmService} from "../services/algorithm.service";
import {Filters} from "../inputGraph/inputGraph.filter";
import {InputGraph} from "../inputGraph/inputGraph";
import {SelectionModel} from "@angular/cdk/collections";

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
  inputGraph: InputGraph|undefined = undefined

  constructor(public dialog: MatDialog, private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {
    this.openDialog()
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogDataSelection, {
      width: "500px",
      data: "",
      autoFocus: false,
      maxHeight: '90vh' //you can adjust the value as per your view
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      let self = this
      let data = result["inputGraph"]
      if (data != undefined) {
        this.inputGraph = data
        Filters.exactString.push(...result["lines"])
        this.algorithmService.perform(this.inputGraph!);
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
  stops: string | undefined = undefined
  stopTimes: string | undefined = undefined
  trips: string | undefined = undefined
  routes: string | undefined = undefined
  inputGraph: InputGraph | undefined = undefined
  displayedColumns: string[] = ["name", "visible"]
  // @ts-ignore
  lines: FilterLine[] = []
  selection = new SelectionModel<FilterLine>(true, []);

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
    let self = this
    if (this.uploadedFiles) {
      let promises: any = []

      let keys = Object.keys(this.uploadedFiles)
      keys.forEach((key: string) => {
        // @ts-ignore
        let file = this.uploadedFiles![key]
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
      Promise.all(promises).then(result => {
        this.inputGraph = parseDataToInputGraph([parseGTFSToObjectArray(self.trips!, FileType.TRIPS),
          parseGTFSToObjectArray(self.stops!, FileType.STOPS),
          parseGTFSToObjectArray(self.routes!, FileType.ROUTES),
          parseGTFSToObjectArray(self.stopTimes!, FileType.STOPTIMES)])
        let lines: string[] = []
        this.inputGraph.edges.forEach(edge => lines.push(...edge.line))
        let linesSet = new Set(lines)
        this.lines = Array.from(linesSet).map(line => {
          let obj = {name: line, visible: true}
          this.selection.select(obj)
          return obj
        })

        this.firstPage = false
      })

    }
  }

  sendData() {
    Filters.setCrossing(this.allowCrossing)
    if (this.uploadedFiles) {
      let acceptedLines = this.selection.selected.map(selection => selection.name)
      this.dialogRef.close({
        inputGraph: this.inputGraph,
        lines: acceptedLines
      })
    } else if (this.preparedDataSelection) {
      this.dialogRef.close({selection: this.preparedDataSelection})
    }
  }
}

export interface FilterLine {
  name: string,
  visible: boolean,
}