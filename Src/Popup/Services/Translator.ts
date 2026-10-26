// Localizes popup text from the extension's _locales files, with a runtime language override.
import messagesEn from "../../../Public/_locales/en/messages.json"
import messagesJa from "../../../Public/_locales/ja/messages.json"

/** Languages the UI is translated into. */
export const LANGUAGES = ["en", "ja"] as const

/** A supported language. */
export type Language = (typeof LANGUAGES)[number]

/** User preference: a fixed language or follow the browser. */
export type PreferenceLanguage = Language | "auto"

/** Message key present in the English catalog. */
export type KeyMessage = keyof typeof messagesEn

interface EntryMessage {
  message: string
  placeholders?: Record<string, { content: string }>
}

const CATALOGS: Record<Language, Record<string, EntryMessage>> = {
  en: messagesEn,
  ja: messagesJa,
}

/** Native names shown in the language selector. */
export const NAMES_LANGUAGE: Record<Language, string> = { en: "English", ja: "日本語" }

/**
 * Picks the UI language from a preference and the browser language.
 *
 * @param preference - User preference.
 * @param languageBrowser - Browser UI language such as "ja" or "en-US".
 */
export function resolveLanguage(preference: PreferenceLanguage, languageBrowser: string): Language {
  if (preference !== "auto") {
    return preference
  }
  return languageBrowser.toLowerCase().startsWith("ja") ? "ja" : "en"
}

/** Looks up localized messages in chrome.i18n format. */
export class Translator {
  /**
   * @param language - Language to translate into.
   */
  constructor(readonly language: Language) {}

  /**
   * Returns the localized message, substituting $1, $2, ... placeholders; falls back to English.
   *
   * @param key - Message key.
   * @param substitutions - Values for the placeholders, in order.
   */
  translate(key: KeyMessage, substitutions: readonly string[] = []): string {
    const entry = CATALOGS[this.language][key] ?? CATALOGS.en[key]
    if (entry === undefined) {
      return key
    }

    return entry.message.replace(/\$(\w+)\$/g, (whole, name: string) => {
      const content = entry.placeholders?.[name.toLowerCase()]?.content
      const index = content === undefined ? NaN : Number(content.replace("$", "")) - 1
      return substitutions[index] ?? whole
    })
  }
}
