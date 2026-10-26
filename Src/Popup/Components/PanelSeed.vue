<!-- Chooses whether the seed comes from slide titles or from custom text. -->
<template>
  <SectionPanel :title="translate('sectionSeed')">
    <FieldCheckbox
      :label="translate('labelUseSlideTitle')"
      :model-value="isUsingSlideTitle && isTitleAvailable"
      :disabled="!isTitleAvailable"
      @update:model-value="$emit('update:isUsingSlideTitle', $event)"
    />
    <p v-if="isUsingSlideTitle && isTitleAvailable" class="info">
      {{ textInfoTitle }}<br />
      <span class="info__sub">{{ translate("infoAllSlidesSeed") }}</span>
    </p>
    <FieldText
      v-else
      :label="translate('labelSeedText')"
      :placeholder="translate('placeholderSeedText')"
      :model-value="textSeedCustom"
      @update:model-value="$emit('update:textSeedCustom', $event)"
    />
  </SectionPanel>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import type { ContextSlide } from "../../Shared/Messages"
import { useTranslate } from "../Services/InjectionTranslator"
import FieldCheckbox from "./FieldCheckbox.vue"
import FieldText from "./FieldText.vue"
import SectionPanel from "./SectionPanel.vue"

export default defineComponent({
  name: "PanelSeed",
  components: { FieldCheckbox, FieldText, SectionPanel },
  props: {
    isUsingSlideTitle: { type: Boolean, required: true },
    textSeedCustom: { type: String, required: true },
    /** Context of the open presentation; null when unavailable. */
    context: { type: Object as PropType<ContextSlide | null>, default: null },
  },
  emits: ["update:isUsingSlideTitle", "update:textSeedCustom"],
  setup() {
    return { translate: useTranslate() }
  },
  computed: {
    isTitleAvailable(): boolean {
      return this.context !== null
    },
    textInfoTitle(): string {
      const title = this.context?.titleCurrent ?? ""
      return title === ""
        ? this.translate("infoSlideUntitled")
        : this.translate("infoSlideCurrent", [title])
    },
  },
})
</script>

<style scoped>
.info {
  margin: 0;
  font-size: 12px;
  word-break: break-word;
}

.info__sub {
  color: var(--color-text-muted);
  font-size: 11px;
}
</style>
