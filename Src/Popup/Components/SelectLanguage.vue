<!-- Compact UI language selector. -->
<template>
  <select
    class="select"
    :aria-label="translate('labelLanguage')"
    :value="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="auto">{{ translate("languageAuto") }}</option>
    <option v-for="language in languages" :key="language" :value="language">
      {{ NAMES_LANGUAGE[language] }}
    </option>
  </select>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import { useTranslate } from "../Services/InjectionTranslator"
import { LANGUAGES, NAMES_LANGUAGE, type PreferenceLanguage } from "../Services/Translator"

export default defineComponent({
  name: "SelectLanguage",
  props: {
    modelValue: { type: String as PropType<PreferenceLanguage>, required: true },
  },
  emits: ["update:modelValue"],
  setup() {
    return { translate: useTranslate(), languages: LANGUAGES, NAMES_LANGUAGE }
  },
})
</script>

<style scoped>
.select {
  font-size: 11px;
  padding: 2px 4px;
}
</style>
