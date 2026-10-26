// Derives the popup-facing slide context from a fetched presentation.
import type { ContextSlide } from "../Shared/Messages"
import { ErrorApplication } from "../Shared/ErrorApplication"
import { extractTitleSlide } from "./TitleSlide"
import type { PageSlides, PresentationSlides } from "./TypesSlides"

const RATIO_ASPECT_FALLBACK = 16 / 9

/**
 * Finds the slide open in the editor, falling back to the first slide.
 *
 * @param presentation - Fetched presentation.
 * @param slideIdHint - Slide ID from the URL fragment, if any.
 */
export function findSlideCurrent(
  presentation: PresentationSlides,
  slideIdHint: string | null,
): PageSlides {
  const slides = presentation.slides ?? []
  const slide = slides.find((candidate) => candidate.objectId === slideIdHint) ?? slides[0]
  if (slide === undefined) {
    throw new ErrorApplication("api", "The presentation has no slides.")
  }
  return slide
}

/**
 * Computes page width / height, falling back to 16:9 for missing data.
 *
 * @param presentation - Fetched presentation.
 */
export function computeRatioAspect(presentation: PresentationSlides): number {
  const width = presentation.pageSize?.width?.magnitude
  const height = presentation.pageSize?.height?.magnitude
  if (!width || !height) {
    return RATIO_ASPECT_FALLBACK
  }
  return width / height
}

/**
 * Builds the context shown in the popup.
 *
 * @param presentation - Fetched presentation.
 * @param slideIdHint - Slide ID from the URL fragment, if any.
 */
export function buildContextSlide(
  presentation: PresentationSlides,
  slideIdHint: string | null,
): ContextSlide {
  const slide = findSlideCurrent(presentation, slideIdHint)
  return {
    presentationId: presentation.presentationId,
    slideIdCurrent: slide.objectId,
    titleCurrent: extractTitleSlide(slide),
    ratioAspect: computeRatioAspect(presentation),
    countSlide: presentation.slides?.length ?? 0,
  }
}
