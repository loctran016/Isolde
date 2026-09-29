export default defineNitroPlugin(async () => {
  if (import.meta.dev) {
    await content.watch()
  }
})
