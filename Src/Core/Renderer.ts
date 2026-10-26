// Draws a SinDrawer background onto any 2D canvas context (DOM canvas or OffscreenCanvas).
import { buildShape } from "./Curve"
import type { Shape, Size } from "./Geometry"
import type { Settings } from "./Settings"

/** Canvas context types the renderer can draw on. */
export type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

/** Width of the coordinate space the shape is built in; keeps the look independent of output resolution. */
export const WIDTH_LOGICAL = 1280

// the original passes 3 but HotSoupScript ignores it (sets ctx.line_width), so 1 is what is actually drawn
const WIDTH_LINE = 1

/**
 * Computes the pixel size of the output image.
 *
 * @param widthOutput - Image width in pixels.
 * @param ratioAspect - Slide width divided by slide height.
 */
export function computeSizeOutput(widthOutput: number, ratioAspect: number): Size {
  return { width: widthOutput, height: Math.max(1, Math.round(widthOutput / ratioAspect)) }
}

/**
 * Renders the background, filling the whole context area of sizeOutput.
 *
 * @param context - Target context; its canvas should be sizeOutput large.
 * @param settings - Drawing settings.
 * @param seed - Random seed, usually derived from the slide title.
 * @param sizeOutput - Pixel size of the output image.
 */
export function renderBackground(
  context: Context2D,
  settings: Settings,
  seed: number,
  sizeOutput: Size,
): void {
  const scale = sizeOutput.width / WIDTH_LOGICAL
  const sizeLogical: Size = { width: WIDTH_LOGICAL, height: sizeOutput.height / scale }

  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, sizeOutput.width, sizeOutput.height)
  if (!settings.isBackgroundTransparent) {
    context.fillStyle = settings.colorBackground
    context.fillRect(0, 0, sizeOutput.width, sizeOutput.height)
  }

  // draw in logical coordinates scaled up to the output resolution
  context.setTransform(scale, 0, 0, scale, 0, 0)
  const shape = buildShape({
    placement: settings.placement,
    rateAxis: settings.rateAxisByPlacement[settings.placement],
    amplitudeMax: settings.amplitudeMax,
    seed,
    size: sizeLogical,
  })
  drawShape(context, shape, settings.colorWave)
  context.restore()
}

function drawShape(context: Context2D, shape: Shape, color: string): void {
  const [first, ...rest] = shape.points
  if (first === undefined || (shape.isFilled && shape.points.length < 3)) {
    return
  }

  context.beginPath()
  context.moveTo(first[0], first[1])
  for (const point of rest) {
    context.lineTo(point[0], point[1])
  }

  if (shape.isFilled) {
    context.closePath()
    context.fillStyle = color
    context.fill()
  } else {
    context.lineWidth = WIDTH_LINE
    context.lineJoin = "round"
    context.strokeStyle = color
    context.stroke()
  }
}
