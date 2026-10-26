// Stages images in Google Drive so that the Slides API can fetch them by URL.
import { ErrorApplication } from "../Shared/ErrorApplication"
import type { ClientGoogleApi } from "./ClientGoogleApi"

const URL_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id"
const URL_FILES = "https://www.googleapis.com/drive/v3/files"

/** Image that is temporarily readable by anyone with its URL. */
export interface ImageStaged {
  fileId: string
  /** Direct download URL the Slides API can fetch. */
  url: string
}

/** Uploads, shares, and removes temporary image files. */
export class ClientDrive {
  /**
   * @param clientApi - Authenticated HTTP client.
   */
  constructor(private readonly clientApi: ClientGoogleApi) {}

  /**
   * Uploads a PNG and makes it readable by anyone with the link.
   *
   * @param image - PNG data.
   * @param name - File name shown in Drive while the file exists.
   */
  async stageImage(image: Blob, name: string): Promise<ImageStaged> {
    const { id: fileId } = await this.uploadPng(image, name)

    try {
      await this.clientApi.request(`${URL_FILES}/${fileId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      })
    } catch (error) {
      await this.deleteFile(fileId)
      // Workspace admins can forbid sharing outside the organization
      throw new ErrorApplication(
        "sharingBlocked",
        error instanceof Error ? error.message : String(error),
      )
    }

    return { fileId, url: `https://drive.google.com/uc?export=download&id=${fileId}` }
  }

  /**
   * Deletes a file, ignoring failures since the file is only a temporary copy.
   *
   * @param fileId - Drive file ID.
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.clientApi.request(`${URL_FILES}/${fileId}`, { method: "DELETE" })
    } catch (error) {
      console.warn(`Failed to delete temporary Drive file ${fileId}`, error)
    }
  }

  private uploadPng(image: Blob, name: string): Promise<{ id: string }> {
    const boundary = `sindrawer${crypto.randomUUID()}`
    const metadata = JSON.stringify({ name, mimeType: "image/png" })
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: image/png\r\n\r\n`,
      image,
      `\r\n--${boundary}--`,
    ])

    return this.clientApi.requestJson<{ id: string }>(URL_UPLOAD, {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    })
  }
}
