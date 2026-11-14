<script setup lang="ts">
const tracks = [
  { title: '🎹 Calm Piano, Soft Rain', src: '/audios/🎹 Calm Piano, Soft Rain.m4a' },
  //   { title: 'Rain', src: '/audio/rain.mp3' },
  //   { title: 'Ambient Pad', src: '/audio/ambient-pad.mp3' },
]

const currentIndex = ref(0)
const isPlaying = ref(false)
const audioEl = ref<HTMLAudioElement | null>(null)
const volume = ref(0.6)

const currentTrack = computed(() => tracks[currentIndex.value])

function togglePlay() {
  if (!audioEl.value) return
  isPlaying.value ? audioEl.value.pause() : audioEl.value.play()
  isPlaying.value = !isPlaying.value
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % tracks.length
  nextTick(() => {
    if (isPlaying.value) audioEl.value?.play()
  })
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + tracks.length) % tracks.length
  nextTick(() => {
    if (isPlaying.value) audioEl.value?.play()
  })
}

watch(volume, (v) => {
  if (audioEl.value) audioEl.value.volume = v
})
</script>

<template>
  <div class="card flex flex-col gap-4">
    <audio ref="audioEl" :src="currentTrack.src" :volume="volume" @ended="next" />

    <h2 class="font-semibold font-head text-lg flex items-center gap-2">
      <div class="i-mdi:music-note" />
      Music
    </h2>

    <div class="flex-1 flex flex-col items-center justify-center gap-4">
      <p class="text-sm font-medium truncate max-w-full px-2">{{ currentTrack.title }}</p>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Previous track"
          @click="prev"
        >
          <div class="i-mdi:skip-previous text-xl" />
        </button>

        <button
          type="button"
          class="w-12 h-12 rounded-full bg-purple-500/15 hover:bg-purple-500/25 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 cursor-pointer"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          @click="togglePlay"
        >
          <div
            :class="isPlaying ? 'i-mdi:pause' : 'i-mdi:play'"
            class="text-2xl text-purple-700 dark:text-purple-300"
          />
        </button>

        <button
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 cursor-pointer"
          aria-label="Next track"
          @click="next"
        >
          <div class="i-mdi:skip-next text-xl" />
        </button>
      </div>
    </div>

    <input
      v-model.number="volume"
      type="range"
      min="0"
      max="1"
      step="0.05"
      class="w-full accent-purple-500 outline-none"
      aria-label="Volume"
    />
  </div>
</template>
