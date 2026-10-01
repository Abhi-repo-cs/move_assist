import { ShieldAlert } from 'lucide-react'

export default function SafetyNotice({ note }) {
  return (
    <aside
      aria-label="Safety notice"
      className="flex gap-3 rounded-2xl border-2 border-warn bg-warn-bg p-4 text-warn"
    >
      <ShieldAlert size={28} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">
          AI-generated guidance can be incorrect. Do not rely on this system alone for physical safety or navigation.
        </p>
        {note && !/can be incorrect/i.test(note) && <p className="mt-1">{note}</p>}
        <p className="mt-1 text-sm">
          MoveAssist is a research prototype. It is not a medical device and does not control any wheelchair or motor.
        </p>
      </div>
    </aside>
  )
}
