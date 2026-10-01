import { Compass } from 'lucide-react'
import StatusPill from './StatusPill.jsx'

export default function Header({ health, checking }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-8 pb-4 sm:px-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-iris to-violet text-white"
        >
          <Compass size={30} />
        </span>
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">MoveAssist</h1>
          <p className="text-lg text-muted">AI Mobility Assistant · research prototype</p>
        </div>
      </div>
      <StatusPill health={health} checking={checking} />
    </header>
  )
}
