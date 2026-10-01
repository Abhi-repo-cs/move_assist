export const MAX_IMAGE_MB = 8
export const MAX_QUESTION_CHARS = 500
export const ALLOWED_TYPES = ['image/jpeg', 'image/png']

export function validateImage(file) {
  if (!file) return 'Add an image first: upload one or use the camera.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Unsupported file. Use a JPG or PNG image.'
  if (file.size === 0) return 'That image file is empty.'
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `That image is larger than ${MAX_IMAGE_MB} MB. Choose a smaller one.`
  return null
}

export function validateQuestion(text) {
  const q = (text || '').trim()
  if (!q) return 'Type or speak a question first, for example: "What is ahead of me?"'
  if (q.length > MAX_QUESTION_CHARS) return `Keep your question under ${MAX_QUESTION_CHARS} characters.`
  return null
}
