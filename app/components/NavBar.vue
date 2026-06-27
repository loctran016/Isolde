<template>
  <ul
    class="fixed left-1/2 -translate-x-1/2 border-rounded-full bg-gray-300/10 w-max  flex gap-3 items-center justify-center top-4 border-gray-100/10 border-1 backdrop-blur-2xl transition-all duration-300 scale-90 hover:scale-100"

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
    <li>
      <NuxtLink to="/gallery"
        ><IconNavBarWrapper><div class="i-solar:gallery-round-bold" /></IconNavBarWrapper
      ></NuxtLink>
    </li>
  </ul>
</template>
