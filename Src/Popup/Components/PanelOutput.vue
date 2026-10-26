<!-- Output resolution control. The height follows the slide aspect ratio. -->
<template>
  <SectionPanel :title="translate('sectionOutput')">
    <FieldNumber
      :label="translate('labelWidthOutput')"
      :model-value="settings.widthOutput"
      :min="WIDTH_OUTPUT_MIN"
      :max="WIDTH_OUTPUT_MAX"
      :step="1"
      @update:model-value="$emit('patch', { widthOutput: $event })"
    />
    <p class="hint">{{ settings.widthOutput }} × {{ heightOutput }} px</p>
  </SectionPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import { computeSizeOutput } from "../../Core/Renderer"
import { WIDTH_OUTPUT_MAX, WIDTH_OUTPUT_MIN, type Settings } from "../../Core/Settings"
import { useTranslate } from "../Services/InjectionTranslator"
import FieldNumber from "./FieldNumber.vue"
import SectionPanel from "./SectionPanel.vue"

export default defineComponent({
  name: "PanelOutput",
  components: { FieldNumber, SectionPanel },
  props: {
    settings: { type: Object as PropType<Settings>, required: true },
    /** Slide width divided by height. */
    ratioAspect: { type: Number, required: true },
  },
  emits: {
    /** Fields to merge into the settings. */
    patch: (patch: Partial<Settings>) => typeof patch === "object",
  },
  setup() {
    return { translate: useTranslate(), WIDTH_OUTPUT_MIN, WIDTH_OUTPUT_MAX }
  },
  computed: {
    heightOutput(): number {
      return computeSizeOutput(this.settings.widthOutput, this.ratioAspect).height
    },
  },
})
</script>

<style scoped>
.hint {
  margin: 0;
  text-align: right;
  font-size: 11px;
  color: var(--color-text-muted);
}
</style>
