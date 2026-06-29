

<template>
  <div>
    <!-- The container where abcjs will inject the sheet music -->
    <div ref="sheetMusic"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  abcNotation: {
    type: String,
    required: true
  }
});

const sheetMusic = ref(null);

onMounted(async () => {
  // Import abcjs only on the client side to avoid SSR errors
  const abcjs = await import('abcjs');

  // Render the music into the DOM ref
  if (sheetMusic.value) {
    abcjs.renderAbc(sheetMusic.value, props.abcNotation, {
      responsive: 'resize'
    });
  }
});
</script>
