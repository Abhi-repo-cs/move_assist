import { useCallback, useEffect, useRef, useState } from 'react'

function describeError(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission was denied. Allow camera access in your browser settings, or upload an image instead.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device. You can upload an image instead.'
    case 'NotReadableError':
      return 'The camera is in use by another app. Close it and try again.'
    default:
      return 'The camera could not be started. You can upload an image instead.'
  }
}

export default function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not support camera access here. Camera needs HTTPS or localhost. You can upload an image instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setActive(true)
    } catch (err) {
      setError(describeError(err))
    }
  }, [])

  useEffect(() => {
    if (active && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play?.().catch(() => {})
    }
  }, [active])

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

  /** Grab the current frame as a JPEG File (max 1280px wide). */
  const capture = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) {
      return Promise.reject(new Error('The camera is not ready yet. Wait a moment and try again.'))
    }
    const scale = Math.min(1, 1280 / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
            : reject(new Error('Could not capture the photo. Please try again.')),
        'image/jpeg',
        0.9
      )
    })
  }, [])

  return { videoRef, active, error, start, stop, capture }
}
