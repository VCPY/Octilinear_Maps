import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {FileType, parseDataToInputGraph, parseGTFSToObjectArray} from "../graphs/graph.inputParser";
import {AlgorithmService} from "../services/algorithm.service";
import {Filters} from "../inputGraph/inputGraph.filter";
import {InputGraph} from "../inputGraph/inputGraph";
import {SelectionModel} from "@angular/cdk/collections";
import vienna from "../saves/vienna.json"
import rome from "../saves/rome.json"
import prague from "../saves/prague.json"
import detroit from "../saves/detroit.json"
import {plainToClass} from "class-transformer";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.css']
})
/**
 * Component for the initial menu for selecting the graph data to be drawn
 */
export class UiMenuComponent implements OnInit {

  fileNames = ["stop_times", "stops", "trips", "routes"]
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
      maxHeight: '90vh'
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
        let graph;
        switch (data) {
          case "Vienna":
            graph = plainToClass(InputGraph, vienna)
            break;
          case "Rome":
            graph = plainToClass(InputGraph, rome)
            break;
          case "Prague":
            graph = plainToClass(InputGraph, prague)
            break;
          case "Detroit":
            graph = plainToClass(InputGraph, detroit)
            break;
          default:
            alert("Error: Data could not be found")
            return
        }
        Filters.exactString.push(...result["lines"])
        this.algorithmService.perform(graph!)
      }

    })
  }
}

class FilterData {
  private _type: string;
  private _value: string = "";

  constructor(type: string) {
    this._type = type;
  }

  match(line: FilterLine) {
    if (this._value == "") return false;

    switch (this._type) {
      case "Starts with":
        return line.name.startsWith(this._value);
      case "Ends with":
        return line.name.endsWith(this._value);
      case "Is":
        return line.name == this._value;

      default: return false;
    };
  }

  get type(): string {
    return this._type;
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}

@Component({
  selector: 'dialog-data-selection',
  templateUrl: 'dialog-data-selection.html',
  styleUrls: ['./dialog-data-selection.css']
})
/**
 * Dialog for the menu pop-up
 */
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
  sliderRValue: number = 0.5;
  filters: FilterData[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogDataSelection>,
    @Inject(MAT_DIALOG_DATA) public data: string) {
  }

  /**
   * Method to store the content of the parameter files in a component variable
   * @param files
   */
  saveFiles(files: FileList | null) {
    if (files) {
      this.uploadedFiles = files
    }
  }

  /**
   * Method called when individual files have been uploaded and the "Select" button has been clicked.
   */
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

  /**
   * Method called when the "Select" button for prepared data has been clicked.
   */
  selectPreparedData() {
    if (this.preparedDataSelection == undefined) {
      alert("Please select a dataset")
      return
    }
    this.switchPage()
  }

  /**
   * Switches the view from selecting the data to filtering the data.
   */
  switchPage() {
    if (this.uploadedFiles) {
      let promises: any = []
      let keys = Object.keys(this.uploadedFiles)
      let stops: any;
      let trips: any;
      let routes: any;
      let stopTimes: any;
      keys.forEach((key: string) => {
        // @ts-ignore
        let file = this.uploadedFiles![key]
        switch (file.name) {
          case "trips.txt":
            promises.push(parseGTFSToObjectArray(file, FileType.TRIPS).then(result => trips = result));
            break;
          case "stops.txt":
            promises.push(parseGTFSToObjectArray(file!, FileType.STOPS).then(result => stops = result))
            break;
          case "routes.txt":
            promises.push(parseGTFSToObjectArray(file!, FileType.ROUTES).then(result => routes = result))
            break;
          case "stop_times.txt":
            promises.push(parseGTFSToObjectArray(file!, FileType.STOPTIMES).then(result => stopTimes = result))
            break;
          default: //Ignore
        }
      })
      Promise.all(promises).then(_ => {
        this.inputGraph = parseDataToInputGraph([trips, stops, routes, stopTimes])
        this.prepareTable()
        this.showLoadingData = false;
        this.firstPage = false
      })
    } else {
      if (this.preparedDataSelection != undefined) {
        switch (this.preparedDataSelection!) {
          case "Vienna":
            this.inputGraph = plainToClass(InputGraph, vienna)
            break;
          case "Rome":
            this.inputGraph = plainToClass(InputGraph, rome)
            break;
          case "Prague":
            this.inputGraph = plainToClass(InputGraph, prague)
            break;
          case "Detroit":
            this.inputGraph = plainToClass(InputGraph, detroit)
            break;
          default:
            alert("Error: Data could not be found")
        }
        this.prepareTable()
        this.firstPage = false
      }
    }
  }

  /**
   * Prepares the table of lines for the second page.
   * @private
   */
  private prepareTable() {
    let lines: string[] = []
    this.inputGraph!.edges.forEach(edge => lines.push(...edge.line))
    this.lines = Array.from(new Set(lines)).map(line => {
      let obj = {name: line, visible: true}
      this.selection.select(obj)
      return obj
    })
  }

  /**
   * Sends the data and filters to the algorithm
   */
  sendData() {
    Filters.ALLOWCROSSING = this.allowCrossing
    Filters.r = 1 - this.sliderRValue
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

  /**
   * Increases the number of string filters and initializes its values.
   */
  addFilter(ref: MatSelect, value: string) {
    ref.value = "";

    this.filters.push(new FilterData(value));
  }

  /**
   * Removes the element with the given id from the list of string filters.
   * @param id The id of the element to remove.
   */
  removeElementFromFilterList(filter: FilterData) {
    this.filters = this.filters.filter(f => f != filter);

    this.updateSelection()
  }

  filterChanged(event: Event, filterData: FilterData) {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    filterData.value = value;

    this.updateSelection();
  }

  /**
   * Callback for the selection of the string filters.
   * @param value The new value of the selection.
   * @param elementID The ID of the element which has changed.
   */
  changeSelected(value: string, elementID: number) {
    for (let i = 0; i < this.filterIDs.length; i++) {
      let id = this.filterIDs[i]
      if (id == elementID) {
        this.filterSelection[i] = value
        break;
      }
    }
    this.updateSelection()
  }

  /**
   * Callback for changes in the input fields of the string filters.
   * @param event The event of the change.
   * @param id The id of the element which has detected a change.
   */
  updateListOfStrings(event: Event, id: number) {
    for (let i = 0; i < this.filterIDs.length; i++) {
      if (this.filterIDs[i] == id) {
        this.filterInput[i] = (<HTMLInputElement>(event.target)!).value
        this.updateSelection()
        break;
      }
    }
  }

  /**
   * Update function which updates the selection of lines based on the string filters.
   */
  updateSelection() {
    this.lines.forEach(line => {
      let keep = false;
      this.filters.forEach(filter => {
        if (filter.match(line)) keep = true;
      });

      if (!keep) this.selection.deselect(line)
      else this.selection.select(line)
    })
  }

  /**
   * Takes a string as input and returns an array of the contained individual strings. Splits by comma, whitespace is removed.
   * @param input The string which should be split.
   * @private
   */
  private static getIndividualStrings(input: string) {
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