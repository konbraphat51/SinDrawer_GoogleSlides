<!-- Controls for the shape and colors of the wave. Emits partial settings updates. -->
<template>
  <SectionPanel :title="translate('sectionAppearance')">
    <SelectPlacement
      :model-value="settings.placement"
      @update:model-value="$emit('patch', { placement: $event })"
    />
    <FieldNumber
      :label="translate(preset.axis === 'x' ? 'labelAxisX' : 'labelAxisY')"
      :model-value="settings.rateAxisByPlacement[settings.placement] * 100"
      :min="0"
      :max="100"
      :step="0.1"
      :decimals="1"
      @update:model-value="patchRateAxis"
    />
    <FieldNumber
      :label="translate('labelAmplitudeMax')"
      :model-value="settings.amplitudeMax"
      :min="AMPLITUDE_MAX_MIN"
      :step="1"
      @update:model-value="$emit('patch', { amplitudeMax: $event })"
    />
    <FieldColor
      :label="translate('labelColorWave')"
      :model-value="settings.colorWave"
      @update:model-value="$emit('patch', { colorWave: $event })"
    />
    <div class="row">
      <FieldColor
        class="row__grow"
        :label="translate('labelColorBackground')"
        :model-value="settings.colorBackground"
        :disabled="settings.isBackgroundTransparent"
        @update:model-value="$emit('patch', { colorBackground: $event })"
      />
      <FieldCheckbox
        :label="translate('labelTransparent')"
        :model-value="settings.isBackgroundTransparent"
        @update:model-value="$emit('patch', { isBackgroundTransparent: $event })"
      />
    </div>
  </SectionPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import { PRESETS_PLACEMENT, type PresetPlacement } from "../../Core/Placement"
import { AMPLITUDE_MAX_MIN, type Settings } from "../../Core/Settings"
import { useTranslate } from "../Services/InjectionTranslator"
import FieldCheckbox from "./FieldCheckbox.vue"
import FieldColor from "./FieldColor.vue"
import FieldNumber from "./FieldNumber.vue"
import SectionPanel from "./SectionPanel.vue"
import SelectPlacement from "./SelectPlacement.vue"

export default defineComponent({
  name: "PanelAppearance",
  components: { FieldCheckbox, FieldColor, FieldNumber, SectionPanel, SelectPlacement },
  props: {
    settings: { type: Object as PropType<Settings>, required: true },
  },
  emits: {
    /** Fields to merge into the settings. */
    patch: (patch: Partial<Settings>) => typeof patch === "object",
  },
  setup() {
    return { translate: useTranslate(), AMPLITUDE_MAX_MIN }
  },
  computed: {
    preset(): PresetPlacement {
      return PRESETS_PLACEMENT[this.settings.placement]
    },
  },
  methods: {
    patchRateAxis(percent: number): void {
      this.$emit("patch", {
        rateAxisByPlacement: {
          ...this.settings.rateAxisByPlacement,
          [this.settings.placement]: percent / 100,
        },
      })
    },
  },
})
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row__grow {
  flex: 1;
}
</style>
