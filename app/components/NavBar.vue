<template>
  <ul
    class="absolute top-4 left-[50%] translate-x-[-50%] border-rounded-full bg-gray-300/10 w-max px-4 max-w-64 flex gap-3 items-center justify-center py-1 border-gray-100/10 border-1"
    v-auto-animate
  >
    <li>
      <NuxtLink to="/">
        <IconNavBarWrapper>
          <div class="i-mdi:home" />
        </IconNavBarWrapper>
      </NuxtLink>
    </li>
    <li>
      <NuxtLink to="/fitness-tracker">
        <IconNavBarWrapper>
          <div class="i-mdi:weight-lifter" /> </IconNavBarWrapper
      ></NuxtLink>
    </li>
    <li>
      <NuxtLink to="/musical"
        ><IconNavBarWrapper>
          <div class="i-mdi:music-clef-treble" /> </IconNavBarWrapper
      ></NuxtLink>
    </li>
    <li>
      <NuxtLink to="/cooking"
        ><IconNavBarWrapper><div class="i-mdi:pot-steam" /></IconNavBarWrapper
      ></NuxtLink>
    </li>
  </ul>
</template>
