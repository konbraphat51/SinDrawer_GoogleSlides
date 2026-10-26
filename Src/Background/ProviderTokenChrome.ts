// OAuth token provider backed by chrome.identity.
import { ErrorApplication } from "../Shared/ErrorApplication"
import type { ProviderToken } from "../Slides/ClientGoogleApi"

// placeholder written by the build when GOOGLE_OAUTH_CLIENT_ID is missing
const PREFIX_CLIENT_UNCONFIGURED = "UNCONFIGURED"

/** Gets tokens for the signed-in Chrome profile using the manifest's oauth2 section. */
export class ProviderTokenChrome implements ProviderToken {
  async getToken(isInteractive: boolean): Promise<string> {
    if (isOauthUnconfigured()) {
      throw new ErrorApplication(
        "oauthUnconfigured",
        "Set GOOGLE_OAUTH_CLIENT_ID in .env and rebuild the extension.",
      )
    }

    try {
      const result = await chrome.identity.getAuthToken({ interactive: isInteractive })
      if (!result.token) {
        throw new Error("No token returned.")
      }
      return result.token
    } catch (error) {
      throw new ErrorApplication(
        "notAuthorized",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  async invalidateToken(token: string): Promise<void> {
    await chrome.identity.removeCachedAuthToken({ token })
  }
}

function isOauthUnconfigured(): boolean {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id ?? ""
  return clientId === "" || clientId.startsWith(PREFIX_CLIENT_UNCONFIGURED)
}
