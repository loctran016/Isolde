import { defineConfig, presetWind4, presetIcons, presetWebFonts } from "unocss";

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetIcons(),
    presetWebFonts({
      provider: "google", // default provider
      fonts: {
        // these will extend the default theme
        sans: "Inter",
        mono: ["Fira Code", "Fira Mono:400,700"],
        // custom ones
      },
    }),
  ],
});
