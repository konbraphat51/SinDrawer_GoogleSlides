// Reads the title text of a slide, which serves as the random seed like in the original SinDrawer.
import type { PageSlides } from "./TypesSlides"

const TYPES_PLACEHOLDER_TITLE = new Set(["TITLE", "CENTERED_TITLE"])

/**
 * Returns the text of the first title placeholder on the slide.
 *
 * @param slide - Slide with page elements.
 * @returns Title text with surrounding whitespace removed, or an empty string.
 */
export function extractTitleSlide(slide: PageSlides): string {
  for (const element of slide.pageElements ?? []) {
    const typePlaceholder = element.shape?.placeholder?.type
    if (typePlaceholder === undefined || !TYPES_PLACEHOLDER_TITLE.has(typePlaceholder)) {
      continue
    }

    let text = ""
    for (const elementText of element.shape?.text?.textElements ?? []) {
      text += elementText.textRun?.content ?? ""
    }
    return text.trim()
  }
  return ""
}
