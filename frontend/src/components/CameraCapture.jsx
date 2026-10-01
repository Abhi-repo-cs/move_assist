import { useEffect, useState } from 'react'
import { Camera, RotateCcw, Check, X } from 'lucide-react'
import useCamera from '../hooks/useCamera.js'

/** Live camera with capture / retake / use. Calls onUse(file) then closes. */
export default function CameraCapture({ onUse, onClose, onError }) {
  const { videoRef, active, error, start, stop, capture } = useCamera()
  const [shot, setShot] = useState(null) // { file, url }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    start()
  }, [start])

  useEffect(() => () => shot && URL.revokeObjectURL(shot.url), [shot])

  const close = () => {
    stop()
    onClose()
  }

  const take = async () => {
    setBusy(true)
    try {
      const file = await capture()
      setShot({ file, url: URL.createObjectURL(file) })
    } catch (e) {
      onError?.(e.message)
    } finally {
      setBusy(false)
    }
  }

  const use = () => {
    onUse(shot.file)
    stop()
    onClose()
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border-2 border-danger bg-danger-bg p-4 text-danger">
        <p className="font-bold">Camera unavailable</p>
        <p>{error}</p>
        <button type="button" className="btn mt-3" onClick={onClose}>
          <X size={20} aria-hidden="true" /> Close camera
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-rule bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className={`aspect-[4/3] w-full object-cover ${shot ? 'hidden' : ''}`}
        />
        {shot && <img src={shot.url} alt="Captured photo preview" className="aspect-[4/3] w-full object-cover" />}
        {!active && !shot && (
          <p className="absolute inset-0 grid place-items-center text-white">Starting camera…</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {!shot ? (
          <button type="button" className="btn btn-primary" onClick={take} disabled={!active || busy}>
            <Camera size={22} aria-hidden="true" /> Capture photo
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={use}>
              <Check size={22} aria-hidden="true" /> Use this photo
            </button>
            <button type="button" className="btn" onClick={() => setShot(null)}>
              <RotateCcw size={20} aria-hidden="true" /> Retake
            </button>
          </>
        )}
        <button type="button" className="btn" onClick={close}>
          <X size={20} aria-hidden="true" /> Close camera
        </button>
      </div>
    </div>
  )
}
