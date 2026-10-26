// Verifies the service worker handler resolves the active tab and reads slide context.
import { afterEach, describe, expect, it, vi } from "vitest"
import { HandlerMessage } from "../../Src/Background/HandlerMessage"

const PRESENTATION = {
  presentationId: "pres",
  pageSize: { width: { magnitude: 4 }, height: { magnitude: 3 } },
  slides: [
    { objectId: "p" },
    {
      objectId: "g1",
      pageElements: [
        {
          objectId: "t",
          shape: {
            placeholder: { type: "TITLE" },
            text: { textElements: [{ textRun: { content: "Goal\n" } }] },
          },
        },
      ],
    },
  ],
}

function createHandler(url: string | undefined) {
  return new HandlerMessage({
    providerToken: { getToken: async () => "t", invalidateToken: async () => {} },
    renderer: { renderPng: async () => new Blob() },
    getUrlTabActive: async () => url,
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("HandlerMessage", () => {
  it("rejects tabs that are not Google Slides", async () => {
    await expect(
      createHandler("https://example.com").handle({
        type: "fetchContextSlide",
        isInteractive: false,
      }),
    ).rejects.toMatchObject({ code: "notSlides" })
  })

  it("returns the context of the slide in the URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(PRESENTATION), { status: 200 })),
    )

    const context = await createHandler(
      "https://docs.google.com/presentation/d/pres/edit#slide=id.g1",
    ).handle({ type: "fetchContextSlide", isInteractive: false })

    expect(context).toEqual({
      presentationId: "pres",
      slideIdCurrent: "g1",
      titleCurrent: "Goal",
      ratioAspect: 4 / 3,
      countSlide: 2,
    })
  })
})
