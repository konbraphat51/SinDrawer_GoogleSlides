// Vite build for the Chrome extension: Vue popup, module service worker, and generated manifest.
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { defineConfig, loadEnv, type Plugin } from "vite"
import vue from "@vitejs/plugin-vue"
import { buildManifest } from "./BuildTools/ManifestBuilder"

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

function emitManifest(mode: string): Plugin {
  return {
    name: "sindrawer-manifest",
    generateBundle() {
      const env = loadEnv(mode, projectRoot, "")
      const packageJson = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf-8")) as {
        version: string
      }

      if (!env.GOOGLE_OAUTH_CLIENT_ID) {
        this.warn("GOOGLE_OAUTH_CLIENT_ID is not set in .env; applying backgrounds will not work.")
      }

      const manifest = buildManifest({
        version: packageJson.version,
        oauthClientId: env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        extensionKey: env.EXTENSION_KEY ?? "",
      })
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  root: `${projectRoot}/Src`,
  envDir: projectRoot,
  publicDir: `${projectRoot}/Public`,
  plugins: [vue(), emitManifest(mode)],
  build: {
    outDir: `${projectRoot}/dist`,
    emptyOutDir: true,
    sourcemap: mode === "development",
    rollupOptions: {
      input: {
        Popup: `${projectRoot}/Src/Popup/Popup.html`,
        ServiceWorker: `${projectRoot}/Src/Background/ServiceWorker.ts`,
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "Chunks/[name]-[hash].js",
        assetFileNames: "Assets/[name]-[hash][extname]",
      },
    },
  },
}))
