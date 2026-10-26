<!-- Labeled number input that clamps and rounds on commit. -->
<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input
      class="field__input"
      type="number"
      :value="formatValue(modelValue)"
      :min="min"
      :max="max"
      :step="step"
      @change="commitValue"
    />
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { clamp } from "../../Core/Geometry"
import { convertToFiniteNumber } from "../../Core/Settings"

export default defineComponent({
  name: "FieldNumber",
  props: {
    /** Visible label. */
    label: { type: String, required: true },
    modelValue: { type: Number, required: true },
    min: { type: Number, default: -Infinity },
    max: { type: Number, default: Infinity },
    step: { type: Number, default: 1 },
    /** Digits after the decimal point. */
    decimals: { type: Number, default: 0 },
  },
  emits: {
    "update:modelValue": (value: number) => Number.isFinite(value),
  },
  methods: {
    formatValue(value: number): string {
      return value.toFixed(this.decimals)
    },
    commitValue(event: Event): void {
      const input = event.target as HTMLInputElement
      const parsed = convertToFiniteNumber(input.value, this.modelValue)
      const factor = 10 ** this.decimals
      const value = Math.round(clamp(parsed, this.min, this.max) * factor) / factor

      // write back so out-of-range input snaps to the accepted value
      input.value = this.formatValue(value)
      this.$emit("update:modelValue", value)
    },
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

.field__input {
  width: 96px;
}
</style>
