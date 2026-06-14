import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

const RUMORS = [
  'Brad from accounting saw a ghost in the stairwell. HR said it was "ambient talent."',
  'Someone brought fish again. The building is considering secession.',
  'The CEO\'s plant is thriving. Yours is not. Draw your conclusions.',
  'There\'s a meeting about meetings at 3. Attendance is mandatory and futile.',
  'The vending machine gave someone two bags of chips. We think it\'s becoming sentient.',
  'Karen\'s birthday was yesterday. The cake is still in the break room. Do not eat it.',
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
  'synergy',
  'pivot',
  'bandwidth',
  'circle back',
  'low-hanging fruit',
  'move the needle',
  'deep dive',
  'alignment',
  'stakeholder',
  'deliverables',
  'leverage',
  'disrupt',
  'paradigm',
  'touch base',
  'action item',
  'value-add',
  'streamline',
  'ecosystem',
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

export function LobbyPage() {
  const [ticket, setTicket] = useState(() => Math.floor(Math.random() * 900) + 100)
  const [nowServing, setNowServing] = useState(() => Math.floor(Math.random() * 40) + 12)
  const [waitSecs, setWaitSecs] = useState(847)
  const [rumor, setRumor] = useState<string | null>(null)
  const [intercom, setIntercom] = useState<string | null>(null)
  const [elevatorFloor, setElevatorFloor] = useState(2)
  const [elevatorDir, setElevatorDir] = useState<'↑' | '↓' | '…'>('…')
  const [plantHealth, setPlantHealth] = useState(42)
  const [plantMsg, setPlantMsg] = useState<string | null>(null)
  const [lostItem, setLostItem] = useState<string | null>(null)
  const [beige, setBeige] = useState<string | null>(null)
  const [complaint, setComplaint] = useState('')
  const [complaintReply, setComplaintReply] = useState<string | null>(null)
  const [temp, setTemp] = useState(68)
  const [actualTemp] = useState(68)
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

  const seats = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        taken: i !== 7,
        label: i === 7 ? 'yours (broken)' : pick(['Dave', '???', 'Reserved', 'Wet', '']),
      })),
    [],
  )

  const muzakTitles = [
    'Elevator Serenade in D-minor Regret',
    'Muzak for People Who Peaked in 2007',
    'Hold Music (Extended Despair Mix)',
    'Smooth Jazz for Spreadsheet Enthusiasts',
  ]

  useEffect(() => {
    const id = window.setInterval(() => {
      setWaitSecs((w) => w + 1)
      setNowServing((n) => (Math.random() < 0.08 ? n + 1 : n))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setElevatorFloor((f) => {
        const next = f + (Math.random() > 0.5 ? 1 : -1)
        return Math.max(1, Math.min(9, next))
      })
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

  const takeTicket = useCallback(() => {
    setTicket((t) => t + 1)
    setWaitSecs((w) => w + rnd(120, 400))
  }, [])

  const waterPlant = useCallback(() => {
    setPlantHealth((h) => Math.min(100, h + rnd(8, 22)))
    setPlantMsg(pick([
      'The plant accepts your offering.',
      'It thirsts for more. Always more.',
      'One leaf twitched. Progress?',
      'The plant has seen things. It cannot unsee.',
    ]))
  }, [])

  const submitComplaint = useCallback(() => {
    const n = Math.floor(Math.random() * 90000) + 10000
    const template = pick(AUTO_REPLIES)
    setComplaintReply(template.replace('${n}', String(n)))
    setComplaint('')
  }, [])

  const pullKey = useCallback(() => {
    setKeyDistance((d) => {
      const next = d + rnd(3, 12)
      return next > 99 ? pick([12, 23, 31, 47]) : next
    })
  }, [])

  const queueGap = ticket - nowServing

  return (
    <motion.main
      className={`relative z-0 min-h-dvh overflow-y-auto px-4 pb-32 pt-24 sm:px-6 ${fluorescent ? 'lobby-flicker' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-lime-200/40">
            Building 7 · Floor B · Wing of Indefinite Waiting
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-lime-50/90 sm:text-4xl">
            The Infinite Lobby
          </h1>
          <p className="mt-3 text-sm text-lime-100/35">
            Please remain seated. Your patience is our profit margin.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-lime-200/15 bg-black/20 px-5 py-3 font-mono text-sm">
            <span className="text-lime-200/45">NOW SERVING</span>
            <span className="text-2xl tabular-nums text-lime-300/95">#{nowServing}</span>
            <span className="text-lime-200/30">|</span>
            <span className="text-lime-200/45">YOUR #</span>
            <span className="text-2xl tabular-nums text-amber-200/90">#{ticket}</span>
          </div>
          <p className="mt-3 text-xs text-lime-100/30">
            Estimated wait: {formatWait(waitSecs)} · {queueGap} souls ahead of you
          </p>
        </header>

        <div className="flex flex-col gap-5">
          <section className="lobby-card">
            <h2 className="lobby-card-title">Ticket Dispenser 3000</h2>
            <p className="mt-1 text-xs text-lime-100/35">Each ticket slightly reduces your will to live.</p>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={takeTicket}>
              Take another number
            </button>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Elevator Status</h2>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-black/25 px-4 py-3 font-mono">
              <span className="text-3xl text-lime-200/80">{elevatorDir}</span>
              <span className="text-4xl tabular-nums text-lime-100/90">{elevatorFloor}</span>
              <span className="text-xs text-lime-200/40">DOORS: stuck</span>
            </div>
            <p className="mt-3 text-center text-sm text-lime-100/50">Arriving: eventually</p>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Water Cooler Intelligence</h2>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setRumor(pick(RUMORS))}>
              Overhear gossip
            </button>
            {rumor && <p className="mt-3 text-sm italic text-lime-100/70">&ldquo;{rumor}&rdquo;</p>}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Ceiling Intercom</h2>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setIntercom(pick(INTERCOM))}>
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
              <input
                type="checkbox"
                checked={fluorescent}
                onChange={(e) => setFluorescent(e.target.checked)}
                className="accent-lime-400"
              />
              Fluorescent lights (slight flicker)
            </label>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Plastic Plant (Janet)</h2>
            <p className="mt-1 text-sm text-lime-100/55">
              Health: {Math.round(plantHealth)}% · Mood: {plantHealth < 30 ? 'hostile' : plantHealth < 60 ? 'dry' : 'judgmental'}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full bg-gradient-to-r from-lime-700 to-lime-400 transition-all duration-500"
                style={{ width: `${plantHealth}%` }}
              />
            </div>
            <button type="button" className="lobby-btn mt-4" onClick={waterPlant}>
              Water Janet
            </button>
            {plantMsg && <p className="mt-2 text-xs text-lime-200/55">{plantMsg}</p>}
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className="lobby-card">
              <h2 className="lobby-card-title">Lost &amp; Found</h2>
              <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setLostItem(pick(LOST_ITEMS))}>
                Random drawer
              </button>
              {lostItem && <p className="mt-3 text-sm text-lime-100/70">{lostItem}</p>}
            </section>
            <section className="lobby-card">
              <h2 className="lobby-card-title">Beige Paint Swatch</h2>
              <button type="button" className="lobby-btn mt-4 w-full" onClick={() => setBeige(pick(BEIGE_NAMES))}>
                Sample mood
              </button>
              {beige && (
                <div className="mt-3 rounded-lg bg-[#c4b8a8] px-3 py-2 text-center text-sm font-medium text-stone-700">
                  {beige}
                </div>
              )}
            </section>
          </div>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Complaint Portal</h2>
            <textarea
              className="lobby-input mt-4 min-h-20 w-full resize-none"
              placeholder="Describe your suffering..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              maxLength={280}
            />
            <button type="button" className="lobby-btn mt-3 w-full" onClick={submitComplaint} disabled={!complaint.trim()}>
              Submit into the void
            </button>
            {complaintReply && <p className="mt-3 text-sm text-amber-100/70">{complaintReply}</p>}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Thermostat (Decorative)</h2>
            <p className="mt-1 text-xs text-lime-100/35">
              Display: {temp}°F · Actual: {actualTemp}°F forever
            </p>
            <input
              type="range"
              min={60}
              max={80}
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              className="lobby-range mt-4 w-full"
              aria-label="Fake thermostat"
            />
            <p className="mt-2 text-center text-xs text-lime-100/40">Your adjustment has been noted and discarded.</p>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Lobby Muzak™</h2>
            <button
              type="button"
              className="lobby-btn mt-4 w-full"
              onClick={() => setMuzak((m) => !m)}
            >
              {muzak ? '⏸ Stop suffering' : '▶ Play hold music'}
            </button>
            {muzak && (
              <p className="mt-3 text-center text-xs text-lime-100/50">
                ♪ {muzakTitles[muzakTrack]} ♪
              </p>
            )}
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Bathroom Key Locator</h2>
            <p className="mt-1 text-sm text-lime-100/55">Giant key ring distance: {Math.round(keyDistance)} ft away</p>
            <button type="button" className="lobby-btn mt-4 w-full" onClick={pullKey}>
              Ask Brenda for the key
            </button>
            <p className="mt-2 text-xs text-lime-100/35">Brenda is always "just around the corner."</p>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Meeting Starting In…</h2>
            <p className="mt-3 text-center text-4xl tabular-nums text-amber-100/90">{meetingMins} min</p>
            <button
              type="button"
              className="lobby-btn mt-4 w-full"
              onClick={() => setMeetingMins((m) => m + Math.floor(rnd(2, 9)))}
            >
              Refresh calendar
            </button>
            <p className="mt-2 text-center text-xs text-lime-100/35">Spoiler: it adds time every time.</p>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Someone is typing{typingDots}</h2>
            <p className="mt-2 text-sm text-lime-100/50">They have been typing since 2014. Do not expect a message.</p>
          </section>

          <section className="lobby-card">
            <h2 className="lobby-card-title">Seating Chart</h2>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {seats.map((seat) => (
                <div
                  key={seat.id}
                  className={`rounded-lg border px-2 py-3 text-center text-[10px] sm:text-xs ${
                    seat.taken
                      ? 'border-lime-200/10 bg-black/30 text-lime-100/35'
                      : 'border-amber-300/30 bg-amber-950/25 text-amber-100/80'
                  }`}
                >
                  {seat.taken ? seat.label || 'Taken' : seat.label}
                </div>
              ))}
            </div>
          </section>

          <section className="lobby-card">
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
            {quizAnswer && (
              <p className="mt-3 text-center text-sm text-amber-100/75">Correct: {quizAnswer}. Experts agree.</p>
            )}
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
                  onClick={() =>
                    setMarked((prev) => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      return next
                    })
                  }
                >
                  {i === 4 ? 'FREE' : cell}
                </button>
              ))}
            </div>
            {marked.size === 9 && (
              <p className="mt-4 text-center text-sm text-amber-100/85">BINGO. You may now ascend to middle management.</p>
            )}
          </section>

          <footer className="pb-8 text-center text-[10px] text-lime-100/25">
            Thank you for waiting. You are now waiting at a higher tier.
            <br />
            Type <kbd className="text-lime-200/35">hobby</kbd> to escape the lobby. (You cannot escape the lobby.)
          </footer>
        </div>
      </div>
    </motion.main>
  )
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}
