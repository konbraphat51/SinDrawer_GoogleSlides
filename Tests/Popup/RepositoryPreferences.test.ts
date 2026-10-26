// Verifies stored preferences are sanitized.
import { describe, expect, it } from "vitest"
import { SETTINGS_DEFAULT } from "../../Src/Core/Settings"
import { normalizePreferences } from "../../Src/Popup/Services/RepositoryPreferences"

describe("normalizePreferences", () => {
  it("defaults to slide titles and automatic language", () => {
    expect(normalizePreferences(undefined)).toEqual({
      settings: SETTINGS_DEFAULT,
      preferenceLanguage: "auto",
      isUsingSlideTitle: true,
      textSeedCustom: "",
    })
  })

  it("keeps valid values and drops invalid ones", () => {
    const preferences = normalizePreferences({
      preferenceLanguage: "ja",
      isUsingSlideTitle: false,
      textSeedCustom: 42,
    })
    expect(preferences.preferenceLanguage).toBe("ja")
    expect(preferences.isUsingSlideTitle).toBe(false)
    expect(preferences.textSeedCustom).toBe("")
  })
})
