// Verifies slide title extraction.
import { describe, expect, it } from "vitest"
import { extractTitleSlide } from "../../Src/Slides/TitleSlide"

describe("extractTitleSlide", () => {
  it("joins the text runs of the title placeholder", () => {
    const title = extractTitleSlide({
      objectId: "p1",
      pageElements: [
        { objectId: "body", shape: { placeholder: { type: "BODY" }, text: { textElements: [] } } },
        {
          objectId: "title",
          shape: {
            placeholder: { type: "TITLE" },
            text: {
              textElements: [
                {},
                { textRun: { content: "Hello " } },
                { textRun: { content: "World\n" } },
              ],
            },
          },
        },
      ],
    })
    expect(title).toBe("Hello World")
  })

  it("accepts centered titles", () => {
    const title = extractTitleSlide({
      objectId: "p1",
      pageElements: [
        {
          objectId: "t",
          shape: {
            placeholder: { type: "CENTERED_TITLE" },
            text: { textElements: [{ textRun: { content: "表紙" } }] },
          },
        },
      ],
    })
    expect(title).toBe("表紙")
  })

  it("returns an empty string without a title", () => {
    expect(extractTitleSlide({ objectId: "p1" })).toBe("")
  })
})
