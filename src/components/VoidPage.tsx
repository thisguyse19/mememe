import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

const VOID_REPLIES = [
  '',
  '…',
  'no',
  'perhaps later',
  'the void has considered your request and chosen violence (silence)',
  'error 0x00000000: meaning not found',
  'your message was eaten. it was crunchy.',
  'we appreciate your outreach. we will not respond.',
  'the council of nothing abstained',
  'have you tried turning your expectations off and on again?',
  'this ticket has been merged into /dev/null',
  'your concern is valid and also irrelevant',
  'the void blinked. you missed it.',
  'scheduled for review: never',
  'thank you for screaming. scream again tomorrow.',
]

const AUTO_ACKS = [
  'Ticket #${n} has entered the void queue (position: ∞).',
  'Your submission was received, deconstructed, and forgotten.',
  'A specialist will not contact you within 3–5 eternities.',
  'Status: voided. Reason: yes.',
  'We have forwarded your concern to a department that does not exist.',
]

const HR_DENIALS = [
  'PTO denied — the void requires your presence Mon–Fri.',
  'Your vacation days have evaporated (policy 0.0).',
  'Request denied. Have you considered quiet quitting the void?',
  'The void is currently out of office until heat death.',
]

const METRIC_LABELS = ['Hope', 'Purpose', 'Joy', 'Clarity', 'Sleep', 'Will'] as const

type Particle = { x: number; y: number; vx: number; vy: number; life: number; hue: number }
type Tab = 'portal' | 'scream' | 'metrics' | 'oracle' | 'hr' | 'archive'
type Ticket = { id: number; text: string; at: string; status: 'voided' | 'ignored' | 'escalated to nowhere' }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function VoidEye() {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy) || 1
      const max = 10
      setOffset({ x: (dx / dist) * max, y: (dy / dist) * max })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={ref}
      className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-black shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(255,255,255,0.03)]"
      aria-hidden="true"
    >
      <div
        className="h-3 w-3 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
    </div>
  )
}

function ScreamCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        raf = requestAnimationFrame(tick)
        return
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = rect.width
      const h = rect.height
      const cx = w / 2
      const cy = h / 2

      if (activeRef.current && particlesRef.current.length < 180) {
        for (let i = 0; i < 4; i++) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * w * 0.5,
            y: h + 4,
            vx: (Math.random() - 0.5) * 40,
            vy: -(80 + Math.random() * 120),
            life: 1,
            hue: 260 + Math.random() * 40,
          })
        }
      }

      ctx.fillStyle = 'rgba(2, 2, 6, 0.35)'
      ctx.fillRect(0, 0, w, h)

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.42)
      grad.addColorStop(0, 'rgba(0,0,0,0.95)')
      grad.addColorStop(0.6, 'rgba(20,10,40,0.4)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, Math.min(w, h) * 0.42, 0, Math.PI * 2)
      ctx.fill()

      particlesRef.current = particlesRef.current.filter((p) => {
        const dx = cx - p.x
        const dy = cy - p.y
        const dist = Math.hypot(dx, dy) || 1
        const pull = 140 / (dist * 0.08 + 1)
        p.vx += (dx / dist) * pull * dt
        p.vy += (dy / dist) * pull * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt * 0.35

        if (dist < 18 || p.life <= 0) return false

        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.life * 0.7})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2 + p.life, 0, Math.PI * 2)
        ctx.fill()
        return true
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="void-scream-canvas h-48 w-full rounded-xl"
      aria-label="Scream into the void visualization"
    />
  )
}

