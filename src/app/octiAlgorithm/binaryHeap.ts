export class BinaryHeap<T> {
  content: T[];
  comparator: (a: T, b: T) => number;
  indexMapping: Map<T, number> = new Map<T, number>();

  constructor(comparator: (a: T, b: T) => number) {
    this.content = [];
    this.comparator = comparator;
  }

  push(element: T) {
    this.content.push(element);
    this.indexMapping.set(element, this.content.length - 1);
    this.siftUp(this.content.length - 1);
  }

  setPosition(element: T, position: number) {
    this.content[position] = element;
    this.indexMapping.set(element, position);
  }

  pop(): T {
    if (this.content.length <= 1) {
      const ret = this.content.pop();
      this.indexMapping.clear();
      return ret!;
    }

    const retval = this.content[0];
    this.setPosition(this.content.pop()!, 0);
    this.siftDown(0);

    return retval;
  }

  update(element: T) {
    let n = this.indexMapping.get(element);
    this.siftUp(n!);
  }

  size() {
    return this.content.length;
  }

  parentIdx(x: number): number {
    return (x - 1) >> 1;
  }

  leftIdx(x: number): number {
    return (x << 1) + 1;
  }

  rightIdx(x: number): number {
    return (x << 1) + 2;
  }

  private siftUp(n: number) {
    let idx = n;
    while (idx > 0) {
      const pidx = this.parentIdx(idx);

      if (this.comparator(this.content[idx], this.content[pidx]) <= 0) {
        break;
      }

      this.swap(idx, pidx);
      idx = pidx;
    }
  }

  private siftDown(idx = 0) {
    while (true) {
      const lidx = this.leftIdx(idx);
      if (lidx >= this.content.length) {
        break;
      }

      const ridx = this.rightIdx(idx);
      const childIdx = ridx < this.content.length
        ? this.comparator(this.content[lidx], this.content[ridx]) > 0 ? lidx : ridx
        : lidx;

      if (this.comparator(this.content[idx], this.content[childIdx]) >= 0) {
        break;
      }

      this.swap(childIdx, idx);
      idx = childIdx;
    }
  }


  private swap(idx1: number, idx2: number) {
    const tmp = this.content[idx1];
    this.setPosition(this.content[idx2], idx1);
    this.setPosition(tmp, idx2);
  }
}