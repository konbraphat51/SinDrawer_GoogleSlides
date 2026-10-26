// Verifies bearer token handling and error normalization of the API client.
import { afterEach, describe, expect, it, vi } from "vitest"
import { ErrorApplication } from "../../Src/Shared/ErrorApplication"
import { ClientGoogleApi } from "../../Src/Slides/ClientGoogleApi"

function createProvider() {
  let countToken = 0
  return {
    getToken: vi.fn(async () => `token${++countToken}`),
    invalidateToken: vi.fn().mockResolvedValue(undefined),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ClientGoogleApi", () => {
  it("attaches the bearer token and parses JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"a":1}', { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await new ClientGoogleApi(createProvider(), false).requestJson("https://x")

    expect(result).toEqual({ a: 1 })
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer token1")
  })

  it("retries once with a fresh token on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    const provider = createProvider()

    await new ClientGoogleApi(provider, false).request("https://x")

    expect(provider.invalidateToken).toHaveBeenCalledWith("token1")
    const headers = fetchMock.mock.calls[1]?.[1]?.headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer token2")
  })

  it("throws an api error for other failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 403 })))

    const promise = new ClientGoogleApi(createProvider(), false).request("https://x")

    await expect(promise).rejects.toBeInstanceOf(ErrorApplication)
    await expect(promise).rejects.toMatchObject({ code: "api" })
  })
})
