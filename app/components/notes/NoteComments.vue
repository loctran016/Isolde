<script setup lang="ts">
const GISCUS = {
  repo: 'loctran016/Isolide',
  repoId: 'R_kgDOTFB4VA',
  category: 'General',
  categoryId: 'DIC_kwDOTFB4VM4DJWfX',
}

const route = useRoute()
const container = ref<HTMLElement | null>(null)
const isDark = ref(false)
const giscusTheme = computed(() => (isDark.value ? 'dark_dimmed' : 'light'))

function mountGiscus() {
  if (!container.value) return
  container.value.innerHTML = ''
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', GISCUS.repo)
  s.setAttribute('data-repo-id', GISCUS.repoId)
  s.setAttribute('data-category', GISCUS.category)
  s.setAttribute('data-category-id', GISCUS.categoryId)
  s.setAttribute('data-mapping', 'pathname')
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'bottom')
  s.setAttribute('data-theme', giscusTheme.value)
  s.setAttribute('data-lang', 'vi')
  s.setAttribute('data-loading', 'lazy')
  container.value.appendChild(s)
}

// Đổi theme của giscus mà không cần tải lại iframe
function syncTheme() {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage(
    { giscus: { setConfig: { theme: giscusTheme.value } } },
    'https://giscus.app',
  )
}

let observer: MutationObserver | null = null

onMounted(() => {
  const root = document.documentElement
  isDark.value = root.classList.contains('dark')
  mountGiscus()

  // Theo dõi class "dark" trên <html> (do useTheme().applyTheme bật/tắt)
  observer = new MutationObserver(() => {
    isDark.value = root.classList.contains('dark')
  })
  observer.observe(root, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => observer?.disconnect())

watch(isDark, syncTheme)
// Sang ghi chú khác thì tải lại khung bình luận cho đúng trang
watch(
  () => route.path,
  () => nextTick(mountGiscus),
)
</script>

<template>
  <section class="not-prose mt-10 border-t border-stone-600/20 pt-6 dark:border-slate-200/20">
    <h2 class="mb-4 text-lg font-semibold opacity-90 lg:text-xl">Bình luận</h2>
    <div ref="container" />
  </section>
</template>
