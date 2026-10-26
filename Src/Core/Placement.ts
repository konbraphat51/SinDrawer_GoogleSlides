// Placement presets: where the wave sits on the slide and which random ranges shape it.
import type { Point, Size } from "./Geometry"
import type { ParametersWaveform } from "./Waveform"

/** Identifiers of the available placements. */
export const PLACEMENTS = ["rightFill", "rightTopFill", "top", "topFill"] as const

/** One of the available placements. */
export type Placement = (typeof PLACEMENTS)[number]

/** Axis along which the user-adjustable axis position is measured. */
export type AxisPlacement = "x" | "y"

/** Geometry of a placement, resolved for a concrete canvas size. */
export interface LayoutPlacement {
  /** Where the wave baseline starts. */
  start: Point
  /** Direction the baseline travels in. */
  direction: Point
  /** Corners appended after the curve to close the filled polygon. */
  cornersClosing: Point[]
  /** Fill the closed polygon rather than stroke the curve. */
  isFilled: boolean
}

/** Static definition of a placement. */
export interface PresetPlacement {
  /** Random ranges of the waveform. */
  parametersWaveform: ParametersWaveform
  /** Axis on which the axis position rate applies. */
  axis: AxisPlacement
  /** Default axis position as a rate of the canvas width or height. */
  rateAxisDefault: number
  /**
   * Resolves the geometry for a canvas.
   *
   * @param size - Canvas size.
   * @param rateAxis - Axis position as a rate of the canvas width or height.
   */
  layout(size: Size, rateAxis: number): LayoutPlacement
}

// canvas size the original defaults were designed for
const WIDTH_ORIGINAL = 1280
const HEIGHT_ORIGINAL = 780

/** All presets, with constants taken verbatim from the original SinDrawer Draw(). */
export const PRESETS_PLACEMENT: Readonly<Record<Placement, PresetPlacement>> = {
  rightFill: {
    parametersWaveform: {
      count: 3,
      amplitudeWidth: 4,
      amplitudeMin: 10,
      velocityAngularWidth: 0.5,
      velocityAngularMin: 0.3,
      phaseShiftMax: 2 * Math.PI,
    },
    axis: "x",
    rateAxisDefault: 1200 / WIDTH_ORIGINAL,
    layout: ({ width, height }, rateAxis) => ({
      start: [width * rateAxis, 0],
      direction: [0, 1],
      cornersClosing: [
        [width, height],
        [width, 0],
      ],
      isFilled: true,
    }),
  },
  rightTopFill: {
    parametersWaveform: {
      count: 3,
      amplitudeWidth: 10,
      amplitudeMin: 10,
      velocityAngularWidth: 0.1,
      velocityAngularMin: 0.6,
      phaseShiftMax: 0,
    },
    axis: "x",
    rateAxisDefault: 1000 / WIDTH_ORIGINAL,
    layout: ({ width }, rateAxis) => ({
      start: [width * rateAxis, 0],
      direction: [2 ** -0.5, 2 ** -0.5],
      cornersClosing: [[width, 0]],
      isFilled: true,
    }),
  },
  top: {
    parametersWaveform: {
      count: 4,
      amplitudeWidth: 6,
      amplitudeMin: 2,
      velocityAngularWidth: 0.5,
      velocityAngularMin: 0.6,
      phaseShiftMax: 6,
    },
    axis: "y",
    rateAxisDefault: 0.1,
    layout: ({ height }, rateAxis) => ({
      start: [0, height * rateAxis],
      direction: [1, 0],
      cornersClosing: [],
      isFilled: false,
    }),
  },
  topFill: {
    parametersWaveform: {
      count: 2,
      amplitudeWidth: 10,
      amplitudeMin: 5,
      velocityAngularWidth: 0.3,
      velocityAngularMin: 0.1,
      phaseShiftMax: 0,
    },
    axis: "y",
    rateAxisDefault: 150 / HEIGHT_ORIGINAL,
    layout: ({ width, height }, rateAxis) => ({
      start: [0, height * rateAxis],
      direction: [1, 0],
      cornersClosing: [
        [width, 0],
        [0, 0],
      ],
      isFilled: true,
    }),
  },
}

/**
 * Checks whether a value is a known placement.
 *
 * @param value - Value to check.
 */
export function isPlacement(value: unknown): value is Placement {
  return typeof value === "string" && (PLACEMENTS as readonly string[]).includes(value)
}
