<!-- Labeled checkbox. -->
<template>
  <label class="field" :class="{ 'field--disabled': disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span>{{ label }}</span>
  </label>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "FieldCheckbox",
  props: {
    /** Visible label. */
    label: { type: String, required: true },
    modelValue: { type: Boolean, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
})
</script>

<style scoped>
.field {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.field--disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
