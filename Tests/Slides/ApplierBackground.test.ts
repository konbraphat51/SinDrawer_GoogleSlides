// Verifies the apply flow: one image per distinct seed, a single batch update, and cleanup.
import { describe, expect, it, vi } from "vitest"
import { SETTINGS_DEFAULT } from "../../Src/Core/Settings"
import { convertTextToSeed } from "../../Src/Core/Seed"
import { ApplierBackground } from "../../Src/Slides/ApplierBackground"
import type { PresentationSlides } from "../../Src/Slides/TypesSlides"

function createSlide(objectId: string, title: string) {
  return {
    objectId,
    pageElements: [
      {
        objectId: `${objectId}-title`,
        shape: {
          placeholder: { type: "TITLE" },
          text: { textElements: [{ textRun: { content: title } }] },
        },
      },
    ],
  }
}

const PRESENTATION: PresentationSlides = {
  presentationId: "pres",
  pageSize: { width: { magnitude: 16 }, height: { magnitude: 9 } },
  slides: [createSlide("s1", "Intro"), createSlide("s2", "Method"), createSlide("s3", "Intro")],
}

function createFixture(options: { isStageFailing?: boolean } = {}) {
  const clientSlides = {
    getPresentation: vi.fn().mockResolvedValue(PRESENTATION),
    setBackgrounds: vi.fn().mockResolvedValue(undefined),
  }
  let countStaged = 0
  const clientDrive = {
    stageImage: vi.fn(async () => {
      countStaged++
      if (options.isStageFailing && countStaged === 2) {
        throw new Error("boom")
      }
      return { fileId: `f${countStaged}`, url: `https://img/${countStaged}` }
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  }
  const renderer = { renderPng: vi.fn().mockResolvedValue(new Blob()) }
  const applier = new ApplierBackground(clientSlides, clientDrive, renderer)
  return { applier, clientSlides, clientDrive, renderer }
}

describe("ApplierBackground", () => {
  it("applies the current slide using its title as the seed", async () => {
    const { applier, clientSlides, renderer, clientDrive } = createFixture()

    const result = await applier.apply(
      { presentationId: "pres", slideId: "s2" },
      { settings: SETTINGS_DEFAULT, scope: "current", textSeedOverride: null },
    )

    expect(result.countApplied).toBe(1)
    expect(renderer.renderPng).toHaveBeenCalledWith(SETTINGS_DEFAULT, convertTextToSeed("Method"), {
      width: 1920,
      height: 1080,
    })
    expect(clientSlides.setBackgrounds).toHaveBeenCalledWith("pres", [
      { slideId: "s2", urlImage: "https://img/1" },
    ])
    expect(clientDrive.deleteFile).toHaveBeenCalledWith("f1")
  })

  it("renders once per distinct title when applying to all slides", async () => {
    const { applier, clientSlides, renderer, clientDrive } = createFixture()

    const result = await applier.apply(
      { presentationId: "pres", slideId: null },
      { settings: SETTINGS_DEFAULT, scope: "all", textSeedOverride: null },
    )

    expect(result.countApplied).toBe(3)
    expect(renderer.renderPng).toHaveBeenCalledTimes(2)
    const assignments = clientSlides.setBackgrounds.mock.calls[0]?.[1] as {
      slideId: string
      urlImage: string
    }[]
    const urlBySlide = Object.fromEntries(assignments.map((a) => [a.slideId, a.urlImage]))
    expect(urlBySlide.s1).toBe(urlBySlide.s3)
    expect(urlBySlide.s1).not.toBe(urlBySlide.s2)
    expect(clientDrive.deleteFile).toHaveBeenCalledTimes(2)
  })

  it("uses the override text for every slide", async () => {
    const { applier, renderer } = createFixture()

    await applier.apply(
      { presentationId: "pres", slideId: null },
      { settings: SETTINGS_DEFAULT, scope: "all", textSeedOverride: "fixed" },
    )

    expect(renderer.renderPng).toHaveBeenCalledTimes(1)
    expect(renderer.renderPng.mock.calls[0]?.[1]).toBe(convertTextToSeed("fixed"))
  })

  it("cleans up staged files when an upload fails", async () => {
    const { applier, clientSlides, clientDrive } = createFixture({ isStageFailing: true })

    await expect(
      applier.apply(
        { presentationId: "pres", slideId: null },
        { settings: SETTINGS_DEFAULT, scope: "all", textSeedOverride: null },
      ),
    ).rejects.toThrow("boom")

    expect(clientSlides.setBackgrounds).not.toHaveBeenCalled()
    expect(clientDrive.deleteFile).toHaveBeenCalledWith("f1")
  })
})
