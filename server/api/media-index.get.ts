import { defineEventHandler } from 'h3'
import { content } from '../utils/content'

export default defineEventHandler(async () => {
  const items = await (content as any).media.list()
  return { count: items.length, sample: items.slice(0, 3) }
})
