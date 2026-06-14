import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
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
  'yes but actually no but actually yes but no',
  'the answer was inside you all along (it was gas)',
  'ask again when the heat death finishes',
  'we ran your question through AI and it quit',
  'congrats you unlocked: more of this',
]

const AUTO_ACKS = [
  'Ticket #${n} has entered the void queue (position: ∞).',
  'Your submission was received, deconstructed, and forgotten.',
  'A specialist will not contact you within 3–5 eternities.',
  'Status: voided. Reason: yes.',
  'We have forwarded your concern to a department that does not exist.',
  'Your ticket was closed as duplicate of ticket #${n}.',
  'Auto-reply: Have you tried accepting the void into your heart?',
]

const HR_DENIALS = [
  'PTO denied — the void requires your presence Mon–Fri.',
  'Your vacation days have evaporated (policy 0.0).',
  'Request denied. Have you considered quiet quitting the void?',
  'The void is currently out of office until heat death.',
  'Denied: insufficient suffering on file.',
  'Your PTO was approved in a parallel universe. Not this one.',
]

const WHISPERS = [
  '…did you hear that?',
  'the void is thinking about you (judgmentally)',
  'your tabs are showing',
  'someone is wrong on the internet',
  'it is always 3am somewhere in your soul',
  'remember that thing from 2014?',
  'you left the stove on (you didn\'t)',
  'a goose knows your name',
  'this page is also screaming',
]

const IVR_LINES = [
  { key: '1', label: 'Billing & despair', result: 'You owe $∞. Payment declined by universe.' },
  { key: '2', label: 'Technical support', result: 'Have you tried not existing?' },
  { key: '3', label: 'Scream extension', result: 'Connecting you to scream… *click*' },
  { key: '4', label: 'Speak to a manager', result: 'Manager is also the void. Still unavailable.' },
  { key: '5', label: 'Cancel subscription', result: 'Cancellation requires 47 forms. Form 1 of 47: please hold.' },
  { key: '0', label: 'Operator', result: 'All operators are conceptual. Estimated wait: forever.' },
  { key: '9', label: 'Repeat menu', result: 'MENU REPEATED. Nothing changed. Shocking.' },
]

const CHAT_REPLIES = [
  'Hi! I\'m VoidBot™. How can I not help you today?',
  'I understand your frustration. I do not care, but I understand.',
  'Let me escalate this to a higher plane of indifference.',
  'Please hold while I pretend to type…',
  'That sounds like a YOU problem (affectionately).',
  'Have you tried closing your eyes and opening them again?',
  'I\'m transferring you to Gary. Gary is a concept.',
  'Your chat session will expire in 0 seconds.',
]

const BINGO_CELLS = [
  '3am spiral',
  'reply all',
  'existential drip',
  'main character',
  'touch grass (refused)',
  'doomscroll',
  'imposter syndrome',
  'free trial of dread',
  'one more episode',
  'forgot why I came',
  'open tab purgatory',
  'quiet quitting',
  'delulu era',
  'brain fog',
  'weird dream',
  'snack instead',
  'void stare',
  'cancel plans',
  'it\'s fine (lying)',
  'send tweet delete',
  'wrong meeting',
  'low battery panic',
  'read receipts',
  'npc mode',
]

const SCREAM_WORDS = ['WHY', 'MONDAY', 'HELP', 'NOPE', 'AAAA', 'SEND', 'COFFEE', 'EXIST']

const METRIC_LABELS = ['Hope', 'Purpose', 'Joy', 'Clarity', 'Sleep', 'Will', 'Spite', 'Snacks'] as const

