export default function StatusPill({ health, checking }) {
  let label = 'Server offline'
  let dot = 'bg-danger'
  let tone = 'border-danger text-danger bg-danger-bg'
  if (checking) {
    label = 'Connecting'
    dot = 'bg-muted'
    tone = 'border-rule text-muted bg-white'
  } else if (health?.demo_mode) {
    label = 'Demo Mode'
    dot = 'bg-warn'
    tone = 'border-warn text-warn bg-warn-bg'
  } else if (health?.ai_configured) {
    label = 'AI Ready'
    dot = 'bg-ok'
    tone = 'border-ok text-ok bg-white'
  } else if (health) {
    label = 'AI not configured'
    dot = 'bg-danger'
    tone = 'border-danger text-danger bg-danger-bg'
  }
  return (
    <p
      role="status"
      aria-label={`System status: ${label}`}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-bold ${tone}`}
    >
      <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-full ${dot}`} />
      {label}
    </p>
  )
}
