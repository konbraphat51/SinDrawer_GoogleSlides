// Turns a waveform into a drawable shape: sampling, amplitude scaling, and projection along a baseline.
import { clamp, type Point, type Shape, type Size } from "./Geometry"
import { PRESETS_PLACEMENT, type Placement } from "./Placement"
import { Waveform } from "./Waveform"

/** Inputs that fully determine a shape. */
export interface RequestShape {
  placement: Placement
  /** Axis position as a rate of the canvas width or height. */
  rateAxis: number
  /** Largest absolute offset of the curve from its baseline, in canvas pixels. */
  amplitudeMax: number
  /** Random seed, usually derived from the slide title. */
  seed: number
  /** Canvas size in the coordinate space the shape is built in. */
  size: Size
}

/**
 * Rescales plots so that the largest absolute value equals amplitudeMax.
 *
 * @param plots - Sampled values.
 * @param amplitudeMax - Target peak; non-positive values leave plots untouched.
 */
export function scalePlotsToAmplitude(plots: readonly number[], amplitudeMax: number): number[] {
  if (amplitudeMax <= 0) {
    return [...plots]
  }

  let absMax = 0
  for (const plot of plots) {
    absMax = Math.max(absMax, Math.abs(plot))
  }
  if (absMax === 0) {
    return [...plots]
  }

  const scale = amplitudeMax / absMax
  return plots.map((plot) => plot * scale)
}

/**
 * Walks a baseline one pixel per plot and offsets each step perpendicularly by the plot value.
 * Stops once the baseline leaves the canvas.
 *
 * @param plots - Perpendicular offsets.
 * @param start - Start of the baseline.
 * @param direction - Direction of the baseline; normalized internally.
 * @param size - Canvas bounds.
 */
export function projectPlotsAlongVector(
  plots: readonly number[],
  start: Point,
  direction: Point,
  size: Size,
): Point[] {
  // same formula as the original (not Math.hypot) to stay bit-exact
  const norm = (direction[0] ** 2 + direction[1] ** 2) ** 0.5
  const directionX = direction[0] / norm
  const directionY = direction[1] / norm
  const perpendicularX = -directionY
  const perpendicularY = directionX

  let xBase = start[0]
  let yBase = start[1]
  const points: Point[] = []
  for (const plot of plots) {
    if (xBase < 0 || size.width < xBase || yBase < 0 || size.height < yBase) {
      break
    }

    points.push([plot * perpendicularX + xBase, plot * perpendicularY + yBase])
    xBase += directionX
    yBase += directionY
  }
  return points
}

/**
 * Builds the shape for a placement, reproducing the original SinDrawer Draw().
 *
 * @param request - Shape inputs.
 */
export function buildShape(request: RequestShape): Shape {
  const preset = PRESETS_PLACEMENT[request.placement]
  const { width, height } = request.size

  // enough samples to cross the canvas diagonally
  const countPlot = Math.ceil((width ** 2 + height ** 2) ** 0.5) + 16
  const waveform = Waveform.createRandomly(request.seed, preset.parametersWaveform)
  const plots = scalePlotsToAmplitude(waveform.sample(countPlot), request.amplitudeMax)

  const layout = preset.layout(request.size, clamp(request.rateAxis, 0, 1))
  const points = projectPlotsAlongVector(plots, layout.start, layout.direction, request.size)
  if (layout.isFilled) {
    points.push(...layout.cornersClosing)
  }

  return { points, isFilled: layout.isFilled }
}
