<template>
  <canvas ref="canvasRef" class="fixed inset-0 pointer-events-none opacity-40" style="z-index:0" />
</template>

<script setup lang="ts">
import { useMouse, useWindowSize, useRafFn, useEventListener } from '@vueuse/core'

const props = withDefaults(defineProps<{
  enabled?: boolean
  dotSpacing?: number
  dotSize?: number
  glowRadius?: number
  dotColor?: string
  glowColor?: string
  bgColor?: string
  cooldown?: number
}>(), {
  enabled: true, // For configuring on the device, or if the device is mobile.
  dotSpacing: 17,
  dotSize: 1.5,
  glowRadius: 100,
  dotColor: '#44403c',   // tailwind colors to copy, we cant use HSL here unfortunately, bg-stone-700
  glowColor: '#f97316',  // bg-orange-500
  bgColor: '#0c0a09',    // bg-stone-950
  cooldown: 0.02,        // fraction of remaining "heat" lost per frame (~1s to cool)
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

const { x: mouseX, y: mouseY } = useMouse({ type: 'client' })
const { width, height } = useWindowSize()

const shouldDrawGlowGrid = ref(
  props.enabled
)

// Heat map, one float [0,1] per dot, persisted across frames
let heatMap = new Float32Array(0)
let gridCols = 0
let gridRows = 0

function syncHeatMap(cols: number, rows: number) {
  if (cols === gridCols && rows === gridRows) return

  const next = new Float32Array(cols * rows) as any // We're disabling types for this array because i dont know how to type this right
  // preserve existing heat on resize
  const minCols = Math.min(cols, gridCols)
  const minRows = Math.min(rows, gridRows)
  for (let c = 0; c < minCols; c++)
    for (let r = 0; r < minRows; r++)
      next[c * rows + r] = heatMap[c * gridRows + r]

  heatMap = next
  gridCols = cols
  gridRows = rows
}

// Sync canvas size to window size
watch([width, height], ([w, h]) => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = w
  canvas.height = h
})

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(from: string, to: string, t: number): string {
  // Runs each frame to calculate the color of each dot based on its heat based on time.
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `rgb(${r},${g},${b})`
}

useRafFn(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { dotSpacing, dotSize, glowRadius, dotColor, glowColor, bgColor, cooldown } = props
  const w = canvas.width
  const h = canvas.height
  const r = dotSize / 2
  const mx = shouldDrawGlowGrid.value ? mouseX.value : -99999
  const my = shouldDrawGlowGrid.value ? mouseY.value : -99999

  const cols = Math.ceil(w / dotSpacing)
  const rows = Math.ceil(h / dotSpacing)
  syncHeatMap(cols, rows)

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  let col = 0
  for (let x = dotSpacing / 2; x < w; x += dotSpacing, col++) {
    let row = 0
    for (let y = dotSpacing / 2; y < h; y += dotSpacing, row++) {
      const dx = x - mx
      const dy = y - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      const target = smoothstep(Math.max(0, 1 - dist / glowRadius))
      const idx = col * rows + row
      const prev = heatMap[idx] || 0

      // Heat up instantly, cool down slowly
      heatMap[idx] = target >= prev ? target : prev + (target - prev) * cooldown

      const t = heatMap[idx]
      ctx.fillStyle = t > 0.001 ? lerpColor(dotColor, glowColor, t) : dotColor
      ctx.beginPath()
      ctx.arc(x, y, r + t * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
})

onMounted(() => {
  const canvas = canvasRef.value!
  canvas.width = width.value
  canvas.height = height.value
})
</script>
