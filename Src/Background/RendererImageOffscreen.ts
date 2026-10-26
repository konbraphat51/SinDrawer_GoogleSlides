// Renders background PNGs with OffscreenCanvas, which works inside the service worker.
import type { Size } from "../Core/Geometry"
import { renderBackground } from "../Core/Renderer"
import type { Settings } from "../Core/Settings"
import type { RendererImage } from "../Slides/ApplierBackground"

/** PNG renderer for environments without a DOM. */
export class RendererImageOffscreen implements RendererImage {
  async renderPng(settings: Settings, seed: number, size: Size): Promise<Blob> {
    const canvas = new OffscreenCanvas(size.width, size.height)
    const context = canvas.getContext("2d")
    if (context === null) {
      throw new Error("OffscreenCanvas 2D context is unavailable.")
    }

    renderBackground(context, settings, seed, size)
    return canvas.convertToBlob({ type: "image/png" })
  }
}
