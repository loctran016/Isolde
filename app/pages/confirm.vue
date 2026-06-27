<script setup lang="ts">
const user = useSupabaseUser()

let timeoutId: ReturnType<typeof setTimeout> | null = null

watch(
  user,
  async (newUser) => {
    if (newUser) {
      if (timeoutId) clearTimeout(timeoutId)
      await navigateTo('/', { replace: true })
    }
  },
  { immediate: true }
)

onMounted(() => {
  timeoutId = setTimeout(async () => {
    if (!user.value) {
      await navigateTo('/login?error=timeout', { replace: true })
    }
  }, 10000)
})

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl bg-white shadow-lg border border-purple-100 p-6 text-center space-y-4">
      <div class="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
        <div class="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>

      <h1 class="text-xl font-semibold text-purple-600">Completing sign-in...</h1>
      <p class="text-sm text-gray-500">Please wait while we verify your account.</p>
      <p class="text-xs text-gray-400">You will be redirected automatically.</p>
    </div>
  </div>
</template>
