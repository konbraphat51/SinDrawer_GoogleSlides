// Basic 2D geometry types shared by the curve builder and the renderer.

/** 2D point or vector as [x, y]. */
export type Point = readonly [number, number]

/** Width and height in pixels. */
export interface Size {
  width: number
  height: number
}

/** Path to draw: an open polyline to stroke, or a closed polygon to fill. */
export interface Shape {
  points: Point[]
  isFilled: boolean
}

/**
 * Clamps a value into [min, max].
 *
 * @param value - Value to clamp.
 * @param min - Lower bound.
 * @param max - Upper bound.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
