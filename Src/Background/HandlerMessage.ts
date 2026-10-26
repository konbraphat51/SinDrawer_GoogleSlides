// Handles popup requests in the service worker: reads the active Slides tab and applies backgrounds.
import { ErrorApplication } from "../Shared/ErrorApplication"
import type { ContextSlide, Message, RequestApply, ResultApply } from "../Shared/Messages"
import { ApplierBackground, type RendererImage } from "../Slides/ApplierBackground"
import { ClientDrive } from "../Slides/ClientDrive"
import { ClientGoogleApi, type ProviderToken } from "../Slides/ClientGoogleApi"
import { ClientSlides } from "../Slides/ClientSlides"
import { buildContextSlide } from "../Slides/ContextSlide"
import { parseUrlSlides, type LocationSlides } from "../Slides/UrlSlides"

/** Dependencies of the handler, injected for testability. */
export interface DependenciesHandler {
  providerToken: ProviderToken
  renderer: RendererImage
  /** Returns the URL of the tab the user is looking at. */
  getUrlTabActive(): Promise<string | undefined>
}

/** Dispatches messages to the matching use case. */
export class HandlerMessage {
  /**
   * @param dependencies - External services.
   */
  constructor(private readonly dependencies: DependenciesHandler) {}

  /**
   * Handles one message and returns its payload; throws on failure.
   *
   * @param message - Request from the popup.
   */
  handle(message: Message): Promise<ContextSlide | ResultApply> {
    switch (message.type) {
      case "fetchContextSlide":
        return this.fetchContextSlide(message.isInteractive)
      case "applyBackground":
        return this.applyBackground(message.request)
    }
  }

  private async fetchContextSlide(isInteractive: boolean): Promise<ContextSlide> {
    const location = await this.locateSlides()
    const clientSlides = new ClientSlides(this.createClientApi(isInteractive))
    const presentation = await clientSlides.getPresentation(location.presentationId)
    return buildContextSlide(presentation, location.slideId)
  }

  private async applyBackground(request: RequestApply): Promise<ResultApply> {
    const location = await this.locateSlides()
    const clientApi = this.createClientApi(true)
    const applier = new ApplierBackground(
      new ClientSlides(clientApi),
      new ClientDrive(clientApi),
      this.dependencies.renderer,
    )
    return applier.apply(location, request)
  }

  private async locateSlides(): Promise<LocationSlides> {
    const url = await this.dependencies.getUrlTabActive()
    const location = parseUrlSlides(url)
    if (location === null) {
      throw new ErrorApplication("notSlides", `Active tab is not a Google Slides editor: ${url}`)
    }
    return location
  }

  private createClientApi(isInteractive: boolean): ClientGoogleApi {
    return new ClientGoogleApi(this.dependencies.providerToken, isInteractive)
  }
}
