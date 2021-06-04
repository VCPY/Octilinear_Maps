/**
 * Usefull constants for our OctiGraph implementation.
 *
 * Providing a place to configure edge costs and allowing us to use names instead of the indices when accessing nodes.
 */
export class Constants {
  static readonly COST_SINK = 2;
  static readonly COST_45 = 2;
  static readonly COST_90 = 1.5;
  static readonly COST_135 = 1;
  static readonly COST_180 = 0;

  static readonly TOP = 0;
  static readonly TOP_RIGHT = 1;
  static readonly RIGHT = 2;
  static readonly BOTTOM_RIGHT = 3;
  static readonly BOTTOM = 4;
  static readonly BOTTOM_LEFT = 5;
  static readonly LEFT = 6;
  static readonly TOP_LEFT = 7;
  static readonly SINK = 8;

  static readonly COST_MOVE = 0.5;
  static readonly COST_HOP = 6;
  static readonly COST_HOP_DIAGONAL = 9;
  static readonly COST_CROSSING = 20;

  /**
   * Ensure that index is in the range of [0,8)
   */
  static fixIndex(index: number) {
    if (index < 0) index += 8;
    return index % 8;
  }
}