// Service worker entry point: wires dependencies and answers popup messages.
import { ErrorApplication } from "../Shared/ErrorApplication"
import type { Message, Response } from "../Shared/Messages"
import { HandlerMessage } from "./HandlerMessage"
import { ProviderTokenChrome } from "./ProviderTokenChrome"
import { RendererImageOffscreen } from "../Shared/RendererImageOffscreen"

const handler = new HandlerMessage({
  providerToken: new ProviderTokenChrome(),
  renderer: new RendererImageOffscreen(),
  getUrlTabActive: async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    return tab?.url
  },
})

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handler
    .handle(message)
    .then((value) => sendResponse({ ok: true, value } satisfies Response<unknown>))
    .catch((error: unknown) => {
      console.error(error)
      sendResponse({
        ok: false,
        error: ErrorApplication.toTransport(error),
      } satisfies Response<unknown>)
    })

  // keep the channel open for the async response
  return true
})
