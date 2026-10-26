// Verifies localization catalogs stay in sync and placeholders are substituted.
import { describe, expect, it } from "vitest"
import messagesEn from "../../Public/_locales/en/messages.json"
import messagesJa from "../../Public/_locales/ja/messages.json"
import { resolveLanguage, Translator } from "../../Src/Popup/Services/Translator"

describe("locale catalogs", () => {
  it("define the same keys in English and Japanese", () => {
    expect(Object.keys(messagesJa).sort()).toEqual(Object.keys(messagesEn).sort())
  })
})

describe("Translator", () => {
  it("substitutes placeholders", () => {
    expect(new Translator("en").translate("statusApplied", ["3"])).toBe("Applied to 3 slide(s).")
    expect(new Translator("ja").translate("statusApplied", ["3"])).toBe(
      "3 枚のスライドに適用しました。",
    )
  })

  it("returns plain messages", () => {
    expect(new Translator("ja").translate("buttonCopy")).toBe("画像をコピー")
  })
})

describe("resolveLanguage", () => {
  it("follows the browser in auto mode", () => {
    expect(resolveLanguage("auto", "ja-JP")).toBe("ja")
    expect(resolveLanguage("auto", "en-US")).toBe("en")
    expect(resolveLanguage("auto", "fr")).toBe("en")
  })

  it("honors an explicit preference", () => {
    expect(resolveLanguage("ja", "en-US")).toBe("ja")
  })
})
