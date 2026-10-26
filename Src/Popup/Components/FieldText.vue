<!-- Labeled single-line text input that updates on every keystroke. -->
<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>
    <input
      class="field__input"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "FieldText",
  props: {
    /** Visible label. */
    label: { type: String, required: true },
    modelValue: { type: String, required: true },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
})
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field__input {
  width: 100%;
}
</style>
