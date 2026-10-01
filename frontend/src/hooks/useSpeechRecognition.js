import { useCallback, useEffect, useRef, useState } from 'react'

const Recognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export default function useSpeechRecognition(onResult) {
  const supported = Boolean(Recognition)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const cbRef = useRef(onResult)
  cbRef.current = onResult

  const stop = useCallback(() => recRef.current?.stop(), [])

  const start = useCallback(() => {
    setError('')
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge, or type your question.')
      return
    }
    try {
      const rec = new Recognition()
      rec.lang = navigator.language || 'en-US'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript
        if (text) cbRef.current(text.trim())
      }
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError('Microphone permission was denied. Allow microphone access, or type your question.')
        } else if (e.error === 'no-speech') {
          setError('No speech was heard. Try again, or type your question.')
        } else if (e.error !== 'aborted') {
          setError('Voice input failed. Try again, or type your question.')
        }
      }
      rec.onend = () => setListening(false)
      recRef.current = rec
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
      setError('Voice input could not be started. Type your question instead.')
    }
  }, [])

  useEffect(() => () => recRef.current?.abort?.(), [])

  return { supported, listening, error, start, stop }
}
