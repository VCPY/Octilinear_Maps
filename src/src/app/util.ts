export function calculateAngleBetweenVectors(p1: number[], p2: number[]) {
  let tan = Math.atan2(p2[1], p2[0]) - Math.atan2(p1[1], p1[0]);
  let angle = -1 * tan * (180 / Math.PI);
  if (angle < 0) angle = 360 + angle;

  return angle;
}

export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}
