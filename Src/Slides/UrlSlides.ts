// Extracts presentation and slide identifiers from a Google Slides editor URL.

/** Identifiers found in a Slides URL. */
export interface LocationSlides {
  presentationId: string
  /** Slide object ID from the #slide=id.XXX fragment; null when absent. */
  slideId: string | null
}

const PATTERN_PRESENTATION = /^https:\/\/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([\w-]+)/
const PATTERN_SLIDE = /[#&]slide=id\.([\w-]+)/

/**
 * Parses a Google Slides URL.
 *
 * @param url - URL of the tab.
 * @returns The identifiers, or null if the URL is not a Slides presentation.
 */
export function parseUrlSlides(url: string | undefined): LocationSlides | null {
  if (!url) {
    return null
  }

  const matchPresentation = PATTERN_PRESENTATION.exec(url)
  if (!matchPresentation?.[1]) {
    return null
  }

  const matchSlide = PATTERN_SLIDE.exec(url)
  return { presentationId: matchPresentation[1], slideId: matchSlide?.[1] ?? null }
}
