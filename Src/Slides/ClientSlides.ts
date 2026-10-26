// Google Slides API operations used by the extension.
import type { ClientGoogleApi } from "./ClientGoogleApi"
import type { PresentationSlides } from "./TypesSlides"

const URL_BASE = "https://slides.googleapis.com/v1/presentations"

// only what is needed for the page size and slide titles
const FIELDS_PRESENTATION =
  "presentationId,pageSize,slides(objectId,pageElements(objectId,shape(placeholder(type),text(textElements(textRun(content))))))"

/** Background image to set on one slide. */
export interface AssignmentBackground {
  slideId: string
  /** Publicly fetchable image URL; Slides copies the image at request time. */
  urlImage: string
}

/** Reads presentations and updates slide backgrounds. */
export class ClientSlides {
  /**
   * @param clientApi - Authenticated HTTP client.
   */
  constructor(private readonly clientApi: ClientGoogleApi) {}

  /**
   * Fetches the page size and slide titles of a presentation.
   *
   * @param presentationId - Presentation ID.
   */
  getPresentation(presentationId: string): Promise<PresentationSlides> {
    const url = `${URL_BASE}/${encodeURIComponent(presentationId)}?fields=${encodeURIComponent(FIELDS_PRESENTATION)}`
    return this.clientApi.requestJson<PresentationSlides>(url)
  }

  /**
   * Sets stretched picture backgrounds on several slides in one atomic batch.
   *
   * @param presentationId - Presentation ID.
   * @param assignments - Slide and image pairs.
   */
  async setBackgrounds(
    presentationId: string,
    assignments: readonly AssignmentBackground[],
  ): Promise<void> {
    const requests = assignments.map((assignment) => ({
      updatePageProperties: {
        objectId: assignment.slideId,
        pageProperties: {
          pageBackgroundFill: { stretchedPictureFill: { contentUrl: assignment.urlImage } },
        },
        fields: "pageBackgroundFill",
      },
    }))

    await this.clientApi.requestJson(
      `${URL_BASE}/${encodeURIComponent(presentationId)}:batchUpdate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      },
    )
  }
}
