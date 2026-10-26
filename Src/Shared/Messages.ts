// Message contract between the popup and the service worker.
import type { Settings } from "../Core/Settings"

/** Machine-readable failure reasons, mapped to localized text in the popup. */
export type CodeError =
  "notSlides" | "oauthUnconfigured" | "notAuthorized" | "sharingBlocked" | "api" | "unknown"

/** Failure that can cross the message boundary. */
export interface ErrorTransport {
  code: CodeError
  /** Raw detail for debugging; may be English-only. */
  detail: string
}

/** Envelope for every response. */
export type Response<T> = { ok: true; value: T } | { ok: false; error: ErrorTransport }

/** What the popup needs to know about the presentation in the active tab. */
export interface ContextSlide {
  presentationId: string
  /** Object ID of the slide currently open in the editor. */
  slideIdCurrent: string
  /** Title text of the current slide; empty if it has none. */
  titleCurrent: string
  /** Page width divided by page height. */
  ratioAspect: number
  countSlide: number
}

/** Which slides to apply the background to. */
export type ScopeApply = "current" | "all"

/** Parameters of a background application. */
export interface RequestApply {
  settings: Settings
  scope: ScopeApply
  /** Seed text for every slide; null uses each slide's own title. */
  textSeedOverride: string | null
}

/** Outcome of a successful application. */
export interface ResultApply {
  countApplied: number
}

/** Requests the popup can send. */
export type Message =
  | { type: "fetchContextSlide"; isInteractive: boolean }
  | { type: "applyBackground"; request: RequestApply }

/** Maps each message type to its response payload. */
export interface MapResponse {
  fetchContextSlide: ContextSlide
  applyBackground: ResultApply
}
