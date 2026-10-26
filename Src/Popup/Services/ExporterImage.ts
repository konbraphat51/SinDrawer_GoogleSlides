// Exports rendered backgrounds to the clipboard or as a downloaded file.

/**
 * Copies a PNG to the clipboard so it can be pasted into any slide.
 *
 * @param png - PNG data.
 */
export async function copyImageToClipboard(png: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })])
}

/**
 * Saves a PNG through the browser's download flow.
 *
 * @param png - PNG data.
 * @param nameFile - Suggested file name.
 */
export function downloadImage(png: Blob, nameFile: string): void {
  const url = URL.createObjectURL(png)
  const link = document.createElement("a")
  link.href = url
  link.download = nameFile
  link.click()
  // give the download a moment to start before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
