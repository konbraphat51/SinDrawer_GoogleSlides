<!-- Status line for progress, success, and errors, with an optional account connect button. -->
<template>
  <div v-if="status !== null" class="status" :class="`status--${status.kind}`" role="status">
    <span>{{ status.text }}</span>
    <button v-if="isConnectVisible" class="button button--small" @click="$emit('connect')">
      {{ translate("buttonConnect") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import type { Status } from "../Models/Status"
import { useTranslate } from "../Services/InjectionTranslator"

export default defineComponent({
  name: "MessageStatus",
  props: {
    status: { type: Object as PropType<Status | null>, default: null },
    /** Show the button that starts the Google sign-in flow. */
    isConnectVisible: { type: Boolean, default: false },
  },
  emits: ["connect"],
  setup() {
    return { translate: useTranslate() }
  },
})
</script>

<style scoped>
.status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.status--info {
  background: var(--color-info-bg);
}

.status--success {
  background: var(--color-success-bg);
}

.status--error {
  background: var(--color-error-bg);
}
</style>
