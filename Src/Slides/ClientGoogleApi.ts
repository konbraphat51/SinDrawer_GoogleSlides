// Authenticated fetch wrapper for Google REST APIs with one automatic token refresh.
import { ErrorApplication } from "../Shared/ErrorApplication"

/** Source of OAuth access tokens. */
export interface ProviderToken {
  /**
   * Returns an access token.
   *
   * @param isInteractive - Allow showing a sign-in or consent prompt.
   */
  getToken(isInteractive: boolean): Promise<string>
  /**
   * Drops a token that the API rejected so the next getToken() fetches a fresh one.
   *
   * @param token - Rejected token.
   */
  invalidateToken(token: string): Promise<void>
}

/** Thin HTTP client that attaches the bearer token and normalizes errors. */
export class ClientGoogleApi {
  /**
   * @param providerToken - Token source.
   * @param isInteractive - Whether token acquisition may prompt the user.
   */
  constructor(
    private readonly providerToken: ProviderToken,
    private readonly isInteractive: boolean,
  ) {}

  /**
   * Sends a request and parses the JSON body; empty bodies yield undefined.
   *
   * @param url - Absolute API URL.
   * @param init - Fetch options; the Authorization header is added automatically.
   */
  async requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await this.request(url, init)
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  /**
   * Sends a request, retrying once with a fresh token on HTTP 401.
   *
   * @param url - Absolute API URL.
   * @param init - Fetch options.
   */
  async request(url: string, init: RequestInit = {}): Promise<Response> {
    let token = await this.providerToken.getToken(this.isInteractive)
    let response = await this.fetchWithToken(url, init, token)

    if (response.status === 401) {
      await this.providerToken.invalidateToken(token)
      token = await this.providerToken.getToken(this.isInteractive)
      response = await this.fetchWithToken(url, init, token)
    }

    if (!response.ok) {
      throw new ErrorApplication(
        "api",
        `${init.method ?? "GET"} ${url} failed: ${response.status} ${await response.text()}`,
      )
    }
    return response
  }

  private fetchWithToken(url: string, init: RequestInit, token: string): Promise<Response> {
    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${token}`)
    return fetch(url, { ...init, headers })
  }
}
