const BASE = import.meta.env.VITE_API_BASE || ''

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const STATUS_FALLBACK = {
  400: 'The request was not valid. Check the image and your question.',
  413: 'That image is too large. Try a smaller one.',
  415: 'That file type is not supported. Use a JPG or PNG image.',
  422: 'The request was not valid. Check the image and your question.',
  503: 'The AI service is unavailable right now. Try again shortly.',
  504: 'The AI model took too long to respond. Try again.',
}

export async function getHealth() {
  try {
    const res = await fetch(`${BASE}/api/health`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function analyzeEnvironment({ image, question, mode = 'concise', timeoutMs = 45000 }) {
  const form = new FormData()
  form.append('image', image)
  form.append('question', question)
  form.append('response_mode', mode)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(`${BASE}/api/analyze`, { method: 'POST', body: form, signal: controller.signal })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('The request took too long. Please try again.', 0)
    }
    throw new ApiError('Cannot reach the MoveAssist server. Check that the backend is running.', 0)
  } finally {
    clearTimeout(timer)
  }

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : null
    throw new ApiError(detail || STATUS_FALLBACK[res.status] || 'Something went wrong. Please try again.', res.status)
  }

  if (!body || typeof body.answer !== 'string' || !body.answer.trim()) {
    throw new ApiError('The server sent an unexpected response. Please try again.', res.status)
  }

  return {
    answer: body.answer,
    observations: Array.isArray(body.observations) ? body.observations : [],
    interpretation: typeof body.interpretation === 'string' ? body.interpretation : '',
    uncertainty: typeof body.uncertainty === 'string' ? body.uncertainty : '',
    safetyNote: typeof body.safety_note === 'string' ? body.safety_note : '',
    demoMode: Boolean(body.demo_mode),
    model: typeof body.model === 'string' ? body.model : '',
  }
}
