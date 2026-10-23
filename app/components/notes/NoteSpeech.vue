function playNeural(i: number, mine: number) {
  const a = getAudio()
  a.onended = () => {
    if (mine === session) speakAt(i + 1, true)
  }
  a.onerror = () => {
    if (mine !== session) return
    // this one clip is missing: read only this block with the built-in voice, then go back to the AI voice
    console.warn('[tts] missing clip', queue[i].id, JSON.stringify(queue[i].text))
    if (hasSpeech.value) speakBrowser(i, true, mine)
    else speakAt(i + 1, true)
  }
  a.onplaying = () => {
    if (mine === session) hint.value = ''
  }

  const rate = settings.value.rate
  a.defaultPlaybackRate = rate // set before src: loading a new src resets playbackRate to this
  a.src = `${AUDIO_BASE}/${queue[i].id}.mp3`
  a.playbackRate = rate
  a.play().catch((e) => {
    if (mine !== session || e?.name === 'AbortError') return
    hint.value = 'Chạm ▶ để phát (trình duyệt chặn tự phát).'
    state.value = 'paused'
  })

  // warm the cache with the next clip so the gap between blocks stays short
  const next = queue[i + 1]
  if (next) {
    const w = new Audio()
    w.preload = 'auto'
    w.src = `${AUDIO_BASE}/${next.id}.mp3`
  }
}
