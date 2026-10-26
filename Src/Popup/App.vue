<!-- Root of the popup: owns preferences and slide context, and wires the panels to the service worker. -->
<template>
  <main class="app">
    <header class="app__header">
      <img class="app__logo" src="/Icons/Icon32.png" alt="" />
      <h1 class="app__title">SinDrawer</h1>
      <SelectLanguage v-model="preferences.preferenceLanguage" />
    </header>

    <CanvasPreview :settings="preferences.settings" :seed="seed" :ratio-aspect="ratioAspect" />

    <MessageStatus
      :status="status"
      :is-connect-visible="codeErrorContext === 'notAuthorized' && !isBusy"
      @connect="refreshContext(true)"
    />

    <ButtonsAction
      :is-apply-enabled="context !== null"
      :is-busy="isBusy"
      :count-slide="context?.countSlide ?? 0"
      @apply-current="applyBackground('current')"
      @apply-all="applyBackground('all')"
      @copy="copyImage"
      @download="downloadImage"
    />

    <PanelSeed
      v-model:is-using-slide-title="preferences.isUsingSlideTitle"
      v-model:text-seed-custom="preferences.textSeedCustom"
      :context="context"
    />
    <PanelAppearance :settings="preferences.settings" @patch="patchSettings" />
    <PanelOutput
      :settings="preferences.settings"
      :ratio-aspect="ratioAspect"
      @patch="patchSettings"
    />

    <footer class="app__footer">
      <button class="button button--link" @click="resetSettings">
        {{ translate("buttonResetSettings") }}
      </button>
    </footer>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, provide, reactive, ref, watch } from "vue"
import { computeSizeOutput } from "../Core/Renderer"
import { convertTextToSeed } from "../Core/Seed"
import { normalizeSettings, type Settings } from "../Core/Settings"
import type { CodeError, ContextSlide, ErrorTransport, ScopeApply } from "../Shared/Messages"
import { RendererImageOffscreen } from "../Shared/RendererImageOffscreen"
import ButtonsAction from "./Components/ButtonsAction.vue"
import CanvasPreview from "./Components/CanvasPreview.vue"
import MessageStatus from "./Components/MessageStatus.vue"
import PanelAppearance from "./Components/PanelAppearance.vue"
import PanelOutput from "./Components/PanelOutput.vue"
import PanelSeed from "./Components/PanelSeed.vue"
import SelectLanguage from "./Components/SelectLanguage.vue"
import { KEYS_ERROR } from "./Models/KeysError"
import type { Status } from "./Models/Status"
import { createBridge } from "./Services/BridgeExtension"
import * as ExporterImage from "./Services/ExporterImage"
import { KEY_TRANSLATOR } from "./Services/InjectionTranslator"
import { normalizePreferences, RepositoryPreferences } from "./Services/RepositoryPreferences"
import { resolveLanguage, Translator, type KeyMessage } from "./Services/Translator"

const RATIO_ASPECT_DEFAULT = 16 / 9

// kept as keys so the text follows language changes
interface StatusKeyed {
  kind: Status["kind"]
  key: KeyMessage
  substitutions?: string[]
}

function getLanguageBrowser(): string {
  return typeof chrome !== "undefined" && chrome.i18n?.getUILanguage
    ? chrome.i18n.getUILanguage()
    : navigator.language
}

