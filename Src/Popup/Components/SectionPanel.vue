<!-- Titled group of related controls. -->
<template>
  <section class="section">
    <h2 class="section__title">{{ title }}</h2>
    <div class="section__body">
      <slot />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "SectionPanel",
  props: {
    /** Heading of the group. */
    title: { type: String, required: true },
  },
})
</script>

<style scoped>
.section {
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}

.section__title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.section__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
