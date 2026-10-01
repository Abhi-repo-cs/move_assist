import { useRef, useState } from 'react'
import { ImageUp, Camera, Trash2, ImageIcon } from 'lucide-react'
import CameraCapture from './CameraCapture.jsx'

export default function ImagePanel({ image, error, onSelect, onRemove, onError }) {
  const inputRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  return (
    <section className="card" aria-labelledby="surroundings-h">
      <h2 id="surroundings-h" className="mb-1 text-2xl font-bold">Your surroundings</h2>
      <p className="mb-4 text-muted">Upload a JPG or PNG, or take a photo with your camera.</p>

      {!cameraOpen && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
            <ImageUp size={22} aria-hidden="true" /> Upload image
          </button>
          <button type="button" className="btn" onClick={() => setCameraOpen(true)}>
            <Camera size={22} aria-hidden="true" /> Use camera
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            aria-label="Choose an image file"
            tabIndex={-1}
            data-testid="file-input"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onSelect(f)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {cameraOpen && (
        <CameraCapture
          onUse={(file) => onSelect(file)}
          onClose={() => setCameraOpen(false)}
          onError={onError}
        />
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-danger bg-danger-bg p-3 font-bold text-danger">
          {error}
        </p>
      )}

      {!cameraOpen && (
        <div className="mt-5">
          {image ? (
            <figure>
              <img
                src={image.url}
                alt="The image you selected, which will be analyzed"
                className="max-h-96 w-full rounded-2xl border-2 border-rule bg-mist object-contain"
              />
              <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="break-all text-muted">{image.file.name}</span>
                <button type="button" className="btn" onClick={onRemove}>
                  <Trash2 size={20} aria-hidden="true" /> Remove image
                </button>
              </figcaption>
            </figure>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-rule bg-mist p-6 text-center text-muted">
              <div>
                <ImageIcon className="mx-auto mb-2" size={32} aria-hidden="true" />
                No image yet
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
