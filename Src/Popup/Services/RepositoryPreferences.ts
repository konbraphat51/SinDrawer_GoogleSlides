// Persists popup preferences in chrome.storage.local, or localStorage outside the extension.
import { normalizeSettings, type Settings } from "../../Core/Settings"
import type { PreferenceLanguage } from "./Translator"

/** Everything the popup remembers between sessions. */
export interface Preferences {
  settings: Settings
  preferenceLanguage: PreferenceLanguage
  isUsingSlideTitle: boolean
  /** Seed text used when slide titles are not used. */
  textSeedCustom: string
}

const KEY_STORAGE = "preferences"

/** Loads and saves preferences, sanitizing whatever is read back. */
export class RepositoryPreferences {
  /** Reads saved preferences, filling gaps with defaults. */
  async load(): Promise<Preferences> {
    return normalizePreferences(await readRaw())
  }

  /**
   * Saves preferences.
   *
   * @param preferences - Values to persist.
   */
  async save(preferences: Preferences): Promise<void> {
    // JSON round trip strips Vue proxies, which storage cannot clone
    const plain = JSON.parse(JSON.stringify(preferences)) as Preferences
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [KEY_STORAGE]: plain })
    } else {
      localStorage.setItem(KEY_STORAGE, JSON.stringify(plain))
    }
  }
}

/**
 * Builds valid preferences from untrusted data.
 *
 * @param source - Raw stored value.
 */
export function normalizePreferences(source: unknown): Preferences {
  const record = (typeof source === "object" && source !== null ? source : {}) as Record<
    string,
    unknown
  >
  const preferenceLanguage = record.preferenceLanguage
  return {
    settings: normalizeSettings(record.settings),
    preferenceLanguage:
      preferenceLanguage === "en" || preferenceLanguage === "ja" ? preferenceLanguage : "auto",
    isUsingSlideTitle: record.isUsingSlideTitle !== false,
    textSeedCustom: typeof record.textSeedCustom === "string" ? record.textSeedCustom : "",
  }
}

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && chrome.storage?.local !== undefined
}

async function readRaw(): Promise<unknown> {
  try {
    if (hasChromeStorage()) {
      return (await chrome.storage.local.get(KEY_STORAGE))[KEY_STORAGE]
    }
    const text = localStorage.getItem(KEY_STORAGE)
    return text === null ? undefined : JSON.parse(text)
  } catch {
    return undefined
  }
}
