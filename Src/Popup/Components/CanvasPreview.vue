<!-- Live preview of the background, drawn with the same renderer used for the final image. -->
<template>
  <div class="preview" :class="{ 'preview--transparent': settings.isBackgroundTransparent }">
    <canvas ref="canvas" class="preview__canvas" :style="{ aspectRatio: String(ratioAspect) }" />
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue"
import { computeSizeOutput, renderBackground } from "../../Core/Renderer"
import type { Settings } from "../../Core/Settings"

// internal resolution; rendering at a fixed width keeps the preview proportional to the output
const WIDTH_PREVIEW = 640

export default defineComponent({
  name: "CanvasPreview",
  props: {
    settings: { type: Object as PropType<Settings>, required: true },
    seed: { type: Number, required: true },
    /** Slide width divided by height. */
    ratioAspect: { type: Number, required: true },
  },
  watch: {
    settings: { handler: "draw", deep: true },
    seed: "draw",
    ratioAspect: "draw",
  },
  mounted() {
    this.draw()
  },
  methods: {
    draw(): void {
      const canvas = this.$refs.canvas as HTMLCanvasElement | undefined
      const context = canvas?.getContext("2d")
      if (!canvas || !context) {
        return
      }

      const size = computeSizeOutput(WIDTH_PREVIEW, this.ratioAspect)
      canvas.width = size.width
      canvas.height = size.height
      renderBackground(context, this.settings, this.seed, size)
    },
  },
})
</script>

<style scoped>
.preview {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  line-height: 0;
}

.preview--transparent {
  background: repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 12px 12px;
}

.preview__canvas {
  width: 100%;
  height: auto;
}
</style>