type Particle = { x: number; y: number; vx: number; vy: number; life: number; hue: number; word?: string }
type Tab = 'portal' | 'scream' | 'phone' | 'metrics' | 'oracle' | 'cult' | 'hr' | 'archive'
type Ticket = { id: number; text: string; at: string; status: string }

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function VoidEye({ dread }: { dread: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const pupilX = useSpring(0, { stiffness: 90, damping: 14 })
  const pupilY = useSpring(0, { stiffness: 90, damping: 14 })
  const [twitch, setTwitch] = useState(false)

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
      const max = 12 + dread * 0.04
      pupilX.set((dx / dist) * max)
      pupilY.set((dy / dist) * max)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [dread, pupilX, pupilY])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() > 0.7) {
        setTwitch(true)
        window.setTimeout(() => setTwitch(false), 120)
      }
    }, 2200)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative mx-auto">
      <div
        ref={ref}
        className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/15 bg-black shadow-[0_0_80px_rgba(255,255,255,0.06),inset_0_0_40px_rgba(255,255,255,0.02)] ${twitch ? 'void-eye-twitch' : ''}`}
        aria-hidden="true"
      >
        <motion.div
          className="relative h-14 w-14 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500"
          style={{ x: pupilX, y: pupilY }}
        >
          <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black" />
          <div className="absolute left-[58%] top-[32%] h-2 w-2 rounded-full bg-white/90" />
        </motion.div>
      </div>
      {dread > 60 && (
        <motion.p
          className="mt-2 text-[10px] uppercase tracking-[0.4em] text-rose-300/50"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          it sees you seeing it
        </motion.p>
      )}
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
    let wordT = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      wordT += dt

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

      if (activeRef.current && particlesRef.current.length < 220) {
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * w * 0.6,
            y: h + 4,
            vx: (Math.random() - 0.5) * 60,
            vy: -(90 + Math.random() * 140),
            life: 1,
            hue: 250 + Math.random() * 50,
          })
        }
        if (wordT > 0.25) {
          wordT = 0
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 80,
            y: h * 0.7,
            vx: (Math.random() - 0.5) * 30,
            vy: -(40 + Math.random() * 60),
            life: 1.4,
            hue: 0,
            word: pick(SCREAM_WORDS),
          })
        }
      }

      ctx.fillStyle = 'rgba(2, 2, 6, 0.4)'
      ctx.fillRect(0, 0, w, h)

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45)
      grad.addColorStop(0, 'rgba(0,0,0,0.98)')
      grad.addColorStop(0.5, 'rgba(30,10,50,0.5)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, Math.min(w, h) * 0.45, 0, Math.PI * 2)
      ctx.fill()

      particlesRef.current = particlesRef.current.filter((p) => {
        const dx = cx - p.x
        const dy = cy - p.y
        const dist = Math.hypot(dx, dy) || 1
        const pull = 160 / (dist * 0.07 + 1)
        p.vx += (dx / dist) * pull * dt
        p.vy += (dy / dist) * pull * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt * (p.word ? 0.25 : 0.35)

        if (dist < 16 || p.life <= 0) return false

        if (p.word) {
          ctx.font = 'bold 11px ui-monospace, monospace'
          ctx.fillStyle = `rgba(251, 113, 133, ${p.life * 0.85})`
          ctx.fillText(p.word, p.x - 16, p.y)
        } else {
          ctx.fillStyle = `hsla(${p.hue}, 65%, 68%, ${p.life * 0.75})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2 + p.life, 0, Math.PI * 2)
          ctx.fill()
        }
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
      className="void-scream-canvas h-52 w-full rounded-xl"
      aria-label="Scream into the void visualization"
    />
  )
}

