// Maps transportable error codes to localized message keys.
import type { CodeError } from "../../Shared/Messages"
import type { KeyMessage } from "../Services/Translator"

/** Message key for each error code. */
export const KEYS_ERROR: Readonly<Record<CodeError, KeyMessage>> = {
  notSlides: "errorNotSlides",
  oauthUnconfigured: "errorOauthUnconfigured",
  notAuthorized: "errorNotAuthorized",
  sharingBlocked: "errorSharingBlocked",
  api: "errorApi",
  unknown: "errorUnknown",
}
