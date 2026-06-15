<template>
  <!-- 
    Pointer events are tracked globally (on body), but styles are applied 
    directly to this wrapper to keep the component self-contained.
  -->
  <article
    ref="cardRef"
    class="glowcard-main card"
    data-glow
    :style="cssVars"
  >
    <!-- Outer Glow: Controlled by Prop -->
    <div v-if="outerGlow" data-glow></div>

    <div class="card__content">
      <slot/>
    </div>
  </article>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watchEffect } from 'vue'
import Color from 'color' // Assumes 'color' is installed or mapped

// --- Props (Configuration Interface) ---
const props = defineProps({
  // Content
  title: { 
    type: String, 
    default: 'Wherever you go,<br/>the cursor follows'
  },
  label: { type: String, default: 'Pro' },
  buttonText: { type: String, default: 'Follow' },
  iconPath: { 
    type: String, 
    default: 'M17.303 5.197A7.5 7.5 0 0 0 6.697 15.803a.75.75 0 0 1-1.061 1.061A9 9 0 1 1 21 10.5a.75.75 0 0 1-1.5 0c0-1.92-.732-3.839-2.197-5.303Zm-2.121 2.121a4.5 4.5 0 0 0-6.364 6.364.75.75 0 1 1-1.06 1.06A6 6 0 1 1 18 10.5a.75.75 0 0 1-1.5 0c0-1.153-.44-2.303-1.318-3.182Zm-3.634 1.314a.75.75 0 0 1 .82.311l5.228 7.917a.75.75 0 0 1-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 0 1-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 0 1-1.247-.606l.569-9.47a.75.75 0 0 1 .554-.68Z' 
  },

  // Appearance
  baseHue: { type: Number, default: 180 }, // --base
  spread: { type: Number, default: 500 },   // --spread
  outerGlow: { type: Boolean, default: true },
  controlGlow: { type: Boolean, default: false }, // The glow on the button
  
  // Dimensions & Styling
  borderWidth: { type: Number, default: 2 },
  borderRadius: { type: Number, default: 12 },
  spotlightSize: { type: Number, default: 150 },
  
  // Colors
  backdropAlpha: { type: Number, default: 0.15 },
})

const cardRef = ref(null)

const cssVars = computed(() => {
  return {
    '--base': props.baseHue,
    '--spread': props.spread,
    '--border': props.borderWidth,
    '--radius': props.borderRadius,
    '--size': props.spotlightSize,
    
    // Defaults for other internals
    '--bg-spot-opacity': 0.1,
    '--border-light-opacity': 1,
    '--border-spot-opacity': 1
  }
})

// --- Mouse Tracking ---
const updatePointer = ({ x, y }) => {
  if (!cardRef.value) return
  
  // We update the style manually to avoid Vue reactivity overhead on every frame
  const style = cardRef.value.style
  const xp = (x / window.innerWidth).toFixed(2)
  const yp = (y / window.innerHeight).toFixed(2)
  
  style.setProperty('--x', x.toFixed(2))
  style.setProperty('--xp', xp)
  style.setProperty('--y', y.toFixed(2))
  style.setProperty('--yp', yp)
}

onMounted(() => {
  document.body.addEventListener('pointermove', updatePointer)
})

onUnmounted(() => {
  document.body.removeEventListener('pointermove', updatePointer)
})
</script>