import { Mic, MicOff, ScanSearch, Loader2 } from 'lucide-react'
import { MAX_QUESTION_CHARS } from '../services/validation.js'

const EXAMPLES = [
  'What is ahead of me?',
  'Describe the environment.',
  'Is there an obstacle visible?',
  'Where is the doorway?',
  'What objects are around me?',
]

export default function QuestionPanel({
  question, onQuestion, mode, onMode, onSubmit, loading, error, speech,
}) {
  return (
    <section className="card" aria-labelledby="ask-h">
      <h2 id="ask-h" className="mb-4 text-2xl font-bold">Ask MoveAssist</h2>

      <label htmlFor="question" className="mb-2 block text-lg font-bold">Your question</label>
      <textarea
        id="question"
        rows={3}
        maxLength={MAX_QUESTION_CHARS}
        value={question}
        onChange={(e) => onQuestion(e.target.value)}
        placeholder="What is ahead of me?"
        aria-describedby="question-hint"
        className="w-full rounded-xl border-2 border-rule bg-white p-3 text-lg"
      />
      <p id="question-hint" className="mt-1 text-sm text-muted">
        Type a question or use the voice button. Up to {MAX_QUESTION_CHARS} characters.
      </p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Example questions">
        {EXAMPLES.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => onQuestion(q)}>{q}</button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`btn ${speech.listening ? 'btn-listening' : ''}`}
          onClick={speech.listening ? speech.stop : speech.start}
          aria-pressed={speech.listening}
        >
          {speech.listening ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
          {speech.listening ? 'Stop listening' : 'Speak your question'}
        </button>
        <span aria-live="polite" className="font-bold text-iris-dark">
          {speech.listening ? 'Listening…' : ''}
        </span>
      </div>
      {speech.error && (
        <p role="alert" className="mt-3 rounded-xl border-2 border-danger bg-danger-bg p-3 font-bold text-danger">
          {speech.error}
        </p>
      )}

      <fieldset className="mt-6">
        <legend className="mb-2 text-lg font-bold">Response length</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['concise', 'Concise', '1–2 sentences'],
            ['detailed', 'Detailed', 'More context'],
          ].map(([value, label, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-violet ${
                mode === value ? 'border-iris bg-mist' : 'border-rule bg-white'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => onMode(value)}
                  className="h-5 w-5 accent-iris"
                />
                {label}
              </span>
              <span className="ml-7 text-sm text-muted">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border-2 border-danger bg-danger-bg p-3 font-bold text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary mt-6 w-full text-xl"
        onClick={onSubmit}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <Loader2 size={24} className="spin" aria-hidden="true" /> : <ScanSearch size={24} aria-hidden="true" />}
        {loading ? 'Analyzing…' : 'Analyze environment'}
      </button>
    </section>
  )
}
