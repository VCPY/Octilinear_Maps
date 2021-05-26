import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FileType, parseDataToInputGraph, parseGTFSToObjectArray} from "../graphs/graph.inputParser";
import {AlgorithmService} from "../services/algorithm.service";
import {Filters} from "../inputGraph/inputGraph.filter";
import {InputGraph} from "../inputGraph/inputGraph";
import {SelectionModel} from "@angular/cdk/collections";
import vienna from "../saves/vienna.json"
import {plainToClass} from "class-transformer";

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
  inputGraph: InputGraph | undefined = undefined

  constructor(public dialog: MatDialog, private algorithmService: AlgorithmService) {
  }

  ngOnInit(): void {
    this.openDialog()
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogDataSelection, {
      disableClose: true,
      width: "1000px",
      data: "",
      autoFocus: false,
      maxHeight: '90vh' //you can adjust the value as per your view
    });

    dialogRef.afterClosed().subscribe((result: any) => {
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
            let graph = plainToClass(InputGraph, vienna)
            Filters.exactString.push(...result["lines"])
            this.algorithmService.perform(graph!)
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
  inputGraph: InputGraph | undefined = undefined
  displayedColumns: string[] = ["name", "visible"]
  lines: FilterLine[] = []
  selection = new SelectionModel<FilterLine>(true, []);
  filterIDs = [0]
  filterSelection: string[] = ["must not start"]
  filterInput: string[] = []
  showLoadingData = false;

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
      this.showLoadingData = true;
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
    if (this.uploadedFiles) {
      let promises: any = []
      let keys = Object.keys(this.uploadedFiles)
      let stops = ""
      let trips = ""
      let routes = ""
      let stopTimes = ""
      keys.forEach((key: string) => {
        // @ts-ignore
        let file = this.uploadedFiles![key]
        switch (file.name) {
          case "trips.txt":
            promises.push(file.text().then((text: string) => trips = text))
            break;
          case "stops.txt":
            promises.push(file.text().then((text: string) => stops = text))
            break;
          case "routes.txt":
            promises.push(file.text().then((text: string) => routes = text))
            break;
          case "stop_times.txt":
            promises.push(file.text().then((text: string) => stopTimes = text))
            break;
          default: //Ignore
        }
      })
      Promise.all(promises).then(_ => {
        this.inputGraph = parseDataToInputGraph([parseGTFSToObjectArray(trips!, FileType.TRIPS),
          parseGTFSToObjectArray(stops!, FileType.STOPS),
          parseGTFSToObjectArray(routes!, FileType.ROUTES),
          parseGTFSToObjectArray(stopTimes!, FileType.STOPTIMES)])
        this.prepareTable()
        this.showLoadingData = false;
        this.firstPage = false
      })
    } else {
      this.inputGraph = plainToClass(InputGraph, vienna)
      this.prepareTable()
      this.firstPage = false
    }
  }

  private prepareTable() {
    let lines: string[] = []
    this.inputGraph!.edges.forEach(edge => lines.push(...edge.line))
    this.lines = Array.from(new Set(lines)).map(line => {
      let obj = {name: line, visible: true}
      this.selection.select(obj)
      return obj
    })
  }

  sendData() {
    Filters.ALLOWCROSSING = this.allowCrossing
    this.updateSelection()
    let acceptedLines = this.selection.selected.map(selection => selection.name)
    if (this.uploadedFiles) {
      this.dialogRef.close({
        inputGraph: this.inputGraph,
        lines: acceptedLines
      })
    } else if (this.preparedDataSelection) {
      this.dialogRef.close({
        selection: this.preparedDataSelection,
        lines: acceptedLines
      })
    }
  }

  increaseChoice() {
    let id: number;
    if (this.filterIDs.length == 0) id = 0
    else id = this.filterIDs[this.filterIDs.length - 1] + 1

    this.filterIDs.push(id)
    this.filterSelection.push("must not start")
    this.filterInput.push("")
  }

  removeElementFromFilterList(id: number) {
    for (let i = 0; i < this.filterIDs.length; i++) {
      if (this.filterIDs[i] == id) {
        this.filterIDs.splice(i, 1)
        this.filterInput.splice(i, 1)
        this.filterSelection.splice(i, 1)
        break;
      }
    }
    this.updateSelection()
  }

  changeSelected(value: string, n: number) {
    for (let i = 0; i < this.filterIDs.length; i++) {
      let id = this.filterIDs[i]
      if (id == n) {
        this.filterSelection[i] = value
        break;
      }
    }
    this.updateSelection()
  }

  updateListByStrings(event: Event, el: number) {
    for (let i = 0; i < this.filterIDs.length; i++) {
      if (this.filterIDs[i] == el) {
        this.filterInput[i] = (<HTMLInputElement>(event.target)!).value
        this.updateSelection()
        break;
      }
    }
  }

  updateSelection() {
    this.lines.forEach(line => {
      let keep = true;
      for (let i = 0; i < this.filterInput.length; i++) {
        let input = DialogDataSelection.getIndividualLines(this.filterInput[i]);
        if (input.length == 0) continue
        let select = this.filterSelection[i];
        switch (select) {
          case "must not start":
            for (let j = 0; j < input.length; j++) {
              let val = input[j]
              if (line.name.startsWith(val)) keep = false;
            }
            break;
          case "must not end":
            for (let j = 0; j < input.length; j++) {
              let val = input[j]
              if (line.name.endsWith(val)) keep = false;
            }
            break;
          case "must start":
            keep = false
            for (let j = 0; j < input.length; j++) {
              let val = input[j]
              if (line.name.startsWith(val)) {
                keep = true
                break;
              }
            }
            break;
          case "must end":
            keep = false
            for (let j = 0; j < input.length; j++) {
              let val = input[j]
              if (line.name.endsWith(val)) {
                keep = true
                break;
              }
            }
            break;
        }
        if (!keep) break
      }
      if (!keep) this.selection.deselect(line)
      else this.selection.select(line)
    })
  }

  private static getIndividualLines(input: string) {
    input = input.replace(/\s/g, "")
    let inputArr = input.split(",")
    inputArr = inputArr.filter(str => str.length > 0);
    return inputArr
  }
}

export interface FilterLine {
  name: string,
  visible: boolean,
}