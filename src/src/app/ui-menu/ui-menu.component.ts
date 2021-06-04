import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
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
import {GtfsService} from "../services/gtfs.service";
import {extractInputgraph} from "../workers/algorithm.worker";

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
    switch (this._type) {
      case "Starts with":
        if (this._value == "") return false;
        return this.getIndividualStrings().some(value => line.name.startsWith(value));
      case "Ends with":
        if (this._value == "") return false;
        return this.getIndividualStrings().some(value => line.name.endsWith(value));
      case "Is":
        if (this._value == "") return false;
        return this.getIndividualStrings().some(value => line.name == value);
      case "All":
        return true;
      case "Route Type":
        return this.getIndividualStrings().some(value => line.routeType == value);

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

  /**
   * Takes a string as input and returns an array of the contained individual strings. Splits by comma, whitespace is removed.
   * @param input The string which should be split.
   * @private
   */
  private getIndividualStrings() {
    const input =this._value.replace(/\s/g, "")
    let inputArr = input.split(",")
    inputArr = inputArr.filter(str => str.length > 0);
    return inputArr
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
  showLoadingData = false;
  sliderRValue: number = 0.5;
  whitelist: FilterData[] = [];
  blacklist: FilterData[] = [];

  constructor(
    public dialogRef: MatDialogRef<DialogDataSelection>,
    @Inject(MAT_DIALOG_DATA) public data: string, private gtfsService: GtfsService) {
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
            trips = file
            break;
          case "stops.txt":
            stops = file
            break;
          case "routes.txt":
            routes = file
            break;
          case "stop_times.txt":
            stopTimes = file
            break;
          default: //Ignore
        }
      })
      let that = this
      this.gtfsService.OnReceivedResult.subscribe(graph=>{
        that.inputGraph = extractInputgraph(graph)
        that.prepareTable()
        that.showLoadingData = false;
        that.firstPage = false
      })
     this.gtfsService.loadData(routes, trips, stops, stopTimes)
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
    const lines = new Map<string, FilterLine>();

    this.inputGraph!.edges.forEach(edge => {
      if (!lines.has(edge.line[0]))
        lines.set(edge.line[0], {name: edge.line[0], visible: false, routeType: edge.routeType})
    });

    this.lines = Array.from(lines.values());
  }

  /**
   * Sends the data and filters to the algorithm
   */
  sendData() {
    Filters.ALLOWCROSSING = this.allowCrossing
    Filters.r = 1 - this.sliderRValue

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
  addFilter(ref: MatSelect, value: string, whitelist: boolean) {
    ref.value = "";

    if (whitelist)
      this.whitelist.push(new FilterData(value));
    else
      this.blacklist.push(new FilterData(value));

    this.updateSelection();
  }

  /**
   * Removes the element with the given id from the list of string filters.
   * @param id The id of the element to remove.
   */
  removeElementFromFilterList(filter: FilterData, whitelist: boolean) {
    if (whitelist)
      this.whitelist = this.whitelist.filter(f => f != filter);
    else
    this.blacklist = this.blacklist.filter(f => f != filter);

    this.updateSelection()
  }

  filterChanged(event: Event, filterData: FilterData) {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    filterData.value = value;

    this.updateSelection();
  }

  filterSelectChanged(matSelect: MatSelect, filterData: FilterData) {
    filterData.value = (<string[]>matSelect.value).join(",");

    this.updateSelection();
  }

  /**
   * Update function which updates the selection of lines based on the string filters.
   */
  updateSelection() {
    this.lines.forEach(line => {
      let keep = false;
      this.whitelist.forEach(filter => {
        if (filter.match(line)) keep = true;
      });

      this.blacklist.forEach(filter => {
        if (filter.match(line)) keep = false;
      });

      if (!keep) this.selection.deselect(line)
      else this.selection.select(line)
    })
  }
}

export interface FilterLine {
  name: string,
  visible: boolean,
  routeType: string,
}
