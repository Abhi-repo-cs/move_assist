import { Eye, Lightbulb, CircleHelp, Volume2, VolumeX, TriangleAlert } from 'lucide-react'

function confidenceWord(c) {
  if (typeof c !== 'number') return 'unknown'
  if (c >= 0.75) return 'higher'
  if (c >= 0.45) return 'moderate'
  return 'low'
}

function Part({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border-2 border-rule bg-mist p-4">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-iris-dark">
        <Icon size={20} aria-hidden="true" /> {title}
      </h3>
      {children}
    </section>
  )
}

export default function ResponsePanel({ result, loading, error, tts, autoRead, onAutoRead }) {
  const spoken = result ? `${result.answer} ${result.uncertainty}`.trim() : ''

  return (
    <section className="card" aria-labelledby="resp-h">
      <h2 id="resp-h" className="mb-4 text-2xl font-bold">Response</h2>

      <div aria-live="polite" aria-atomic="false">
        {loading && <p className="text-lg text-muted">Analyzing your image…</p>}

        {!loading && error && (
          <p role="alert" className="rounded-xl border-2 border-danger bg-danger-bg p-4 text-lg font-bold text-danger">
            {error}
          </p>
        )}

        {!loading && !error && !result && (
          <p className="text-lg text-muted">
            Add an image, ask a question, then choose Analyze environment. The answer will appear here.
          </p>
        )}

        {!loading && result && (
          <div>
            {result.demoMode && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-lg border-2 border-warn bg-warn-bg px-3 py-1 font-bold text-warn">
                <TriangleAlert size={18} aria-hidden="true" /> Demo response. Not based on your image.
              </p>
            )}
            <p className="text-2xl font-bold leading-snug sm:text-3xl" data-testid="answer">{result.answer}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {tts.supported ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => (tts.speaking ? tts.cancel() : tts.speak(spoken))}
                >
                  {tts.speaking ? <VolumeX size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
                  {tts.speaking ? 'Stop reading' : 'Read aloud'}
                </button>
              ) : (
                <p className="text-muted">Read aloud is not supported in this browser.</p>
              )}
              {tts.supported && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRead}
                    onChange={(e) => onAutoRead(e.target.checked)}
                    className="h-5 w-5 accent-iris"
                  />
                  Read new answers automatically
                </label>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              <Part icon={Eye} title="Observed">
                {result.observations.length ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {result.observations.map((o, i) => (
                      <li key={i}>
                        {o.object}, {o.relative_position || 'position unclear'}
                        <span className="text-muted"> (model confidence: {confidenceWord(o.confidence)})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No specific objects were reported.</p>
                )}
              </Part>
              {result.interpretation && (
                <Part icon={Lightbulb} title="Interpretation">
                  <p>{result.interpretation}</p>
                </Part>
              )}
              <Part icon={CircleHelp} title="Uncertainty">
                <p>{result.uncertainty || 'The image alone cannot confirm that the surroundings are safe.'}</p>
              </Part>
            </div>
            <p className="mt-4 text-sm text-muted">
              Source: {result.model === 'demo' ? 'fixed demo example' : result.model || 'AI model'}. Confidence words are
              the model's own rough estimate, not a measurement.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
