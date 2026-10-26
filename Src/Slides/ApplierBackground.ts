// Orchestrates rendering, staging, and applying SinDrawer backgrounds to slides.
import type { Size } from "../Core/Geometry"
import { computeSizeOutput } from "../Core/Renderer"
import { convertTextToSeed } from "../Core/Seed"
import type { Settings } from "../Core/Settings"
import type { RequestApply, ResultApply } from "../Shared/Messages"
import type { ClientDrive, ImageStaged } from "./ClientDrive"
import type { AssignmentBackground, ClientSlides } from "./ClientSlides"
import { computeRatioAspect, findSlideCurrent } from "./ContextSlide"
import { extractTitleSlide } from "./TitleSlide"
import type { LocationSlides } from "./UrlSlides"

/** Produces PNG images of the background. */
export interface RendererImage {
  /**
   * Renders the background as a PNG.
   *
   * @param settings - Drawing settings.
   * @param seed - Random seed.
   * @param size - Output pixel size.
   */
  renderPng(settings: Settings, seed: number, size: Size): Promise<Blob>
}

// parallel uploads; keeps "all slides" fast without hammering the Drive API
const COUNT_UPLOAD_CONCURRENT = 4

/** Applies backgrounds to the current slide or the whole presentation. */
export class ApplierBackground {
  /**
   * @param clientSlides - Slides API client.
   * @param clientDrive - Drive API client used for temporary image hosting.
   * @param renderer - PNG renderer.
   */
  constructor(
    private readonly clientSlides: Pick<ClientSlides, "getPresentation" | "setBackgrounds">,
    private readonly clientDrive: Pick<ClientDrive, "stageImage" | "deleteFile">,
    private readonly renderer: RendererImage,
  ) {}

  /**
   * Renders one image per distinct seed, sets them as backgrounds, then removes the temporary files.
   *
   * @param location - Presentation and current slide from the tab URL.
   * @param request - Settings, scope, and optional seed text override.
   */
  async apply(location: LocationSlides, request: RequestApply): Promise<ResultApply> {
    const presentation = await this.clientSlides.getPresentation(location.presentationId)
    const slidesTarget =
      request.scope === "all"
        ? (presentation.slides ?? [])
        : [findSlideCurrent(presentation, location.slideId)]
    const size = computeSizeOutput(request.settings.widthOutput, computeRatioAspect(presentation))

    // slides sharing a title share one image
    const seedBySlideId = new Map<string, number>()
    for (const slide of slidesTarget) {
      const textSeed = request.textSeedOverride ?? extractTitleSlide(slide)
      seedBySlideId.set(slide.objectId, convertTextToSeed(textSeed))
    }
    const seedsUnique = [...new Set(seedBySlideId.values())]

    const imagesStaged: ImageStaged[] = []
    try {
      const urlBySeed = new Map<number, string>()
      await runConcurrently(seedsUnique, COUNT_UPLOAD_CONCURRENT, async (seed) => {
        const png = await this.renderer.renderPng(request.settings, seed, size)
        const image = await this.clientDrive.stageImage(png, `SinDrawer-${seed}.png`)
        imagesStaged.push(image)
        urlBySeed.set(seed, image.url)
      })

      const assignments: AssignmentBackground[] = []
      for (const [slideId, seed] of seedBySlideId) {
        assignments.push({ slideId, urlImage: urlBySeed.get(seed) ?? "" })
      }
      await this.clientSlides.setBackgrounds(location.presentationId, assignments)
    } finally {
      // Slides keeps its own copy, so the staged files are no longer needed
      await Promise.all(imagesStaged.map((image) => this.clientDrive.deleteFile(image.fileId)))
    }

    return { countApplied: seedBySlideId.size }
  }
}

async function runConcurrently<T>(
  items: readonly T[],
  countConcurrent: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let indexNext = 0
  const runWorker = async (): Promise<void> => {
    while (indexNext < items.length) {
      const item = items[indexNext++] as T
      await task(item)
    }
  }
  const countWorker = Math.min(countConcurrent, items.length)

  // wait for every worker so no upload is still in flight when the caller cleans up
  const results = await Promise.allSettled(Array.from({ length: countWorker }, runWorker))
  const failure = results.find((result) => result.status === "rejected")
  if (failure !== undefined) {
    throw failure.reason
  }
}
