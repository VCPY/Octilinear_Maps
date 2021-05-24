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
    Filters.setCrossing(this.allowCrossing)
    this.updateSelection()
    if (this.uploadedFiles) {
      let acceptedLines = this.selection.selected.map(selection => selection.name)
      this.dialogRef.close({
        inputGraph: this.inputGraph,
        lines: acceptedLines
      })
    } else if (this.preparedDataSelection) {
      let startWith = [];
      let endWith = [];
      let notStartWith = [];
      let notEndWith = []
      for (let i = 0; i < this.filterIDs.length; i++) {
        let element = this.filterIDs[i]
        let input = (<HTMLInputElement>document.getElementById("input" + element))!.value;
        let inputArray = DialogDataSelection.getIndividualLines(input)
        let selection = this.filterSelection[i]
        switch (selection) {
          case "must not start":
            notStartWith.push(...inputArray);
            break;
          case "must not end":
            notEndWith.push(...inputArray);
            break;
          case "must start":
            startWith.push(...inputArray);
            break;
          case "must end":
            endWith.push(...inputArray);
            break;
        }
      }
      let acceptedLines = this.selection.selected.map(selection => selection.name)
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
        break;
      }
    }
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
    this.filterInput[el] = (<HTMLInputElement>(event.target)!).value
    this.updateSelection()
  }

  updateSelection() {
    this.lines.forEach(line => {
      let keep = true;
      for (let i = 0; i < this.filterInput.length; i++) {
        let input = DialogDataSelection.getIndividualLines(this.filterInput[i]);
        if (input[0] == "") continue
        let select = this.filterSelection[i];
        switch (select) {
          case "must not start":
            if (input.some(v => line.name.startsWith(v))) keep = false;
            break;
          case "must not end":
            if (input.some(v => line.name.endsWith(v))) keep = false;
            break;
          case "must start":
            if (!input.some(v => line.name.startsWith(v))) keep = false;
            break;
          case "must end":
            if (!input.some(v => line.name.endsWith(v))) keep = false;
            break;
        }
      }
      if (!keep) this.selection.deselect(line)
      else this.selection.select(line)
    })
  }

  private static getIndividualLines(input: string) {
    input = input.replace(" ", "")
    return input.split(",")
  }
}

export interface FilterLine {
  name: string,
  visible: boolean,
}