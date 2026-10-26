// Status message model shown in the popup.

/** Message shown to the user. */
export interface Status {
  kind: "info" | "success" | "error"
  text: string
}
