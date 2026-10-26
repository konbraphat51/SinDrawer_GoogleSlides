// Verifies Slides URL parsing.
import { describe, expect, it } from "vitest"
import { parseUrlSlides } from "../../Src/Slides/UrlSlides"

describe("parseUrlSlides", () => {
  it("reads presentation and slide IDs", () => {
    expect(
      parseUrlSlides("https://docs.google.com/presentation/d/abc-DEF_123/edit#slide=id.g2a_0_5"),
    ).toEqual({ presentationId: "abc-DEF_123", slideId: "g2a_0_5" })
  })

  it("handles multi-account URLs and missing fragments", () => {
    expect(parseUrlSlides("https://docs.google.com/presentation/u/1/d/xyz/edit")).toEqual({
      presentationId: "xyz",
      slideId: null,
    })
  })

  it("rejects other URLs", () => {
    expect(parseUrlSlides(undefined)).toBeNull()
    expect(parseUrlSlides("https://docs.google.com/document/d/xyz/edit")).toBeNull()
    expect(parseUrlSlides("https://example.com/presentation/d/xyz")).toBeNull()
  })
})
