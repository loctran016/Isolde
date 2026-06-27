<script setup></script>

<template>
  <div class="w-full bg-stone-900 text-gray-100">
    <NavBar />
      <slot />

  </div>
</template>

<style>
html,
body,
#__nuxt {
  width: 100%;
  height: 100%;
  margin: 0;
  background: #1c1917;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