export default defineComponent({
  name: "App",
  components: {
    ButtonsAction,
    CanvasPreview,
    MessageStatus,
    PanelAppearance,
    PanelOutput,
    PanelSeed,
    SelectLanguage,
  },
  setup() {
    const bridge = createBridge()
    const repository = new RepositoryPreferences()
    const renderer = new RendererImageOffscreen()

    const preferences = reactive(normalizePreferences(undefined))
    const context = ref<ContextSlide | null>(null)
    const codeErrorContext = ref<CodeError | null>(null)
    const statusKeyed = ref<StatusKeyed | null>(null)
    const isBusy = ref(false)
    const isLoaded = ref(false)

    const translator = computed(
      () => new Translator(resolveLanguage(preferences.preferenceLanguage, getLanguageBrowser())),
    )
    provide(KEY_TRANSLATOR, translator)
    const translate = (key: KeyMessage, substitutions?: readonly string[]): string =>
      translator.value.translate(key, substitutions)

    const status = computed<Status | null>(() =>
      statusKeyed.value === null
        ? null
        : {
            kind: statusKeyed.value.kind,
            text: translate(statusKeyed.value.key, statusKeyed.value.substitutions),
          },
    )

    // slide titles can only be used once the presentation has been read
    const isUsingTitleEffective = computed(
      () => preferences.isUsingSlideTitle && context.value !== null,
    )
    const textSeed = computed(() =>
      isUsingTitleEffective.value
        ? (context.value?.titleCurrent ?? "")
        : preferences.textSeedCustom,
    )
    const seed = computed(() => convertTextToSeed(textSeed.value))
    const ratioAspect = computed(() => context.value?.ratioAspect ?? RATIO_ASPECT_DEFAULT)

    function showError(error: ErrorTransport): void {
      console.warn(error.detail)
      statusKeyed.value = { kind: "error", key: KEYS_ERROR[error.code] }
    }

    async function refreshContext(isInteractive: boolean): Promise<void> {
      if (!bridge.isAvailable) {
        statusKeyed.value = { kind: "info", key: "errorStandalone" }
        return
      }

      isBusy.value = true
      statusKeyed.value = { kind: "info", key: "statusLoading" }
      const response = await bridge.fetchContextSlide(isInteractive)
      isBusy.value = false

      if (response.ok) {
        context.value = response.value
        codeErrorContext.value = null
        statusKeyed.value = null
      } else {
        context.value = null
        codeErrorContext.value = response.error.code
        showError(response.error)
      }
    }

    async function applyBackground(scope: ScopeApply): Promise<void> {
      isBusy.value = true
      statusKeyed.value = { kind: "info", key: "statusApplying" }
      const response = await bridge.applyBackground({
        settings: JSON.parse(JSON.stringify(preferences.settings)) as Settings,
        scope,
        textSeedOverride: isUsingTitleEffective.value ? null : preferences.textSeedCustom,
      })
      isBusy.value = false

      if (response.ok) {
        statusKeyed.value = {
          kind: "success",
          key: "statusApplied",
          substitutions: [String(response.value.countApplied)],
        }
      } else {
        showError(response.error)
      }
    }

    async function renderPng(): Promise<Blob> {
      return renderer.renderPng(
        preferences.settings,
        seed.value,
        computeSizeOutput(preferences.settings.widthOutput, ratioAspect.value),
      )
    }

    async function copyImage(): Promise<void> {
      try {
        await ExporterImage.copyImageToClipboard(await renderPng())
        statusKeyed.value = { kind: "success", key: "statusCopied" }
      } catch (error) {
        showError({ code: "unknown", detail: String(error) })
      }
    }

    async function downloadImage(): Promise<void> {
      ExporterImage.downloadImage(await renderPng(), `sindrawer-${seed.value}.png`)
    }

    function patchSettings(patch: Partial<Settings>): void {
      preferences.settings = normalizeSettings({ ...preferences.settings, ...patch })
    }

    function resetSettings(): void {
      preferences.settings = normalizeSettings(undefined)
    }

    watch(
      preferences,
      () => {
        if (isLoaded.value) {
          void repository.save(preferences)
        }
      },
      { deep: true },
    )

    onMounted(async () => {
      Object.assign(preferences, await repository.load())
      isLoaded.value = true
      await refreshContext(false)
    })

    return {
      preferences,
      context,
      codeErrorContext,
      status,
      isBusy,
      seed,
      ratioAspect,
      translate,
      refreshContext,
      applyBackground,
      copyImage,
      downloadImage,
      patchSettings,
      resetSettings,
    }
  },
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.app__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app__logo {
  width: 22px;
  height: 22px;
}

.app__title {
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.app__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
