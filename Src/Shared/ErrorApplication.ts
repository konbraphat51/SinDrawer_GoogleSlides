// Error type carrying a transportable error code.
import type { CodeError, ErrorTransport } from "./Messages"

/** Error with a code the popup can localize. */
export class ErrorApplication extends Error {
  /**
   * @param code - Failure reason.
   * @param detail - Human-readable detail for debugging.
   */
  constructor(
    readonly code: CodeError,
    detail: string,
  ) {
    super(detail)
    this.name = "ErrorApplication"
  }

  /**
   * Converts any thrown value into a transportable error.
   *
   * @param error - Value caught in a catch block.
   */
  static toTransport(error: unknown): ErrorTransport {
    if (error instanceof ErrorApplication) {
      return { code: error.code, detail: error.message }
    }
    return { code: "unknown", detail: error instanceof Error ? error.message : String(error) }
  }
}
