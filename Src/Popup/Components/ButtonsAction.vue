<!-- Primary actions: apply to Slides, or export the image. -->
<template>
  <div class="actions">
    <button
      class="button button--primary"
      :disabled="!isApplyEnabled || isBusy"
      @click="$emit('applyCurrent')"
    >
      {{ translate("buttonApplyCurrent") }}
    </button>
    <button
      class="button"
      :disabled="!isApplyEnabled || isBusy || countSlide < 2"
      @click="$emit('applyAll')"
    >
      {{
        countSlide > 0
          ? translate("buttonApplyAll", [String(countSlide)])
          : translate("buttonApplyAllUnknown")
      }}
    </button>
    <div class="actions__row">
      <button class="button button--quiet" :disabled="isBusy" @click="$emit('copy')">
        {{ translate("buttonCopy") }}
      </button>
      <button class="button button--quiet" :disabled="isBusy" @click="$emit('download')">
        {{ translate("buttonDownload") }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { useTranslate } from "../Services/InjectionTranslator"

export default defineComponent({
  name: "ButtonsAction",
  props: {
    /** Whether a Slides presentation is reachable. */
    isApplyEnabled: { type: Boolean, required: true },
    isBusy: { type: Boolean, required: true },
    countSlide: { type: Number, required: true },
  },
  emits: ["applyCurrent", "applyAll", "copy", "download"],
  setup() {
    return { translate: useTranslate() }
  },
})
</script>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions__row {
  display: flex;
  gap: 6px;
}

.actions__row .button {
  flex: 1;
}
</style>
