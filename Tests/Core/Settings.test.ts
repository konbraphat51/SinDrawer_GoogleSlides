// Verifies settings sanitization falls back to defaults for invalid input.
import { describe, expect, it } from "vitest"
import { normalizeSettings, SETTINGS_DEFAULT, WIDTH_OUTPUT_MAX } from "../../Src/Core/Settings"
import { convertTextToSeed } from "../../Src/Core/Seed"

describe("normalizeSettings", () => {
  it("returns defaults for non-object input", () => {
    expect(normalizeSettings(undefined)).toEqual(SETTINGS_DEFAULT)
    expect(normalizeSettings("garbage")).toEqual(SETTINGS_DEFAULT)
  })

  it("rejects invalid fields individually", () => {
    const settings = normalizeSettings({
      colorWave: "red",
      placement: "bottom",
      amplitudeMax: -5,
      widthOutput: 99999,
      rateAxisByPlacement: { top: 2, topFill: "x" },
    })
    expect(settings.colorWave).toBe(SETTINGS_DEFAULT.colorWave)
    expect(settings.placement).toBe(SETTINGS_DEFAULT.placement)
    expect(settings.amplitudeMax).toBe(1)
    expect(settings.widthOutput).toBe(WIDTH_OUTPUT_MAX)
    expect(settings.rateAxisByPlacement.top).toBe(1)
    expect(settings.rateAxisByPlacement.topFill).toBe(SETTINGS_DEFAULT.rateAxisByPlacement.topFill)
  })

  it("keeps valid fields", () => {
    const settings = normalizeSettings({ colorWave: "#ABCDEF", placement: "rightFill" })
    expect(settings.colorWave).toBe("#abcdef")
    expect(settings.placement).toBe("rightFill")
  })
})

describe("convertTextToSeed", () => {
  it("sums char codes like the original", () => {
    expect(convertTextToSeed("")).toBe(0)
    expect(convertTextToSeed("AB")).toBe(65 + 66)
  })
})