export function VoidPage() {
  const [tab, setTab] = useState<Tab>('portal')
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', concern: '', urgency: 'low', soul: false })
  const [toast, setToast] = useState<string | null>(null)
  const [screaming, setScreaming] = useState(false)
  const [screamCount, setScreamCount] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Record<(typeof METRIC_LABELS)[number], number>>({
    Hope: 3,
    Purpose: 7,
    Joy: 2,
    Clarity: 1,
    Sleep: 4,
    Will: 0,
  })
  const [suggestion, setSuggestion] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ptoReason, setPtoReason] = useState('')
  const [blinkLost, setBlinkLost] = useState(false)
  const [voidCountdown, setVoidCountdown] = useState(999)
  const ticketId = useRef(1000)

  const showToast = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(null), 4200)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setMetrics((m) => {
        const next = { ...m }
        for (const k of METRIC_LABELS) {
          next[k] = Math.max(0, Math.min(10, next[k] + (Math.random() - 0.55) * 2))
        }
        return next
      })
    }, 1800)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setVoidCountdown((c) => {
        if (c <= 1) return 999 + Math.floor(Math.random() * 500)
        return c - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!screaming) return
    const id = window.setInterval(() => setScreamCount((c) => c + 1), 400)
    return () => window.clearInterval(id)
  }, [screaming])

  const submitPortal = () => {
    const id = ++ticketId.current
    const ticket: Ticket = {
      id,
      text: form.concern || '(empty scream)',
      at: new Date().toLocaleTimeString(),
      status: pick(['voided', 'ignored', 'escalated to nowhere'] as const),
    }
    setTickets((t) => [ticket, ...t].slice(0, 12))
    showToast(pick(AUTO_ACKS).replace('${n}', String(id)))
    setStep(0)
    setForm({ name: '', concern: '', urgency: 'low', soul: false })
  }

  const askVoid = () => {
    if (!question.trim()) {
      setAnswer('…')
      return
    }
    setAnswer(pick(VOID_REPLIES))
  }

  const requestPto = () => {
    showToast(pick(HR_DENIALS))
    setPtoReason('')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'portal', label: 'Portal' },
    { id: 'scream', label: 'Scream' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'oracle', label: 'Oracle' },
    { id: 'hr', label: 'Void HR' },
    { id: 'archive', label: 'Archive' },
  ]

  return (
    <motion.main
      className="relative z-0 min-h-dvh overflow-x-hidden pb-28 pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="void-stars pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/25">department of nothing</p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-white/90 sm:text-3xl">The Void™</h1>
          <p className="mt-2 text-xs text-white/35">Customer experience · existential tier support</p>
          <div className="mt-6">
            <VoidEye />
          </div>
          <p className="mt-4 text-[11px] text-white/30">
            Nothing arrives in {voidCountdown}… maybe
          </p>
        </header>

        <div className="mb-4 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`void-tab ${tab === t.id ? 'void-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'portal' && (
            <motion.section
              key="portal"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Submit to the void</h2>
              <p className="mt-1 text-xs text-white/40">Multi-step intake · guaranteed non-resolution</p>

              <div className="mt-4 flex gap-1">
                {[0, 1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-white/40' : 'bg-white/10'}`}
                  />
                ))}
              </div>

              {step === 0 && (
                <div className="mt-5">
                  <label className="text-xs text-white/50">Your name (optional, ignored either way)</label>
                  <input
                    className="void-input mt-1.5 w-full"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Anonymous Coward"
                  />
                </div>
              )}
              {step === 1 && (
                <div className="mt-5">
                  <label className="text-xs text-white/50">Describe your concern</label>
                  <textarea
                    className="void-input mt-1.5 min-h-24 w-full resize-none"
                    value={form.concern}
                    onChange={(e) => setForm((f) => ({ ...f, concern: e.target.value }))}
                    placeholder="Everything is fine and also terrible…"
                  />
                </div>
              )}
              {step === 2 && (
                <div className="mt-5">
                  <label className="text-xs text-white/50">Urgency</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['low', 'medium', 'screaming', 'cosmic'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={`void-btn ${form.urgency === u ? 'void-btn--active' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, urgency: u }))}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="mt-5">
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input
                      type="checkbox"
                      checked={form.soul}
                      onChange={(e) => setForm((f) => ({ ...f, soul: e.target.checked }))}
                      className="accent-white/50"
                    />
                    Attach soul to ticket (non-refundable)
                  </label>
                  <p className="mt-3 text-xs text-white/35">
                    By submitting you agree that the void owes you nothing and you knew that already.
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {step > 0 && (
                  <button type="button" className="void-btn" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" className="void-btn void-btn--primary flex-1" onClick={() => setStep((s) => s + 1)}>
                    Continue into uncertainty
                  </button>
                ) : (
                  <button type="button" className="void-btn void-btn--primary flex-1" onClick={submitPortal}>
                    Submit &amp; forget
                  </button>
                )}
              </div>
            </motion.section>
          )}

          {tab === 'scream' && (
            <motion.section
              key="scream"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Scream into the void</h2>
              <p className="mt-1 text-xs text-white/40">Hold the button. Feel slightly better. Repeat.</p>
              <div className="mt-4">
                <ScreamCanvas active={screaming} />
              </div>
              <button
                type="button"
                className={`void-btn void-btn--scream mt-4 w-full py-4 text-base ${screaming ? 'void-btn--active' : ''}`}
                onPointerDown={() => setScreaming(true)}
                onPointerUp={() => setScreaming(false)}
                onPointerLeave={() => setScreaming(false)}
              >
                {screaming ? 'AAAAAAHHHHH' : 'Hold to scream'}
              </button>
              <p className="mt-3 text-center text-xs text-white/35">
                Screams absorbed: {screamCount} · Void satisfaction: null
              </p>

              <div className="void-card mt-4 border-white/5 bg-black/40 p-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Staring contest</h3>
                <p className="mt-2 text-xs text-white/35">Do not blink. The void is competitive.</p>
                <button
                  type="button"
                  className="void-btn mt-3 w-full"
                  onClick={() => {
                    setBlinkLost(true)
                    window.setTimeout(() => setBlinkLost(false), 2400)
                  }}
                >
                  I blinked (coward)
                </button>
                <AnimatePresence>
                  {blinkLost && (
                    <motion.p
                      className="mt-3 text-center text-sm text-rose-300/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      You lose. The void did not blink. It has no eyelids.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {tab === 'metrics' && (
            <motion.section
              key="metrics"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Void KPI dashboard</h2>
              <p className="mt-1 text-xs text-white/40">Real-time metrics · accuracy not guaranteed</p>
              <ul className="mt-5 space-y-3">
                {METRIC_LABELS.map((label) => (
                  <li key={label}>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>{label}</span>
                      <span className="tabular-nums text-white/70">
                        {metrics[label] < 0.5 ? 'null' : metrics[label].toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-white/10 to-white/40"
                        animate={{ width: `${metrics[label] * 10}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <p className="text-2xl font-light text-white/80">NaN</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Meaning</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <p className="text-2xl font-light text-white/80">404</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Answers</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <p className="text-2xl font-light text-white/80">∞</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Queue depth</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <p className="text-2xl font-light text-white/80">0</p>
                  <p className="text-[10px] uppercase tracking-widest text-white/30">Fucks given</p>
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'oracle' && (
            <motion.section
              key="oracle"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Ask the void</h2>
              <p className="mt-1 text-xs text-white/40">One question · one unhelpful answer</p>
              <textarea
                className="void-input mt-4 min-h-24 w-full resize-none"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Will it get better?"
              />
              <button type="button" className="void-btn void-btn--primary mt-3 w-full" onClick={askVoid}>
                Consult the abyss
              </button>
              <AnimatePresence>
                {answer !== null && (
                  <motion.div
                    className="mt-5 rounded-xl border border-white/10 bg-black/50 p-5 text-center"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">The void says</p>
                    <p className="mt-3 text-lg font-light text-white/85">
                      {answer || '(silence)'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Suggestion box</h3>
                <p className="mt-1 text-[11px] text-white/30">Text fades as you type — the void is already taking it.</p>
                <textarea
                  className="void-input void-input--fade mt-2 min-h-20 w-full resize-none"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="We should improve…"
                  style={{ opacity: Math.max(0.15, 1 - suggestion.length * 0.025) }}
                />
              </div>
            </motion.section>
          )}

          {tab === 'hr' && (
            <motion.section
              key="hr"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Void Human Resources</h2>
              <p className="mt-1 text-xs text-white/40">Policy 0.0 · No benefits · Infinite onboarding</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Request PTO</h3>
                  <input
                    className="void-input mt-2 w-full"
                    value={ptoReason}
                    onChange={(e) => setPtoReason(e.target.value)}
                    placeholder="Reason (ignored)"
                  />
                  <button type="button" className="void-btn mt-3 w-full" onClick={requestPto}>
                    Submit request
                  </button>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Performance review</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    You met expectations by continuing to exist. Promotion denied — no ladder, only pit.
                  </p>
                  <button
                    type="button"
                    className="void-btn mt-3 w-full"
                    onClick={() => showToast('Feedback noted. File discarded.')}
                  >
                    Acknowledge feedback
                  </button>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Delete yourself from the void</h3>
                  <p className="mt-2 text-xs text-white/40">This button does nothing. Like most buttons.</p>
                  <button
                    type="button"
                    className="void-btn void-btn--danger mt-3 w-full"
                    onClick={() => showToast('Deletion failed: entity too interesting.')}
                  >
                    Delete me
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'archive' && (
            <motion.section
              key="archive"
              className="void-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="void-card-title">Void archive</h2>
              <p className="mt-1 text-xs text-white/40">Every ticket ends the same way</p>
              {tickets.length === 0 ? (
                <p className="mt-8 text-center text-sm text-white/30">No submissions yet. The void is patient.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {tickets.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-lg border border-white/8 bg-black/30 px-3 py-2.5 text-sm"
                    >
                      <div className="flex justify-between text-[10px] text-white/35">
                        <span>#{t.id}</span>
                        <span>{t.at}</span>
                      </div>
                      <p className="mt-1 text-white/55 line-through decoration-white/20">{t.text}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">{t.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-10 pb-6 text-center text-[10px] text-white/20">
          The Void™ is a registered absence. © nothing.
        </footer>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="void-toast fixed bottom-24 left-1/2 z-30 max-w-sm -translate-x-1/2 px-4 py-3 text-center text-xs text-white/80"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
