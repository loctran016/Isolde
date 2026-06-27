<script setup lang="ts">
const supabase = useSupabaseClient()

const redirectTo = process.dev
  ? 'http://localhost:3000/confirm'
  : 'https://hby-loc.vercel.app/confirm'

const email = ref('')
const loadingEmail = ref(false)
const loadingGitHub = ref(false)
const message = ref('')
const errorMsg = ref('')
const cooldown = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

const startCooldown = (seconds = 60) => {
  cooldown.value = seconds
  if (timer) clearInterval(timer)

  timer = setInterval(() => {
    if (cooldown.value > 0) cooldown.value--
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const signInWithOtp = async () => {
  errorMsg.value = ''
  message.value = ''

  const value = email.value.trim()
  if (!value) {
    errorMsg.value = 'Please enter your email.'
    return
  }
  if (!isValidEmail(value)) {
    errorMsg.value = 'Please enter a valid email address.'
    return
  }
  if (loadingEmail.value || cooldown.value > 0) return

  loadingEmail.value = true
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      errorMsg.value = error.message
      if (error.message.toLowerCase().includes('rate limit')) startCooldown(60)
      return
    }

    message.value = `Magic link sent to ${value}. Check your inbox.`
    startCooldown(60)
  } finally {
    loadingEmail.value = false
  }
}

const signInWithGitHub = async () => {
  errorMsg.value = ''
  message.value = ''
  if (loadingGitHub.value) return

  loadingGitHub.value = true
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    })

    if (error) {
      errorMsg.value = error.message
    }
    // Supabase handles redirect automatically.
  } finally {
    loadingGitHub.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl bg-white shadow-lg border border-purple-100 p-6 space-y-5">
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-purple-600">Welcome back</h1>
        <p class="text-sm text-gray-500">Sign in with email magic link or GitHub</p>
      </div>

      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="w-full rounded-xl border border-purple-200 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition"
          @keydown.enter.prevent="signInWithOtp"
        />

        <button
          class="w-full rounded-xl bg-purple-600 text-white py-2.5 font-medium hover:bg-purple-700 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="!email.trim() || loadingEmail || cooldown > 0"
          @click="signInWithOtp"
        >
          <span v-if="loadingEmail">Sending magic link...</span>
          <span v-else-if="cooldown > 0">Try email again in {{ cooldown }}s</span>
          <span v-else>Sign in with Email</span>
        </button>
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-purple-100" />
        </div>
        <div class="relative flex justify-center">
          <span class="bg-white px-3 text-xs uppercase tracking-wide text-gray-400">or</span>
        </div>
      </div>

      <button
        class="w-full rounded-xl border border-purple-200 bg-white text-gray-700 py-2.5 font-medium hover:border-purple-400 hover:text-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        :disabled="loadingGitHub"
        @click="signInWithGitHub"
      >
        <span v-if="loadingGitHub">Redirecting to GitHub...</span>
        <span v-else>Sign in with GitHub</span>
      </button>

      <p v-if="message" class="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2">
        {{ message }}
      </p>
      <p v-if="errorMsg" class="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>
