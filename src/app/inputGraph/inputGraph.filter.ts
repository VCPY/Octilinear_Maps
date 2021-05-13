export class Filters {
  static startsWith: string[] = []
  static endsWith: string[] = []
  static exactString: string[] = []
  static ALLOWCROSSING: boolean = true

  static addFilter(str: string, type: FilterType) {
    switch (type) {
      case FilterType.start:
        this.startsWith.push(str)
        break;
      case FilterType.end:
        this.endsWith.push(str)
        break;
      case FilterType.exact:
        this.exactString.push(str)
        break;
    }
  }

  static setCrossing(bool: boolean){
    Filters.ALLOWCROSSING = bool
  }

}

enum FilterType {
  start,
  end,
  exact
}