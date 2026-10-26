// Popup-side access to the service worker, with a standalone fallback for debugging outside the extension.
import type {
  ContextSlide,
  MapResponse,
  Message,
  RequestApply,
  Response,
  ResultApply,
} from "../../Shared/Messages"

/** Operations the popup delegates to the service worker. */
export interface BridgeExtension {
  /** False when running as a plain web page, where only preview and export work. */
  readonly isAvailable: boolean
  /**
   * Reads the presentation open in the active tab.
   *
   * @param isInteractive - Allow the Google sign-in prompt.
   */
  fetchContextSlide(isInteractive: boolean): Promise<Response<ContextSlide>>
  /**
   * Applies the background to slides of the active presentation.
   *
   * @param request - What to apply and where.
   */
  applyBackground(request: RequestApply): Promise<Response<ResultApply>>
}

/** Bridge that talks to the service worker via chrome.runtime messaging. */
export class BridgeChrome implements BridgeExtension {
  readonly isAvailable = true

  fetchContextSlide(isInteractive: boolean): Promise<Response<ContextSlide>> {
    return this.send({ type: "fetchContextSlide", isInteractive })
  }

  applyBackground(request: RequestApply): Promise<Response<ResultApply>> {
    return this.send({ type: "applyBackground", request })
  }

  private async send<T extends Message>(message: T): Promise<Response<MapResponse[T["type"]]>> {
    try {
      return (await chrome.runtime.sendMessage(message)) as Response<MapResponse[T["type"]]>
    } catch (error) {
      return {
        ok: false,
        error: { code: "unknown", detail: error instanceof Error ? error.message : String(error) },
      }
    }
  }
}

/** Bridge used when the popup page is opened directly in a browser (e.g. the Vite dev server). */
export class BridgeStandalone implements BridgeExtension {
  readonly isAvailable = false

  async fetchContextSlide(): Promise<Response<ContextSlide>> {
    return { ok: false, error: { code: "notSlides", detail: "Standalone mode" } }
  }

  async applyBackground(): Promise<Response<ResultApply>> {
    return { ok: false, error: { code: "notSlides", detail: "Standalone mode" } }
  }
}

/** Picks the bridge matching the current runtime. */
export function createBridge(): BridgeExtension {
  const isExtension = typeof chrome !== "undefined" && chrome.runtime?.id !== undefined
  return isExtension ? new BridgeChrome() : new BridgeStandalone()
}
