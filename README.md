# SinDrawer for Google Slides

[日本語版はこちら](README.ja.md)

A Chrome extension that brings [SinDrawer](https://github.com/konbraphat51/SinDrawer) to Google Slides.
It draws the same sine-wave art from the slide title and sets it as the slide background in one click.

- **One click**: open a presentation, click the extension icon, then press **Apply to this slide** or **Apply to all slides**.
- **Same algorithm as SinDrawer**: the XorShift seeding, the random sine sum and the four placements (right fill, right top fill, top line, top fill) are ported unchanged. Unit tests check that the output vertices match the original exactly.
- **Slide titles as seeds**: each slide's title seeds its wave, just as the original asks you to type the slide title. With **Apply to all slides**, every slide gets its own wave, and slides with the same title get the same one.
- **Live preview** with color, position, axis, amplitude, background and resolution controls. Settings are remembered.
- **Copy / Download** the PNG, even without a Google account connection.
- UI in English and Japanese (follows the browser by default; switchable in the popup).

## Setup (from `git clone`)

Requirements: Node.js 20+, [pnpm](https://pnpm.io/) 10+, Google Chrome.

### 1. Build and load the extension

```sh
git clone https://github.com/konbraphat51/SinDrawer_GoogleSlides.git
cd SinDrawer_GoogleSlides
pnpm install
cp .env.example .env
pnpm build
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `dist/` folder.
3. Copy the **ID** shown on the extension card. You need it in the next step.

At this point preview, copy and download already work. Applying backgrounds needs an OAuth client.

### 2. Create a Google OAuth client (one time)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project or pick an existing one.
2. Under **APIs & Services → Library**, enable the **Google Slides API** and the **Google Drive API**.
3. Under **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - Choose **External** (or **Internal** for a Workspace-only tool) and fill in the required fields.
   - Add the scopes `.../auth/presentations` and `.../auth/drive.file`.
   - While the app is in testing, add your own Google account under **Test users**.
4. Under **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Chrome Extension**.
   - Item ID: the extension ID from step 1.
5. Put the client ID in `.env`:

   ```sh
   GOOGLE_OAUTH_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   ```

6. Run `pnpm build` again and click the reload icon on the extension card in `chrome://extensions`.

> The ID of an unpacked extension depends on the folder path. If you move the folder or use another machine, the ID changes and the OAuth client stops matching.
> To pin the ID, put a public key in `EXTENSION_KEY` in `.env` (see [Chrome docs: keep a consistent extension ID](https://developer.chrome.com/docs/extensions/reference/manifest/key)).

### 3. Use it

1. Open a presentation at `docs.google.com/presentation/...` and select a slide.
2. Click the SinDrawer icon. The first time, click **Connect Google account** and allow access. If the popup closes during sign-in, just open it again.
3. Adjust the look in the preview, then press **Apply to this slide** or **Apply to all N slides**. The background appears in the editor within a few seconds.

## Running for the second time and later

- After changing code: `pnpm build` (or keep `pnpm watch` running), then click reload on the extension card in `chrome://extensions`.
- To use it: there is nothing to start. Open Google Slides and click the extension icon.

## Important CLIs

| Command          | What it does                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm install`   | Install dependencies                                                                                     |
| `pnpm build`     | Type-check and build the extension into `dist/`                                                          |
| `pnpm watch`     | Rebuild `dist/` on every change (development mode, with source maps)                                     |
| `pnpm dev`       | Serve the popup at `http://localhost:5173/Popup/Popup.html` for UI work (standalone mode, no Google API) |
| `pnpm test`      | Run the unit tests (Vitest)                                                                              |
| `pnpm lint`      | Lint with ESLint                                                                                         |
| `pnpm typecheck` | Type-check with `vue-tsc`                                                                                |
| `pnpm format`    | Format with Prettier                                                                                     |
| `pnpm icons`     | Regenerate `Public/Icons/*.png`                                                                          |

## How applying works, and its limits

The Slides API only accepts background images by public URL. To hand the image over, the extension:

1. renders the PNG locally,
2. uploads it to your Drive (`drive.file` scope, so the extension only sees files it created),
3. shares it as "anyone with the link" for a few seconds while Slides copies it,
4. deletes it right away.

If your Google Workspace admin forbids link sharing, applying fails with a clear message.
In that case use **Copy image** or **Download PNG**, then set the background by hand with **Slide → Change background → Choose image**.

See [Docs/Architecture.md](Docs/Architecture.md) for the design.

## License

[Boost Software License 1.0](LICENSE)