function RunawayButton({ onCatch }: { onCatch: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const caughtRef = useRef(0)

  const flee = () => {
    const box = boxRef.current
    if (!box) return
    const bw = box.clientWidth - 120
    const bh = box.clientHeight - 44
    setPos({ x: 10 + Math.random() * Math.max(20, bw), y: 10 + Math.random() * Math.max(20, bh) })
  }

  return (
    <div ref={boxRef} className="relative mt-3 h-28 overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/40">
      <motion.button
        ref={btnRef}
        type="button"
        className="void-btn void-btn--danger absolute whitespace-nowrap text-xs"
        style={{ left: pos.x, top: pos.y }}
        onPointerEnter={flee}
        onClick={() => {
          caughtRef.current += 1
          if (caughtRef.current >= 5) onCatch()
          else flee()
        }}
      >
        Unsubscribe from existence
      </motion.button>
      <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/25">
        catch it 5 times to quit (you won&apos;t)
      </p>
    </div>
  )
}

function MeaningCaptcha({ onDone }: { onDone: (passed: boolean) => void }) {
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [msg, setMsg] = useState<string | null>(null)
  const [tiles] = useState(() => shuffle([...Array(9).keys()]))

  const verify = () => {
    if (picked.size === 0) {
      setMsg('Select tiles containing meaning. Good luck.')
      return
    }
    setMsg(pick([
      'Incorrect. Meaning was not found.',
      'Close! You selected vibes instead.',
      'CAPTCHA failed: existence unverified.',
      'The void accepts your guess and rejects it.',
    ]))
    onDone(false)
    window.setTimeout(() => {
      setPicked(new Set())
      setMsg(null)
    }, 1800)
  }

  return (
    <div>
      <p className="text-xs text-white/45">Select all squares containing <strong className="text-white/70">meaning</strong></p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <button
            key={t}
            type="button"
            className={`aspect-square rounded-lg border text-[10px] transition ${picked.has(t) ? 'border-white/40 bg-white/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
            style={{ backgroundColor: picked.has(t) ? undefined : `hsla(${t * 40}, 30%, ${25 + t * 5}%, 0.5)` }}
            onClick={() =>
              setPicked((s) => {
                const n = new Set(s)
                if (n.has(t)) n.delete(t)
                else n.add(t)
                return n
              })
            }
          >
            {picked.has(t) ? '?' : ''}
          </button>
        ))}
      </div>
      <button type="button" className="void-btn mt-3 w-full" onClick={verify}>
        Verify my soul
      </button>
      {msg && <p className="mt-2 text-center text-xs text-rose-300/70">{msg}</p>}
    </div>
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
    Hope: 3, Purpose: 7, Joy: 2, Clarity: 1, Sleep: 4, Will: 0, Spite: 6, Snacks: 8,
  })
  const [suggestion, setSuggestion] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ptoReason, setPtoReason] = useState('')
  const [blinkLost, setBlinkLost] = useState(false)
  const [voidCountdown, setVoidCountdown] = useState(999)
  const [dread, setDread] = useState(22)
  const [whisper, setWhisper] = useState<string | null>(null)
  const [ivrLog, setIvrLog] = useState<string[]>([])
  const [holdSec, setHoldSec] = useState(0)
  const [onHold, setOnHold] = useState(false)
  const [chat, setChat] = useState<{ from: 'you' | 'bot'; text: string }[]>([
    { from: 'bot', text: CHAT_REPLIES[0] },
  ])
  const [chatInput, setChatInput] = useState('')
  const [tithe, setTithe] = useState(0)
  const [chanting, setChanting] = useState(false)
  const [chantPct, setChantPct] = useState(0)
  const [bingo, setBingo] = useState(() => shuffle(BINGO_CELLS).slice(0, 9))
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [glitchTitle, setGlitchTitle] = useState('The Void™')
  const [voidDice, setVoidDice] = useState<number | null>(null)
  const [summonedGary, setSummonedGary] = useState(false)
  const ticketId = useRef(1000)
  const shakeX = useMotionValue(0)

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
      setVoidCountdown((c) => (c <= 1 ? 999 + Math.floor(Math.random() * 500) : c - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setWhisper(pick(WHISPERS))
      window.setTimeout(() => setWhisper(null), 2800)
    }, 9000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const chars = 'VOID™☠️👁️'
    const id = window.setInterval(() => {
      if (Math.random() > 0.6) {
        let g = 'The Void™'
        for (let i = 0; i < g.length; i++) {
          if (Math.random() > 0.75) g = g.slice(0, i) + chars[Math.floor(Math.random() * chars.length)] + g.slice(i + 1)
        }
        setGlitchTitle(g)
        window.setTimeout(() => setGlitchTitle('The Void™'), 180)
      }
    }, 2400)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!screaming) return
    const id = window.setInterval(() => {
      setScreamCount((c) => c + 1)
      setDread((d) => Math.min(100, d + 1))
      shakeX.set((Math.random() - 0.5) * 6)
    }, 350)
    return () => {
      window.clearInterval(id)
      shakeX.set(0)
    }
  }, [screaming, shakeX])

  useEffect(() => {
    if (!onHold) return
    const id = window.setInterval(() => setHoldSec((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [onHold])

  const toggleBingo = (i: number) => {
    setMarked((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      if (n.size === 9) {
        showToast('VOID BINGO. You win nothing. Beautiful.')
        window.setTimeout(() => {
          setMarked(new Set())
          setBingo(shuffle(BINGO_CELLS).slice(0, 9))
        }, 2000)
      }
      return n
    })
  }

  const submitPortal = () => {
    setLoadingSubmit(true)
    window.setTimeout(() => {
      setLoadingSubmit(false)
      const id = ++ticketId.current
      const statuses = ['voided', 'ignored', 'escalated to nowhere', 'eaten', 'forwarded to Gary', 'lost in couch cushions']
      const ticket: Ticket = {
        id,
        text: form.concern || '(empty scream)',
        at: new Date().toLocaleTimeString(),
        status: pick(statuses),
      }
      setTickets((t) => [ticket, ...t].slice(0, 15))
      showToast(pick(AUTO_ACKS).replace(/\$\{n\}/g, String(id)))
      setStep(0)
      setForm({ name: '', concern: '', urgency: 'low', soul: false })
      setDread((d) => Math.min(100, d + 8))
    }, 2200 + Math.random() * 1800)
  }

  const askVoid = () => {
    setDread((d) => Math.min(100, d + 3))
    if (!question.trim()) {
      setAnswer('…')
      return
    }
    setAnswer(pick(VOID_REPLIES))
  }

  const pressIvr = (line: (typeof IVR_LINES)[number]) => {
    setIvrLog((l) => [line.result, ...l].slice(0, 6))
    setDread((d) => Math.min(100, d + 4))
    if (line.key === '0' || line.key === '5') setOnHold(true)
    if (line.key === '3') setTab('scream')
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChat((c) => [...c, { from: 'you' as const, text: msg }].slice(-12))
    setChatInput('')
    window.setTimeout(() => {
      setChat((c) => [...c, { from: 'bot' as const, text: pick(CHAT_REPLIES) }].slice(-12))
    }, 600 + Math.random() * 800)
  }

  const startChant = () => {
    if (chanting) return
    setChanting(true)
    setChantPct(0)
    const start = performance.now()
    const dur = 5000
    const tick = () => {
      const t = performance.now() - start
      setChantPct(Math.min(100, (t / dur) * 100))
      if (t < dur) requestAnimationFrame(tick)
      else {
        setChanting(false)
        setChantPct(0)
        setSummonedGary(true)
        showToast('Gary has been summoned. Gary is disappointed.')
        setDread((d) => Math.min(100, d + 15))
      }
    }
    requestAnimationFrame(tick)
  }

  const requestPto = () => {
    showToast(pick(HR_DENIALS))
    setPtoReason('')
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'portal', label: 'Portal' },
    { id: 'scream', label: 'Scream' },
    { id: 'phone', label: 'On Hold' },
    { id: 'metrics', label: 'KPIs' },
    { id: 'oracle', label: 'Oracle' },
    { id: 'cult', label: 'Cult' },
    { id: 'hr', label: 'HR' },
    { id: 'archive', label: 'Archive' },
  ]

  return (
    <motion.main
      className="relative z-0 min-h-dvh overflow-x-hidden pb-28 pt-20"
      style={{ x: shakeX }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="void-stars pointer-events-none fixed inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/25">department of nothing</p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-white/90 sm:text-3xl void-glitch-title">
            {glitchTitle}
          </h1>
          <p className="mt-2 text-xs text-white/35">Customer experience · existential tier support · no refunds on reality</p>
          <div className="mt-5">
            <VoidEye dread={dread} />
          </div>
          <p className="mt-3 text-[11px] text-white/30">Nothing arrives in {voidCountdown}… maybe · queue length: ∞+1</p>

          <div className="void-card mx-auto mt-5 max-w-md p-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>Existential dread</span>
              <span>{dread}% {dread >= 100 ? '(maxed out, congrats)' : ''}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={dread}
              onChange={(e) => setDread(Number(e.target.value))}
              className="void-range mt-2 w-full"
              aria-label="Existential dread level"
            />
            <p className="mt-2 text-center text-[10px] text-white/30">
              {dread < 25 && 'Surface-level denial — healthy'}
              {dread >= 25 && dread < 50 && 'Awareness creeping in'}
              {dread >= 50 && dread < 75 && 'The void notices you noticing it'}
              {dread >= 75 && dread < 100 && 'One more click from enlightenment (bad kind)'}
              {dread >= 100 && 'You ARE the void now. HR wants a word.'}
            </p>
          </div>
        </header>

        <AnimatePresence>
          {whisper && (
            <motion.p
              className="void-whisper pointer-events-none fixed left-1/2 top-32 z-10 -translate-x-1/2 text-xs italic text-white/40"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {whisper}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mb-4 flex flex-wrap justify-center gap-1.5">
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
            <motion.section key="portal" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Submit to the void</h2>
              <p className="mt-1 text-xs text-white/40">5-step intake · CAPTCHA included · satisfaction impossible</p>
              <div className="mt-4 flex gap-1">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-white/40' : 'bg-white/10'}`} />
                ))}
              </div>

              {step === 0 && (
                <div className="mt-5">
                  <label className="text-xs text-white/50">Your name (the void will mispronounce it)</label>
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
                  <label className="text-xs text-white/50">Describe your concern (min 500 characters) (not enforced)</label>
                  <textarea
                    className="void-input mt-1.5 min-h-24 w-full resize-none"
                    value={form.concern}
                    onChange={(e) => setForm((f) => ({ ...f, concern: e.target.value }))}
                    placeholder="Everything is fine and also terrible and also Monday…"
                  />
                </div>
              )}
              {step === 2 && (
                <div className="mt-5">
                  <label className="text-xs text-white/50">Urgency (all options are the same)</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['low', 'medium', 'screaming', 'cosmic', 'legal'] as const).map((u) => (
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
                  <MeaningCaptcha onDone={() => setDread((d) => Math.min(100, d + 5))} />
                </div>
              )}
              {step === 4 && (
                <div className="mt-5">
                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input type="checkbox" checked={form.soul} onChange={(e) => setForm((f) => ({ ...f, soul: e.target.checked }))} className="accent-white/50" />
                    Attach soul to ticket (non-refundable, slightly damp)
                  </label>
                  <p className="mt-3 text-xs text-white/35">By submitting you agree to Terms of Void™ which we cannot show you because they are invisible.</p>
                </div>
              )}

              {loadingSubmit ? (
                <div className="mt-6">
                  <p className="text-center text-xs text-white/50">Submitting to oblivion…</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-white/40"
                      initial={{ width: '0%' }}
                      animate={{ width: '97%' }}
                      transition={{ duration: 3.5, ease: 'linear' }}
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] text-white/25">Stuck at 97% (classic)</p>
                </div>
              ) : (
                <div className="mt-6 flex gap-2">
                  {step > 0 && (
                    <button type="button" className="void-btn" onClick={() => setStep((s) => s - 1)}>Back</button>
                  )}
                  {step < 4 ? (
                    <button type="button" className="void-btn void-btn--primary flex-1" onClick={() => setStep((s) => s + 1)}>
                      Continue into uncertainty
                    </button>
                  ) : (
                    <button type="button" className="void-btn void-btn--primary flex-1" onClick={submitPortal}>Submit &amp; forget</button>
                  )}
                </div>
              )}
            </motion.section>
          )}

          {tab === 'scream' && (
            <motion.section key="scream" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Scream into the void</h2>
              <p className="mt-1 text-xs text-white/40">Hold the button. Words fly. Dread rises. Therapeutic (debunked).</p>
              <ScreamCanvas active={screaming} />
              <button
                type="button"
                className={`void-btn void-btn--scream mt-4 w-full py-4 text-base ${screaming ? 'void-btn--active void-btn--shaking' : ''}`}
                onPointerDown={() => setScreaming(true)}
                onPointerUp={() => setScreaming(false)}
                onPointerLeave={() => setScreaming(false)}
              >
                {screaming ? pick(['AAAAAAHHHHH', 'WHYYYYYY', 'NOT AGAIN', 'MONDAY!!!', 'SEND HELP']) : 'Hold to scream'}
              </button>
              <p className="mt-3 text-center text-xs text-white/35">Screams absorbed: {screamCount} · Void satisfaction: NaN · Gary notified: yes</p>

              <div className="void-card mt-4 border-white/5 bg-black/40 p-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Staring contest</h3>
                <button type="button" className="void-btn mt-3 w-full" onClick={() => { setBlinkLost(true); setDread((d) => Math.min(100, d + 6)); window.setTimeout(() => setBlinkLost(false), 2400) }}>
                  I blinked (coward)
                </button>
                <AnimatePresence>
                  {blinkLost && (
                    <motion.p className="mt-3 text-center text-sm text-rose-300/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      You lose. The void did not blink. It has no eyelids. It has no face. It has you.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {tab === 'phone' && (
            <motion.section key="phone" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Void customer service hotline</h2>
              <p className="mt-1 text-xs text-white/40">Thank you for calling. Your call is unimportant to us.</p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-sm">
                <p className="text-white/50">☎ 1-800-VOID-NOW</p>
                {onHold && (
                  <motion.div className="mt-3" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                    <p className="text-amber-200/70">🎵 Hold music: one note, forever 🎵</p>
                    <p className="mt-1 text-xs text-white/40">On hold: {holdSec}s · Estimated wait: ∞</p>
                  </motion.div>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {IVR_LINES.map((line) => (
                    <button key={line.key} type="button" className="void-btn text-left text-xs" onClick={() => pressIvr(line)}>
                      Press {line.key} — {line.label}
                    </button>
                  ))}
                </div>
              </div>

              {ivrLog.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {ivrLog.map((line, i) => (
                    <motion.li key={i} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/55" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                      🔊 {line}
                    </motion.li>
                  ))}
                </ul>
              )}

              <div className="void-card mt-4 border-white/5 bg-black/40 p-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Live chat (also dead inside)</h3>
                <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
                  {chat.map((m, i) => (
                    <p key={i} className={`text-xs ${m.from === 'bot' ? 'text-white/45' : 'text-right text-sky-200/70'}`}>
                      {m.from === 'bot' ? '🤖 ' : 'you: '}{m.text}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input className="void-input flex-1 text-xs" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your despair…" onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                  <button type="button" className="void-btn text-xs" onClick={sendChat}>Send</button>
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'metrics' && (
            <motion.section key="metrics" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Void KPI dashboard</h2>
              <p className="mt-1 text-xs text-white/40">Numbers lie professionally here</p>
              <ul className="mt-5 space-y-3">
                {METRIC_LABELS.map((label) => (
                  <li key={label}>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>{label}</span>
                      <span className="tabular-nums text-white/70">
                        {label === 'Snacks' ? 'yes' : metrics[label] < 0.5 ? 'null' : metrics[label].toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-white/10 to-white/40" animate={{ width: `${metrics[label] * 10}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                {[
                  ['NaN', 'Meaning'],
                  ['404', 'Answers'],
                  ['∞', 'Queue'],
                  ['0', 'Fucks'],
                  ['−1', 'Motivation'],
                  ['???', 'Vibes'],
                ].map(([val, lbl]) => (
                  <div key={lbl} className="rounded-xl border border-white/8 bg-black/30 p-3">
                    <p className="text-2xl font-light text-white/80">{val}</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/30">{lbl}</p>
                  </div>
                ))}
              </div>
              <button type="button" className="void-btn mt-4 w-full" onClick={() => showToast('Report exported to /dev/null successfully.')}>
                Export quarterly report to nowhere
              </button>
            </motion.section>
          )}

          {tab === 'oracle' && (
            <motion.section key="oracle" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Ask the void</h2>
              <textarea className="void-input mt-4 min-h-24 w-full resize-none" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Will it get better?" />
              <div className="mt-3 flex gap-2">
                <button type="button" className="void-btn void-btn--primary flex-1" onClick={askVoid}>Consult the abyss</button>
                <button type="button" className="void-btn" onClick={() => { setVoidDice(Math.floor(Math.random() * 9999)); setDread((d) => Math.min(100, d + 2)) }}>Roll d∞</button>
              </div>
              {voidDice !== null && (
                <motion.p className="mt-3 text-center text-3xl font-light tabular-nums text-white/80" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  {voidDice} (interpret freely)
                </motion.p>
              )}
              <AnimatePresence>
                {answer !== null && (
                  <motion.div className="mt-5 rounded-xl border border-white/10 bg-black/50 p-5 text-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">The void says</p>
                    <p className="mt-3 text-lg font-light text-white/85">{answer || '(silence)'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-6">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Suggestion box (actively hostile)</h3>
                <textarea
                  className="void-input mt-2 min-h-20 w-full resize-none"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="We should improve…"
                  style={{ opacity: Math.max(0.08, 1 - suggestion.length * 0.03), transform: `rotate(${suggestion.length * 0.05}deg)` }}
                />
              </div>
            </motion.section>
          )}

          {tab === 'cult' && (
            <motion.section key="cult" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Church of the Empty Set</h2>
              <p className="mt-1 text-xs text-white/40">Tithe · chant · bingo · Gary</p>

              <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-4">
                <p className="text-sm text-white/60">Tithe to the void: <span className="text-amber-200/90">${tithe.toFixed(2)}</span></p>
                <div className="mt-2 flex gap-2">
                  {[1, 5, 20, 666].map((n) => (
                    <button key={n} type="button" className="void-btn flex-1 text-xs" onClick={() => { setTithe((t) => t + n); showToast(`$${n} vanished. The void burped.`) }}>
                      +${n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/8 bg-black/30 p-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Collective chant</h3>
                <button type="button" className="void-btn void-btn--primary mt-2 w-full" disabled={chanting} onClick={startChant}>
                  {chanting ? 'Ommmmmmmm…' : 'Begin 5-second enlightenment'}
                </button>
                {chanting && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-violet-400/60 transition-all" style={{ width: `${chantPct}%` }} />
                  </div>
                )}
                {summonedGary && (
                  <motion.p className="mt-3 text-center text-sm text-violet-200/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    👤 Gary materialized. Gary said &quot;hm.&quot; Gary left.
                  </motion.p>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Void bingo</h3>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {bingo.map((cell, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`rounded-lg border px-1 py-2.5 text-[10px] leading-tight ${marked.has(i) ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100/80' : 'border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]'}`}
                      onClick={() => toggleBingo(i)}
                    >
                      {i === 4 ? '★ FREE ★' : cell}
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'hr' && (
            <motion.section key="hr" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Void Human Resources</h2>
              <p className="mt-1 text-xs text-white/40">Policy 0.0 · mandatory fun Fridays (void only)</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Request PTO</h3>
                  <input className="void-input mt-2 w-full" value={ptoReason} onChange={(e) => setPtoReason(e.target.value)} placeholder="Reason (ignored)" />
                  <button type="button" className="void-btn mt-3 w-full" onClick={() => { requestPto(); setDread((d) => Math.min(100, d + 5)) }}>Submit request</button>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Mandatory compliance training</h3>
                  <div className="mt-2 flex items-center gap-3 rounded-lg bg-black/40 p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10 text-lg">▶</div>
                    <div>
                      <p className="text-xs text-white/60">How to Pretend You&apos;re Fine (4hr)</p>
                      <p className="text-[10px] text-white/30">Progress: 0% · Cannot skip · Cannot pause · Cannot leave</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <h3 className="text-sm text-white/70">Unsubscribe from existence</h3>
                  <RunawayButton onCatch={() => showToast('You caught it! Subscription renewed for 99 years.')} />
                </div>

                <div className="rounded-xl border border-white/8 bg-black/30 p-4">
                  <button type="button" className="void-btn void-btn--danger w-full" onClick={() => showToast('Deletion failed: entity too interesting. Also Gary said no.')}>
                    Delete me
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'archive' && (
            <motion.section key="archive" className="void-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="void-card-title">Void archive</h2>
              <p className="mt-1 text-xs text-white/40">Tickets may spontaneously combust</p>
              {tickets.length === 0 ? (
                <p className="mt-8 text-center text-sm text-white/30">No submissions yet. The void is patient. And hungry.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {tickets.map((t) => (
                    <motion.li
                      key={t.id}
                      className="rounded-lg border border-white/8 bg-black/30 px-3 py-2.5 text-sm"
                      layout
                    >
                      <div className="flex justify-between text-[10px] text-white/35">
                        <span>#{t.id}</span>
                        <span>{t.at}</span>
                      </div>
                      <p className="mt-1 text-white/55 line-through decoration-white/20">{t.text}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/30">{t.status}</p>
                    </motion.li>
                  ))}
                </ul>
              )}
              <button type="button" className="void-btn mt-4 w-full text-xs" onClick={() => { setTickets([]); showToast('Archive purged. Memories optional.') }}>
                Purge archive (recommended)
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-10 pb-6 text-center text-[10px] text-white/20">
          The Void™ is a registered absence. Gary is a trademark of Gary. © nothing · all wrongs reserved
        </footer>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className="void-toast fixed bottom-24 left-1/2 z-30 max-w-sm -translate-x-1/2 px-4 py-3 text-center text-xs text-white/80" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
