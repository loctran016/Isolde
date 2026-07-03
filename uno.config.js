import { defineConfig, presetWind4, presetIcons, presetWebFonts } from 'unocss'
import { presetScrollbar } from 'unocss-preset-scrollbar'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetIcons(),
    presetWebFonts({
      provider: 'google', // default provider
      fonts: {
        // these will extend the default theme
        sans: 'Inter',
        head: 'Space Grotesk',
        // mono: ["Fira Code", "Fira Mono:400,700"],
        // custom ones
      },
    }),
    presetScrollbar(),
  ],
})
