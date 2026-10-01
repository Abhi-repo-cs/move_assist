import { ArrowDown, BookOpen } from 'lucide-react'

const STAGES = ['Foundation model', 'Perception + reasoning', 'Interactive interface', 'Accessible feedback']

export default function ResearchContext() {
  return (
    <section className="card" aria-labelledby="research-h">
      <h2 id="research-h" className="mb-2 flex items-center gap-2 text-2xl font-bold">
        <BookOpen size={24} aria-hidden="true" /> Research context
      </h2>
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="max-w-prose">
          <p>
            MoveAssist is a research prototype inspired by the reviewed design space of foundation-model-powered
            interactive assistive technologies.
          </p>
          <p className="mt-2 text-muted">
            It is not one of the systems reviewed in the paper "AI That Moves With You: A Review of Interactive
            Technologies Powered by Large Foundation Models for Mobility Impairment".
          </p>
        </div>
        <ol aria-label="Design space flow" className="m-0 flex list-none flex-col items-center gap-1 p-0">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1">
              <span className="rounded-xl border-2 border-rule bg-mist px-4 py-2 font-bold">{s}</span>
              {i < STAGES.length - 1 && <ArrowDown size={18} className="text-iris" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
