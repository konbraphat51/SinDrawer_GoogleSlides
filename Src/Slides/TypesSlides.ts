// Minimal subset of the Google Slides API resource types used by this extension.

/** Text run or paragraph marker inside a shape. */
export interface ElementText {
  textRun?: { content?: string }
}

/** Shape page element, possibly a placeholder. */
export interface ShapeSlides {
  placeholder?: { type?: string }
  text?: { textElements?: ElementText[] }
}

/** Element placed on a page. */
export interface ElementPage {
  objectId: string
  shape?: ShapeSlides
}

/** Single slide. */
export interface PageSlides {
  objectId: string
  pageElements?: ElementPage[]
}

/** Dimension in EMU or points. */
export interface Dimension {
  magnitude?: number
  unit?: string
}

/** Presentation resource with the fields this extension requests. */
export interface PresentationSlides {
  presentationId: string
  pageSize: { width: Dimension; height: Dimension }
  slides?: PageSlides[]
}
