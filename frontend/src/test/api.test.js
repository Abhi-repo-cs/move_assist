import { describe, it, expect, vi } from 'vitest'
import { analyzeEnvironment, ApiError } from '../services/api.js'

const file = new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' })
const args = { image: file, question: 'What is ahead of me?', mode: 'concise' }

const respond = (status, body) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })

describe('analyzeEnvironment error handling', () => {
  it('returns a normalized result on success', async () => {
    globalThis.fetch = respond(200, { answer: 'A door.', uncertainty: 'Unsure.', demo_mode: true })
    const r = await analyzeEnvironment(args)
    expect(r.answer).toBe('A door.')
    expect(r.observations).toEqual([])
    expect(r.demoMode).toBe(true)
  })

  it('surfaces the server detail message on 4xx', async () => {
    globalThis.fetch = respond(400, { detail: 'Please enter a question.' })
    await expect(analyzeEnvironment(args)).rejects.toThrow('Please enter a question.')
  })

  it('uses a friendly fallback when the server sends no detail', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 504, json: async () => { throw new Error('x') } })
    await expect(analyzeEnvironment(args)).rejects.toThrow(/too long/i)
  })

  it('handles network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(analyzeEnvironment(args)).rejects.toThrow(/Cannot reach/)
  })

  it('handles client-side timeout', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' }))
    await expect(analyzeEnvironment(args)).rejects.toThrow(/too long/i)
  })

  it('rejects a malformed success body', async () => {
    globalThis.fetch = respond(200, { nope: true })
    const err = await analyzeEnvironment(args).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toMatch(/unexpected/i)
  })
})
