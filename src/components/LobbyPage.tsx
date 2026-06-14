import { motion, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

const RUMORS = [
  'Brad from accounting saw a ghost in the stairwell. HR said it was "ambient talent."',
  'Someone brought fish again. The building is considering secession.',
  "The CEO's plant is thriving. Yours is not. Draw your conclusions.",
  "There's a meeting about meetings at 3. Attendance is mandatory and futile.",
  'The vending machine gave someone two bags of chips. We think it\'s becoming sentient.',
  "Karen's birthday was yesterday. The cake is still in the break room. Do not eat it.",
  'IT says the Wi-Fi is fine. IT is lying in a beautiful, practiced way.',
]

const INTERCOM = [
  'Would the owner of a blue 2004 regret please move your emotional baggage.',
  'The elevator is experiencing an existential delay.',
  'Reminder: smiling is optional; presence is mandatory.',
  'Lost: one will to continue. Reward: mild acknowledgment.',
  'Attention: the fire alarm is just thinking out loud.',
  'Please do not feed the photocopier. Again.',
  'The bathroom key has entered a fugue state.',
  'Maintenance is on the way. Maintenance is always on the way.',
  'Whoever keeps clicking the elevator button, please stop. It can feel that.',
  'The lobby has reached maximum occupancy. Please wait in the waiting room.',
]

const LOST_ITEMS = [
  'single AirPod (left, emotionally distant)',
  'dignity (generic, well-used)',
  'motivation, last seen Monday',
  'a USB drive labeled "DO NOT OPEN" (opened)',
  'your youth, laminated',
  'one (1) coherent thought',
  'the good pen. you know the one.',
  'hope, expired 2019',
]

const BEIGE_NAMES = [
  'Institutional Apology',
  'Waiting Room Regret',
  'Cubicle Twilight',
  'Passive Aggressive Eggshell',
  'Fluorescent Acceptance',
  'Mildly Damp Memo',
  'Conference Call Beige',
  'Retirement of the Soul',
]

const BUZZWORDS = [
  'synergy', 'pivot', 'bandwidth', 'circle back', 'low-hanging fruit', 'move the needle',
  'deep dive', 'alignment', 'stakeholder', 'deliverables', 'leverage', 'disrupt',
  'paradigm', 'touch base', 'action item', 'value-add', 'streamline', 'ecosystem',
]

const MAGAZINE_QUIZ = [
  { q: 'Which celebrity wore it best?', a: ['Nobody', 'The carpet', 'Time itself', 'A confused raccoon'] },
  { q: 'Are you a winter or a summer?', a: ['Expired yogurt', 'A damp sock', 'Corporate liability', 'Yes'] },
  { q: 'What is your spirit animal?', a: ['Printer jam', 'Stale donut', 'Open floor plan', 'Reply-all'] },
]

const AUTO_REPLIES = [
  'Thank you for your complaint. It has been forwarded to /dev/null.',
  'Your ticket #${n} is important to us (statistically unlikely).',
  'A representative will contact you within 3-5 business eternities.',
  'We appreciate your patience. Please continue waiting indefinitely.',
  'Your feedback has been laminated and ignored.',
]

const STICKY_TEXTS = [
  'CALL DAVE???', 'out of order', 'do NOT sit here', 'mystery smell', 'see me',
  'where is Brenda', 'who ate my lunch', 'printer is haunted', '911 but boring',
  'meeting??', 'synergy!', 'help', 'ignore this', 'wet floor (allegedly)',
]

const VEND_ITEMS = [
  { name: 'Stale Chips', price: '$1.25' },
  { name: 'Room-Temp Cola', price: '$1.50' },
  { name: 'Existential Crisis Bar', price: '$2.00' },
  { name: 'Granola (1998)', price: '$1.75' },
  { name: 'Nothing You Wanted', price: '$3.50' },
]

const SEAT_LABELS = ['Dave', '???', 'Reserved', 'Wet', 'Karen', 'HR', 'Ghost', '']

type ClutterKind = 'sticky' | 'receipt' | 'paper' | 'ticket' | 'ring' | 'cup'

type Clutter = {
  id: number
  kind: ClutterKind
  x: number
  y: number
  rot: number
  text?: string
  scale?: number
}

type Toast = { id: number; text: string; kind: 'intercom' | 'cough' | 'phone' | 'jam' }

type Seat = { id: number; label: string; taken: boolean; gum: boolean }

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

function formatWait(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function spawnClutter(
  kind: ClutterKind,
  text?: string,
  opts?: Partial<Pick<Clutter, 'x' | 'y' | 'rot' | 'scale'>>,
): Omit<Clutter, 'id'> {
  return {
    kind,
    x: opts?.x ?? rnd(8, 78),
    y: opts?.y ?? rnd(12, 82),
    rot: opts?.rot ?? rnd(-22, 22),
    text,
    scale: opts?.scale ?? rnd(0.85, 1.1),
  }
}

export function LobbyPage() {
  const idRef = useRef(1)
  const mainRef = useRef<HTMLElement>(null)

  const [ticket, setTicket] = useState(() => Math.floor(Math.random() * 900) + 100)
  const [nowServing, setNowServing] = useState(() => Math.floor(Math.random() * 40) + 12)
  const [waitSecs, setWaitSecs] = useState(847)
  const [mess, setMess] = useState(8)
  const [clutter, setClutter] = useState<Clutter[]>(() => [
    { id: 0, ...spawnClutter('sticky', 'WELCOME (?)'), x: 62, y: 18, rot: 6 },
    { id: -1, ...spawnClutter('ring'), x: 28, y: 55, rot: 0, scale: 1.3 },
    { id: -2, ...spawnClutter('receipt'), x: 72, y: 68, rot: -12 },
  ])
  const [dragId, setDragId] = useState<number | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const [rumor, setRumor] = useState<string | null>(null)
  const [intercom, setIntercom] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [elevatorFloor, setElevatorFloor] = useState(2)
  const [elevatorDir, setElevatorDir] = useState<'↑' | '↓' | '…'>('…')
  const [elevatorRage, setElevatorRage] = useState(0)
  const [plantHealth, setPlantHealth] = useState(42)
  const [plantMsg, setPlantMsg] = useState<string | null>(null)
  const [lostItem, setLostItem] = useState<string | null>(null)
  const [beige, setBeige] = useState<string | null>(null)
  const [complaint, setComplaint] = useState('')
  const [complaintReply, setComplaintReply] = useState<string | null>(null)
  const [temp, setTemp] = useState(68)
  const [muzak, setMuzak] = useState(false)
  const [muzakTrack, setMuzakTrack] = useState(0)
  const [fluorescent, setFluorescent] = useState(true)
  const [typingDots, setTypingDots] = useState('.')
  const [quizIdx, setQuizIdx] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [bingo, setBingo] = useState<string[]>(() => shuffle(BUZZWORDS).slice(0, 9))
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [keyDistance, setKeyDistance] = useState(47)
  const [meetingMins, setMeetingMins] = useState(14)
  const [ticketStack, setTicketStack] = useState(0)
  const [vendMsg, setVendMsg] = useState<string | null>(null)
  const [copierMsg, setCopierMsg] = useState<string | null>(null)
  const [copierHeat, setCopierHeat] = useState(0)
  const [fly, setFly] = useState({ x: 55, y: 30 })
  const [flySwats, setFlySwats] = useState(0)
  const [flyDead, setFlyDead] = useState(false)
  const [penDragging, setPenDragging] = useState(false)
  const [penPos, setPenPos] = useState({ x: 0, y: 0 })
  const [coffeeSpills, setCoffeeSpills] = useState(0)
  const [planeMsg, setPlaneMsg] = useState('')
  const [planeLog, setPlaneLog] = useState<string[]>([])
  const [seats, setSeats] = useState<Seat[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      taken: i !== 7,
      label: i === 7 ? 'yours (broken)' : pick([...SEAT_LABELS]),
      gum: Math.random() < 0.35,
    })),
  )
  const [seatMsg, setSeatMsg] = useState<string | null>(null)
  const [coughs, setCoughs] = useState(0)
  const [tapeCount, setTapeCount] = useState(2)

  const shakeX = useMotionValue(0)

  const muzakTitles = [
    'Elevator Serenade in D-minor Regret',
    'Muzak for People Who Peaked in 2007',
    'Hold Music (Extended Despair Mix)',
    'Smooth Jazz for Spreadsheet Enthusiasts',
  ]

  const addMess = useCallback((n: number) => {
    setMess((m) => Math.min(100, m + n))
  }, [])

  const nextId = useCallback(() => {
    idRef.current += 1
    return idRef.current
  }, [])

  const addClutter = useCallback(
    (kind: ClutterKind, text?: string, opts?: Partial<Pick<Clutter, 'x' | 'y' | 'rot' | 'scale'>>) => {
      const item: Clutter = { id: nextId(), ...spawnClutter(kind, text, opts) }
      setClutter((c) => [...c.slice(-48), item])
      addMess(kind === 'ticket' ? 2 : kind === 'paper' ? 4 : 3)
      return item
    },
    [addMess, nextId],
  )

  const pushToast = useCallback(
    (text: string, kind: Toast['kind'] = 'intercom') => {
      const id = nextId()
      setToasts((t) => [...t.slice(-5), { id, text, kind }])
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
    },
    [nextId],
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      setWaitSecs((w) => w + 1)
      setNowServing((n) => (Math.random() < 0.08 ? n + 1 : n))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setElevatorFloor((f) => Math.max(1, Math.min(9, f + (Math.random() > 0.5 ? 1 : -1))))
      setElevatorDir(pick(['↑', '↓', '…']))
    }, 2200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setTypingDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 480)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!muzak) return
    const id = window.setInterval(() => setMuzakTrack((t) => (t + 1) % muzakTitles.length), 8000)
    return () => window.clearInterval(id)
  }, [muzak, muzakTitles.length])

  useEffect(() => {
    if (marked.size === 9) {
      window.setTimeout(() => {
        setMarked(new Set())
        setBingo(shuffle(BUZZWORDS).slice(0, 9))
      }, 2000)
    }
  }, [marked])

  useEffect(() => {
    if (flyDead) return
    const id = window.setInterval(() => {
      setFly((f) => ({
        x: Math.max(5, Math.min(92, f.x + rnd(-8, 8))),
        y: Math.max(10, Math.min(75, f.y + rnd(-6, 6))),
      }))
    }, 900)
    return () => window.clearInterval(id)
  }, [flyDead])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() < 0.22 + mess * 0.004) {
        const kind = pick(['intercom', 'cough', 'phone'] as const)
        if (kind === 'intercom') {
          const msg = pick(INTERCOM)
          setIntercom(msg)
          pushToast(msg, 'intercom')
        } else if (kind === 'cough') {
          setCoughs((c) => c + 1)
          pushToast('*someone coughs wetly*', 'cough')
        } else {
          pushToast('☎ Phone rings. Nobody answers. Heroic.', 'phone')
        }
        addMess(1)
      }
      if (Math.random() < 0.08 + mess * 0.003) {
        addClutter(pick(['sticky', 'receipt', 'paper'] as const), pick(STICKY_TEXTS))
      }
    }, 6500)
    return () => window.clearInterval(id)
  }, [mess, addClutter, addMess, pushToast])

  useEffect(() => {
    if (mess < 35) return
    const id = window.setInterval(() => {
      if (Math.random() < (mess - 30) * 0.008) addClutter('receipt')
    }, 4000)
    return () => window.clearInterval(id)
  }, [mess, addClutter])

  const takeTicket = useCallback(() => {
    setTicket((t) => t + 1)
    setTicketStack((s) => s + 1)
    setWaitSecs((w) => w + rnd(120, 400))
    addClutter('ticket', `#${ticket + 1}`, { y: rnd(70, 88), rot: rnd(-35, 35) })
    pushToast('Ticket printed. Queue unchanged.', 'jam')
  }, [addClutter, pushToast, ticket])

  const spamTickets = useCallback(() => {
    for (let i = 0; i < 4; i++) {
      setTicket((t) => t + 1)
      setTicketStack((s) => s + 1)
      addClutter('ticket', `#${ticket + i + 1}`, { y: rnd(65, 90), rot: rnd(-40, 40), x: rnd(5, 85) })
    }
    setWaitSecs((w) => w + rnd(400, 900))
    addMess(8)
    pushToast('Ticket printer go brrr. Brenda frowned.', 'jam')
  }, [addClutter, addMess, pushToast, ticket])

  const waterPlant = useCallback(() => {
    setPlantHealth((h) => Math.min(100, h + rnd(8, 22)))
    setPlantMsg(
      pick([
        'The plant accepts your offering.',
        'It thirsts for more. Always more.',
        'One leaf twitched. Progress?',
        'The plant has seen things. It cannot unsee.',
        'Water spilled on the carpet. Mess +1.',
      ]),
    )
    if (Math.random() < 0.35) addClutter('ring', undefined, { x: rnd(20, 60), y: rnd(40, 70) })
    addMess(2)
  }, [addClutter, addMess])

  const submitComplaint = useCallback(() => {
    const n = Math.floor(Math.random() * 90000) + 10000
    setComplaintReply(pick(AUTO_REPLIES).replace('${n}', String(n)))
    addClutter('paper', complaint.slice(0, 24) || 'WHY')
    setComplaint('')
    addMess(5)
  }, [addClutter, addMess, complaint])

  const pullKey = useCallback(() => {
    setKeyDistance((d) => {
      const next = d + rnd(3, 12)
      return next > 99 ? pick([12, 23, 31, 47]) : next
    })
    addMess(1)
    pushToast('Brenda has left the building. Brenda was never here.', 'intercom')
  }, [addMess, pushToast])

  const rageElevator = useCallback(() => {
    setElevatorRage((r) => r + 1)
    addMess(2)
    if (Math.random() < 0.25) addClutter('sticky', 'STOP IT')
    pushToast('Elevator heard that. It chooses violence (passively).', 'intercom')
    let frame = 0
    const id = window.setInterval(() => {
      shakeX.set((Math.random() - 0.5) * (4 + elevatorRage * 0.3))
      frame++
      if (frame > 8) {
        window.clearInterval(id)
        shakeX.set(0)
      }
    }, 45)
  }, [addClutter, addMess, elevatorRage, pushToast, shakeX])

  const vend = useCallback(
    (item: (typeof VEND_ITEMS)[0]) => {
      const outcomes = [
        `Jammed. ${item.name} is visible but legally unreachable.`,
        `Dispensed one (1) ice cube. Thank you for your ${item.price}.`,
        `Motor screamed. Nothing fell. Spirit crushed.`,
        `Wrong item: ${pick(VEND_ITEMS).name}. No refunds.`,
        `${item.name} dropped behind the glass. Tragic.`,
      ]
      setVendMsg(pick(outcomes))
      addClutter('receipt', item.name.slice(0, 10))
      addMess(4)
      pushToast('VENDING MACHINE MAKES ACCUSATORY NOISE', 'jam')
    },
    [addClutter, addMess, pushToast],
  )

  const copy = useCallback(() => {
    setCopierHeat((h) => h + rnd(12, 22))
    setCopierMsg(pick(['Warming up…', 'Scanning regret…', 'Applying toner…', 'Almost…']))
    addMess(3)
    window.setTimeout(() => {
      if (copierHeat > 55 || Math.random() < 0.45) {
        setCopierMsg('PAPER JAM IN TRAY ∞. Call someone who cares.')
        for (let i = 0; i < 5; i++) {
          addClutter('paper', 'JAM', { rot: rnd(-40, 40) })
        }
        pushToast('Photocopier achieved sentience. It jammed on purpose.', 'jam')
        let frame = 0
        const id = window.setInterval(() => {
          shakeX.set((Math.random() - 0.5) * 10)
          frame++
          if (frame > 14) {
            window.clearInterval(id)
            shakeX.set(0)
          }
        }, 40)
      } else {
        setCopierMsg('Copied 1 page of blankness. Perfection.')
        addClutter('paper')
      }
    }, 900)
  }, [addClutter, addMess, copierHeat, pushToast, shakeX])

  const swatFly = useCallback(() => {
    setFlySwats((s) => s + 1)
    if (Math.random() < 0.12 + flySwats * 0.02) {
      setFlyDead(true)
      pushToast('Fly down. A janitor will never arrive.', 'intercom')
      addMess(1)
    } else {
      pushToast('*miss* The fly respects your effort.', 'cough')
      setFly({ x: rnd(10, 85), y: rnd(15, 70) })
    }
  }, [addMess, flySwats, pushToast])

  const spillCoffee = useCallback(() => {
    setCoffeeSpills((s) => s + 1)
    addClutter('ring', undefined, { scale: rnd(1.2, 1.8) })
    if (coffeeSpills >= 2) addClutter('cup')
    addMess(6)
    pushToast('Coffee incident reported to no one.', 'jam')
  }, [addClutter, addMess, coffeeSpills, pushToast])

  const throwPlane = useCallback(() => {
    if (!planeMsg.trim()) return
    const land = pick([
      'hit Janet the plant',
      'lodged in ceiling tile',
      'was read by Dave. Dave wept.',
      'triggered the fire alarm emotionally',
      'returned to sender (you)',
    ])
    setPlaneLog((l) => [`"${planeMsg.slice(0, 40)}" → ${land}`, ...l.slice(0, 4)])
    addClutter('paper', planeMsg.slice(0, 12), { rot: rnd(-50, 50) })
    setPlaneMsg('')
    addMess(4)
  }, [addClutter, addMess, planeMsg])

  const trySeat = useCallback(
    (seat: Seat) => {
      if (seat.gum) {
        setSeatMsg('Your hand is now friends with gum from 2003.')
        addMess(3)
        return
      }
      if (seat.taken) {
        setSeatMsg(pick([
          `${seat.label || 'Someone'} was there first. They made eye contact.`,
          'Seat emits a low corporate whine. Denied.',
          'Reserved indefinitely. For no one.',
        ]))
        addMess(1)
        return
      }
      setSeats((prev) =>
        prev.map((s) =>
          s.id === seat.id
            ? { ...s, taken: true, label: 'YOU (temporarily)' }
            : s.id === 7
              ? { ...s, taken: false, label: 'yours (broken)' }
              : s,
        ),
      )
      setSeatMsg('You sat for 0.8 seconds before guilt stood you back up.')
      addMess(2)
    },
    [addMess],
  )

  const addTape = useCallback(() => {
    setTapeCount((t) => t + 1)
    addMess(2)
    addClutter('sticky', 'OUT OF ORDER')
  }, [addClutter, addMess])

  const onClutterPointerDown = (id: number, e: React.PointerEvent) => {
    e.preventDefault()
    const el = mainRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const item = clutter.find((c) => c.id === id)
    if (!item) return
    dragOffset.current = {
      x: e.clientX - rect.left - (item.x / 100) * rect.width,
      y: e.clientY - rect.top - (item.y / 100) * rect.height,
    }
    setDragId(id)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    addMess(0.5)
  }

  const onClutterPointerMove = (e: React.PointerEvent) => {
    if (dragId === null) return
    const el = mainRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left - dragOffset.current.x) / rect.width) * 100
    const y = ((e.clientY - rect.top - dragOffset.current.y) / rect.height) * 100
    setClutter((c) =>
      c.map((item) =>
        item.id === dragId
          ? { ...item, x: Math.max(2, Math.min(94, x)), y: Math.max(8, Math.min(92, y)), rot: item.rot + 0.4 }
          : item,
      ),
    )
  }

  const onClutterPointerUp = () => setDragId(null)

  const queueGap = ticket - nowServing
  const messLabel =
    mess < 20 ? 'tidy (suspicious)' : mess < 45 ? 'lived-in' : mess < 70 ? 'concerning' : mess < 90 ? 'biohazard chic' : 'MAXIMUM LOBBY'

  return (
    <motion.main
      ref={mainRef}
      className={`relative z-0 min-h-dvh overflow-x-hidden overflow-y-auto px-4 pb-32 pt-24 sm:px-6 ${fluorescent ? 'lobby-flicker' : ''}`}
      style={{ x: shakeX }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onPointerMove={onClutterPointerMove}
      onPointerUp={onClutterPointerUp}
      onPointerCancel={onClutterPointerUp}
    >
      {/* Floating clutter layer */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        {clutter.map((item) => (
          <div
            key={item.id}
            className={`lobby-clutter lobby-clutter--${item.kind} pointer-events-auto absolute select-none ${
              dragId === item.id ? 'z-30 scale-105 cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `rotate(${item.rot}deg) scale(${item.scale ?? 1})`,
            }}
            onPointerDown={(e) => onClutterPointerDown(item.id, e)}
          >
            {item.kind === 'sticky' && (
              <span className="lobby-sticky">{item.text ?? pick(STICKY_TEXTS)}</span>
            )}
            {item.kind === 'receipt' && (
              <span className="lobby-receipt">{item.text ?? 'DECLINED'}</span>
            )}
            {item.kind === 'paper' && (
              <span className="lobby-paper">{item.text ?? '…'}</span>
            )}
            {item.kind === 'ticket' && (
              <span className="lobby-ticket-slip">{item.text ?? '#???'}</span>
            )}
            {item.kind === 'ring' && <span className="lobby-coffee-ring" />}
            {item.kind === 'cup' && <span className="lobby-cup">☕</span>}
          </div>
        ))}

        {!flyDead && (
          <button
            type="button"
            className="lobby-fly pointer-events-auto absolute text-lg"
            style={{ left: `${fly.x}%`, top: `${fly.y}%` }}
            onClick={swatFly}
            aria-label="Swat fly"
          >
            🪰
          </button>
        )}
      </div>

      {/* Toast stack */}
      <div className="pointer-events-none fixed right-3 top-20 z-30 flex max-w-[min(16rem,45vw)] flex-col gap-2 sm:right-6">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`lobby-toast lobby-toast--${t.kind}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            {t.text}
          </motion.div>
        ))}
      </div>

      {/* Ticker */}
      <div className="lobby-ticker relative z-20 mb-6 overflow-hidden rounded-lg border border-lime-200/10 bg-black/35 py-1.5">
        <div className="lobby-ticker-inner whitespace-nowrap text-[10px] text-lime-200/45">
          WAITING IS A LIFESTYLE · COUGH COUNT: {coughs} · TAPE STRIPS: {tapeCount} · TICKET STACK: {ticketStack} ·
          ELEVATOR RAGE: {elevatorRage} · FLY SWATS: {flySwats} · DO NOT TOUCH ANYTHING ·
          WAITING IS A LIFESTYLE · COUGH COUNT: {coughs} ·
        </div>
      </div>

      <div className="relative z-20 mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-lime-200/40">
            Building 7 · Floor B · Wing of Indefinite Waiting
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-lime-50/90 sm:text-4xl">
            The Infinite Lobby
          </h1>
          <p className="mt-3 text-sm text-lime-100/35">Drag the mess. Make more mess. Brenda is watching.</p>

          <div className="mt-5 rounded-xl border border-lime-200/12 bg-black/25 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-lime-200/45">
              <span>Mess-o-meter™</span>
              <span>{Math.round(mess)}% · {messLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full bg-gradient-to-r from-lime-700 via-amber-600 to-rose-600 transition-all duration-300"
                style={{ width: `${mess}%` }}
              />
            </div>
          </div>

          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 font-mono text-sm">
            <span className="rounded-xl border border-lime-200/15 bg-black/20 px-4 py-2">
              <span className="text-lime-200/45">NOW </span>
              <span className="text-xl tabular-nums text-lime-300/95">#{nowServing}</span>
            </span>
            <span className="rounded-xl border border-amber-300/20 bg-black/20 px-4 py-2">
              <span className="text-lime-200/45">YOU </span>
              <span className="text-xl tabular-nums text-amber-200/90">#{ticket}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-lime-100/30">
            Wait: {formatWait(waitSecs)} · {queueGap} ahead · {ticketStack} tickets in your pocket
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <section className="lobby-card lobby-card--messy -rotate-1">
            <h2 className="lobby-card-title">Ticket Dispenser 3000</h2>
            <p className="mt-1 text-xs text-lime-100/35">Spits paper. Achieves nothing.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="lobby-btn flex-1" onClick={takeTicket}>
                Take number
              </button>
              <button type="button" className="lobby-btn" onClick={spamTickets}>
                Spam
              </button>
            </div>
            {ticketStack > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {Array.from({ length: Math.min(ticketStack, 14) }).map((_, i) => (
                  <span key={i} className="lobby-ticket-slip static inline-block scale-90" style={{ rotate: `${rnd(-12, 12)}deg` }}>
                    #{ticket - i}
                  </span>
                ))}
                {ticketStack > 14 && <span className="text-xs text-lime-100/40">+{ticketStack - 14} more</span>}
              </div>
            )}
          </section>

          <section className="lobby-card lobby-card--messy rotate-1">
            <h2 className="lobby-card-title">Elevator (Out of Order)</h2>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/25 px-4 py-3 font-mono">
              <span className="text-3xl text-lime-200/80">{elevatorDir}</span>
              <span className="text-4xl tabular-nums text-lime-100/90">{elevatorFloor}</span>
              <span className="text-xs text-rose-300/60">RAGE: {elevatorRage}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(['↑', '↓', 'OPEN', 'CLOSE'] as const).map((label) => (
                <button key={label} type="button" className="lobby-btn lobby-btn--sm py-3" onClick={rageElevator}>
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="lobby-btn mt-2 w-full text-xs" onClick={addTape}>
              Add OUT OF ORDER tape
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="lobby-card lobby-card--messy rotate-2">
              <h2 className="lobby-card-title">Vending Machine</h2>
              <div className="mt-3 flex flex-col gap-1.5">
                {VEND_ITEMS.map((item) => (
                  <button key={item.name} type="button" className="lobby-btn text-left text-xs" onClick={() => vend(item)}>
                    {item.name} <span className="text-lime-200/35">{item.price}</span>
                  </button>
                ))}
              </div>
              {vendMsg && <p className="mt-2 text-xs text-amber-100/70">{vendMsg}</p>}
            </section>

            <section className="lobby-card lobby-card--messy -rotate-2">
              <h2 className="lobby-card-title">Photocopier From Hell</h2>
              <p className="mt-1 text-xs text-lime-100/35">Heat: {Math.round(copierHeat)}° · Smells like warm PDF</p>
              <button type="button" className="lobby-btn mt-3 w-full" onClick={copy}>
                COPY (do not)
              </button>
              {copierMsg && <p className="mt-2 text-xs text-rose-200/75">{copierMsg}</p>}
            </section>
          </div>

          <section className="lobby-card lobby-card--messy">
            <h2 className="lobby-card-title">Pen On A Chain</h2>
            <p className="mt-1 text-xs text-lime-100/35">Try to steal it. It knows.</p>
            <div className="relative mt-6 flex h-24 items-center justify-center">
              <div className="absolute h-0.5 w-32 bg-stone-500/50" />
              <motion.div
                className="relative cursor-grab text-2xl active:cursor-grabbing"
                drag
                dragConstraints={{ left: -80, right: 80, top: -30, bottom: 30 }}
                dragElastic={0.08}
                onDragStart={() => setPenDragging(true)}
                onDragEnd={(_, info) => {
                  setPenDragging(false)
                  setPenPos({ x: info.offset.x, y: info.offset.y })
                  if (Math.hypot(info.offset.x, info.offset.y) > 70) {
                    pushToast('Chain snapped (emotionally). Pen returned.', 'jam')
                    addMess(2)
                  }
                }}
                animate={penDragging ? {} : { x: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 12 }}
              >
                🖊️
              </motion.div>
            </div>
            {Math.hypot(penPos.x, penPos.y) > 50 && (
              <p className="text-center text-xs text-amber-200/60">Maximum extension achieved. Let go.</p>
            )}
          </section>

          <section className="lobby-card lobby-card--messy -rotate-1">
            <h2 className="lobby-card-title">Coffee Spill Simulator</h2>
            <button type="button" className="lobby-btn mt-3 w-full" onClick={spillCoffee}>
              Knock over cup ({coffeeSpills} spills)
            </button>
          </section>

          <section className="lobby-card lobby-card--messy rotate-1">
            <h2 className="lobby-card-title">Paper Airplane Desk</h2>
            <div className="mt-3 flex gap-2">
              <input
                className="lobby-input min-w-0 flex-1"
                placeholder="write a grievance…"
                value={planeMsg}
                onChange={(e) => setPlaneMsg(e.target.value)}
                maxLength={80}
              />
              <button type="button" className="lobby-btn" onClick={throwPlane}>
                Throw
              </button>
            </div>
            {planeLog.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-lime-100/55">
                {planeLog.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Water Cooler Intelligence</h2>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={() => { setRumor(pick(RUMORS)); addMess(1) }}>
              Overhear gossip
            </button>
            {rumor && <p className="mt-3 text-sm italic text-lime-100/70">&ldquo;{rumor}&rdquo;</p>}
          </section>

          <section className="lobby-card lobby-card--messy">
            <h2 className="lobby-card-title">Ceiling Intercom</h2>
            <button
              type="button"
              className="lobby-btn mt-4 w-full"
              onClick={() => {
                const msg = pick(INTERCOM)
                setIntercom(msg)
                pushToast(msg, 'intercom')
                addMess(1)
              }}
            >
              Play announcement
            </button>
            {intercom && (
              <motion.p
                className="mt-3 rounded-lg border border-lime-200/10 bg-lime-950/20 px-3 py-2 text-sm text-lime-100/75"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                🔊 {intercom}
              </motion.p>
            )}
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-lime-100/45">
              <input type="checkbox" checked={fluorescent} onChange={(e) => setFluorescent(e.target.checked)} className="accent-lime-400" />
              Fluorescent lights (slight flicker)
            </label>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Plastic Plant (Janet)</h2>
            <p className="mt-1 text-sm text-lime-100/55">
              Health: {Math.round(plantHealth)}% · Mood:{' '}
              {plantHealth < 30 ? 'hostile' : plantHealth < 60 ? 'dry' : 'judgmental'}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full bg-gradient-to-r from-lime-700 to-lime-400 transition-all duration-500" style={{ width: `${plantHealth}%` }} />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="lobby-btn flex-1" onClick={waterPlant}>
                Water Janet
              </button>
              <button type="button" className="lobby-btn" onClick={() => { addMess(3); pushToast('Janet was poked. Janet remembers.', 'intercom') }}>
                Poke
              </button>
            </div>
            {plantMsg && <p className="mt-2 text-xs text-lime-200/55">{plantMsg}</p>}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="lobby-card lobby-card--messy -rotate-1">
              <h2 className="lobby-card-title">Lost &amp; Found</h2>
              <button type="button" className="lobby-btn mt-4 w-full" onClick={() => { setLostItem(pick(LOST_ITEMS)); addMess(1) }}>
                Rifle drawer
              </button>
              {lostItem && <p className="mt-3 text-sm text-lime-100/70">{lostItem}</p>}
            </section>
            <section className="lobby-card lobby-card--messy rotate-1">
              <h2 className="lobby-card-title">Beige Paint Swatch</h2>
              <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setBeige(pick(BEIGE_NAMES))}>
                Sample mood
              </button>
              {beige && (
                <div className="mt-3 rounded-lg bg-[#c4b8a8] px-3 py-2 text-center text-sm font-medium text-stone-700">{beige}</div>
              )}
            </section>
          </div>

          <section className="lobby-card lobby-card--messy">
            <h2 className="lobby-card-title">Complaint Portal</h2>
            <textarea
              className="lobby-input mt-4 min-h-20 w-full resize-none"
              placeholder="Describe your suffering..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              maxLength={280}
            />
            <button type="button" className="lobby-btn mt-3 w-full" onClick={submitComplaint} disabled={!complaint.trim()}>
              Crumple &amp; submit
            </button>
            {complaintReply && <p className="mt-3 text-sm text-amber-100/70">{complaintReply}</p>}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Thermostat (Decorative)</h2>
            <p className="mt-1 text-xs text-lime-100/35">Display: {temp}°F · Actual: 68°F forever</p>
            <input
              type="range"
              min={60}
              max={80}
              value={temp}
              onChange={(e) => { setTemp(Number(e.target.value)); addMess(0.3) }}
              className="lobby-range mt-4 w-full"
              aria-label="Fake thermostat"
            />
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Lobby Muzak™</h2>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setMuzak((m) => !m)}>
              {muzak ? '⏸ Stop suffering' : '▶ Play hold music'}
            </button>
            {muzak && <p className="mt-3 text-center text-xs text-lime-100/50">♪ {muzakTitles[muzakTrack]} ♪</p>}
          </section>

          <section className="lobby-card lobby-card--messy">
            <h2 className="lobby-card-title">Bathroom Key Locator</h2>
            <p className="mt-1 text-sm text-lime-100/55">Key ring: {Math.round(keyDistance)} ft away</p>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={pullKey}>
              Ask Brenda
            </button>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Meeting Starting In…</h2>
            <p className="mt-3 text-center text-4xl tabular-nums text-amber-100/90">{meetingMins} min</p>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={() => { setMeetingMins((m) => m + Math.floor(rnd(2, 9))); addMess(1) }}>
              Refresh calendar
            </button>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Someone is typing{typingDots}</h2>
            <p className="mt-2 text-sm text-lime-100/50">They have been typing since 2014.</p>
          </section>

          <section className="lobby-card lobby-card--messy -rotate-1">
            <h2 className="lobby-card-title">Seating Chart (interactive)</h2>
            <p className="mt-1 text-xs text-lime-100/35">Click to sit. Gum under some seats. Good luck.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  className={`rounded-lg border px-1 py-3 text-center text-[10px] transition sm:text-xs ${
                    seat.taken
                      ? 'border-lime-200/10 bg-black/30 text-lime-100/35 hover:bg-black/40'
                      : 'border-amber-300/30 bg-amber-950/25 text-amber-100/80 hover:bg-amber-950/40'
                  } ${seat.gum ? 'lobby-seat-gum' : ''}`}
                  onClick={() => trySeat(seat)}
                >
                  {seat.gum && <span className="block text-[8px] opacity-50">🫧</span>}
                  {seat.taken ? seat.label || 'Taken' : seat.label || 'Open?'}
                </button>
              ))}
            </div>
            {seatMsg && <p className="mt-3 text-center text-xs text-rose-200/70">{seatMsg}</p>}
          </section>

          <section className="lobby-card lobby-card--messy rotate-1">
            <h2 className="lobby-card-title">Waiting Room Magazine (2004)</h2>
            <p className="mt-2 text-sm text-lime-100/65">{MAGAZINE_QUIZ[quizIdx].q}</p>
            <div className="mt-3 flex flex-col gap-2">
              {MAGAZINE_QUIZ[quizIdx].a.map((ans) => (
                <button
                  key={ans}
                  type="button"
                  className="lobby-btn w-full text-left"
                  onClick={() => {
                    setQuizAnswer(ans)
                    addMess(1)
                    window.setTimeout(() => {
                      setQuizIdx((i) => (i + 1) % MAGAZINE_QUIZ.length)
                      setQuizAnswer(null)
                    }, 1400)
                  }}
                >
                  {ans}
                </button>
              ))}
            </div>
            {quizAnswer && <p className="mt-3 text-center text-sm text-amber-100/75">Correct: {quizAnswer}.</p>}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Corporate Buzzword Bingo</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {bingo.map((cell, i) => (
                <button
                  key={`${cell}-${i}`}
                  type="button"
                  className={`rounded-lg border px-1 py-3 text-center text-[10px] leading-tight sm:text-xs ${
                    marked.has(i)
                      ? 'border-amber-300/40 bg-amber-950/40 text-amber-100/90'
                      : 'border-lime-200/15 bg-black/20 text-lime-100/60 hover:border-lime-200/30'
                  }`}
                  onClick={() => {
                    setMarked((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                    addMess(0.5)
                  }}
                >
                  {i === 4 ? 'FREE' : cell}
                </button>
              ))}
            </div>
          </section>

          <footer className="pb-8 text-center text-[10px] text-lime-100/25">
            The lobby remembers everything you clicked.
            <br />
            Type <kbd className="text-lime-200/35">hobby</kbd> to leave. (The mess comes with you.)
          </footer>
        </div>
      </div>
    </motion.main>
  )
}
