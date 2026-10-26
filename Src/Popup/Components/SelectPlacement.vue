<!-- Dropdown of placement presets. -->
<template>
  <label class="field">
    <span>{{ translate("labelPlacement") }}</span>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as Placement)"
    >
      <option v-for="placement in placements" :key="placement" :value="placement">
        {{ translate(KEYS_LABEL[placement]) }}
      </option>
    </select>
  </label>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import { PLACEMENTS, type Placement } from "../../Core/Placement"
import { useTranslate } from "../Services/InjectionTranslator"
import type { KeyMessage } from "../Services/Translator"

const KEYS_LABEL: Record<Placement, KeyMessage> = {
  rightFill: "placementRightFill",
  rightTopFill: "placementRightTopFill",
  top: "placementTop",
  topFill: "placementTopFill",
}

export default defineComponent({
  name: "SelectPlacement",
  props: {
    modelValue: { type: String as PropType<Placement>, required: true },
  },
  emits: {
    "update:modelValue": (value: Placement) => (PLACEMENTS as readonly string[]).includes(value),
  },
  setup() {
    return { translate: useTranslate(), placements: PLACEMENTS, KEYS_LABEL }
  },
})
</script>

<style scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
