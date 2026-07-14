import { defineConfig, presetWind4, presetIcons } from 'unocss'
import { presetScrollbar } from 'unocss-preset-scrollbar'

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetIcons(),
    presetScrollbar(),
  ],
  //   extendTheme(theme) {
  //     theme.font = {
  //       ...theme.font,
  //       sans: 'Inter Variable, sans-serif',
  //       head: 'Space Grotesk Variable, sans-serif',
  //     }
  //   },
  //   theme: {
  //     font: {
  //       // ← was fontFamily
  //       sans: 'Inter Variable, sans-serif',
  //       head: 'Space Grotesk Variable, sans-serif',
  //     },
  //   },
  theme: {
    font: {
      sans: ['Inter Variable', 'sans-serif'],
      head: ['Space Grotesk Variable', 'sans-serif'],
    },
  },
  shortcuts: {
    card: 'rounded-2xl bg-white/45 dark:bg-stone-800/50 backdrop-blur-xl backdrop-saturate-150 border border-white/40 dark:border-white/10 p-6',
    'card-title': 'font-semibold font-head flex items-center gap-1 ml-2 text-lg',
  },
})
