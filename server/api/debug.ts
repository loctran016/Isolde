import { content } from '~~/server/utils/content'

export default defineEventHandler(async () => {
  return await content.list()
})
