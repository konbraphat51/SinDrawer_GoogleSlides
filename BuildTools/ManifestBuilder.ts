// Builds manifest.json for the extension from package metadata and environment variables.

/** Values injected into the manifest at build time. */
export interface ManifestOptions {
  /** Extension version, usually taken from package.json. */
  version: string
  /** OAuth 2.0 client ID of type "Chrome Extension". Empty string leaves OAuth unconfigured. */
  oauthClientId: string
  /** Optional public key that pins the extension ID. */
  extensionKey: string
}

/** OAuth scopes needed to edit slide backgrounds and stage images in Drive. */
export const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive.file",
]

/**
 * Creates the Manifest V3 object for the extension.
 *
 * @param options - Build-time values to inject.
 * @returns A JSON-serializable manifest object.
 */
export function buildManifest(options: ManifestOptions): Record<string, unknown> {
  const manifest: Record<string, unknown> = {
    manifest_version: 3,
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    default_locale: "en",
    version: options.version,
    icons: buildIconMap(),
    action: {
      default_popup: "Popup/Popup.html",
      default_icon: buildIconMap(),
    },
    background: {
      service_worker: "ServiceWorker.js",
      type: "module",
    },
    permissions: ["identity", "storage"],
    host_permissions: [
      "https://docs.google.com/presentation/*",
      "https://slides.googleapis.com/*",
      "https://www.googleapis.com/*",
    ],
    oauth2: {
      client_id: options.oauthClientId || "UNCONFIGURED.apps.googleusercontent.com",
      scopes: OAUTH_SCOPES,
    },
  }

  if (options.extensionKey) {
    manifest.key = options.extensionKey
  }

  return manifest
}

function buildIconMap(): Record<string, string> {
  const iconMap: Record<string, string> = {}
  for (const size of [16, 32, 48, 128]) {
    iconMap[String(size)] = `Icons/Icon${size}.png`
  }
  return iconMap
}
