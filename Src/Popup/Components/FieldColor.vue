<!-- Labeled color picker that updates live while dragging. -->
<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <span class="field__control">
      <code class="field__code">{{ modelValue }}</code>
      <input
        class="field__input"
        type="color"
        :value="modelValue"
        :disabled="disabled"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </span>
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "FieldColor",
  props: {
    /** Visible label. */
    label: { type: String, required: true },
    /** Color as #rrggbb. */
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
})
</script>

<style scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field__control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field__code {
  font-size: 11px;
  color: var(--color-text-muted);
}

.field__input {
  width: 36px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
</style>
