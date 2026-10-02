import { defineEventHandler, getRouterParam, createError, setResponseHeader } from 'h3'
import { content } from '../../utils/content'

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9.]+/g, '')

export default defineEventHandler(async (event) => {
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')
  const items = await (content as any).media.list()
  const item = items.find((i: any) => norm(i.path.split('/').pop()!) === norm(name))
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Media not found' })

  const raw = await (content as any).media.get(item.path)
  if (raw == null) throw createError({ statusCode: 404, statusMessage: 'Media not found' })

  setResponseHeader(event, 'content-type', item.meta.type)
  setResponseHeader(event, 'cache-control', 'public, max-age=86400')
  return typeof raw === 'string' ? raw : Buffer.from(raw as Uint8Array)
})
