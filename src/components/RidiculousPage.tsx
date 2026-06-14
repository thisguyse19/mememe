import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const SINS = [
  'using light mode after midnight',
  'microwaving fish in a shared kitchen',
  'reply-all when you meant reply',
  'believing the loading bar',
  'trusting a PDF',
  'saying "we should grab coffee sometime" and meaning never',
  'leaving a meeting that could have been an email',
  'pronouncing GIF wrong on purpose',
  'feeding the algorithm before feeding yourself',
  'thinking this button does anything real',
]

const ABSOLUTIONS = [
  'Go in peace. Your tabs are forgiven.',
  'Ten Hail Marys and one software update.',
  'The council of raccoons has spoken: you are fine.',
  'Indulgence granted. Do not do it again (do it again).',
  'Your soul is now open-source. Please star the repo.',
  'Consider yourself lightly damned. Enjoy the weekend.',
]

const PROPHECIES = [
  'A stranger will email you "quick question" with seventeen paragraphs.',
  'Your charger will be exactly one inch too short forever.',
  'The meeting will end early but your soul will not.',
  'You will find a grape in a place grapes should not be.',
  'Three seagulls are thinking about you right now. Judgmentally.',
  'Your next idea is brilliant. Your next commit is not.',
  'The void accepts Venmo but prefers exposure.',
]

const HERESIES = [
  'The earth is a slightly annoyed torus.',
  'Gravity is just the planet exhaling.',
  'Wi-Fi signals are shy ghosts.',
  'Déjà vu is the universe Ctrl+Z-ing.',
  'Cloud storage is literally clouds. We lied.',
  'Time zones exist because the sun got tired.',
]

const INVERTED_PRAYERS = [
  'Our Father who art in the fridge, hallowed be thy leftovers.',
  'Give us this day our daily scroll, and forgive us our notifications.',
  'Lead us not into group chats, but deliver us from read receipts.',
  'Blessed are the meek, for they shall inherit the aux cord.',
  'In the name of the Wi-Fi, the Password, and the Holy Buffering.',
]

const DEMON_NAMES = [
  'Balthazar the Mildly Inconvenienced',
  'Gary',
  'Sir Regret of the Unclosed Tabs',
  'The Entity That Hides Your Other Sock',
  'Beelzebub Jr. (Intern)',
  'A Very Disappointed Owl',
]

const BINGO_CELLS = [
  'wrong emoji',
  'reply all',
  'forgot mute',
  'hot take',
  'main character',
  'touch grass',
  'ratio',
  'chronically online',
  'delulu',
  'slay (unearned)',
  'no thoughts',
  'brain rot',
  'based (???',
  'cope',
  'touché',
  'unhinged',
  'feral',
  'npc energy',
  'sigma (lol)',
  'skill issue',
  'L + ratio',
  'rent free',
  'its giving',
  'very demure',
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

function cursedMath(a: number, b: number, op: string): string {
  const results: Record<string, string[]> = {
    '+': ['a fish', 'yes', '∞-ish', 'banana', `${a + b} (allegedly)`],
    '-': ['debt', 'regret', 'negative vibes', `${a - b} but make it fashion`],
    '*': ['too much', 'the void', `${a * b} (citation needed)`],
    '/': ['undefined spiritually', '0.666', 'ask your therapist'],
  }
  return pick(results[op] ?? ['maybe'])
}

function demonifyName(name: string): string {
  if (!name.trim()) return 'Nameless Horror of Aisle Seven'
  const letters = name.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!letters) return 'The Unspeakable One'
  const reversed = letters.split('').reverse().join('')
  const suffix = pick(['oth', 'ax', 'ius', 'on', 'yx', 'ula'])
  return `${reversed.slice(0, 3).toUpperCase()}${suffix} the ${pick(['Damp', 'Soggy', 'Moist', 'Crispy'])}`
}

function EyeOfJudgment() {
  const ref = useRef<HTMLDivElement>(null)
  const pupilX = useSpring(0, { stiffness: 120, damping: 18 })
  const pupilY = useSpring(0, { stiffness: 120, damping: 18 })

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
      const max = 14
      pupilX.set((dx / dist) * max)
      pupilY.set((dy / dist) * max)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [pupilX, pupilY])

  return (
    <div
      ref={ref}
      className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-950/80 to-purple-950/90 shadow-[0_0_40px_rgba(217,70,239,0.25)]"
      aria-hidden="true"
    >
      <motion.div
        className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-200 to-rose-500"
        style={{ x: pupilX, y: pupilY }}
      >
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950" />
        <div className="absolute left-[55%] top-[35%] h-1.5 w-1.5 rounded-full bg-white/90" />
      </motion.div>
    </div>
  )
}

export function RidiculousPage() {
  const [sin, setSin] = useState(() => pick(SINS))
  const [absolution, setAbsolution] = useState<string | null>(null)
  const [dice, setDice] = useState<number | null>(null)
  const [prophecy, setProphecy] = useState<string | null>(null)
  const [heresy, setHeresy] = useState<string | null>(null)
  const [prayer, setPrayer] = useState<string | null>(null)
  const [demon, setDemon] = useState<string | null>(null)
  const [summoned, setSummoned] = useState(false)
  const [exorcising, setExorcising] = useState(false)
  const [goatMood, setGoatMood] = useState(50)
  const [heresyMeter, setHeresyMeter] = useState(33)
  const [tithe, setTithe] = useState(0)
  const [titheMsg, setTitheMsg] = useState<string | null>(null)
  const [calcA, setCalcA] = useState('2')
  const [calcB, setCalcB] = useState('2')
  const [calcOp, setCalcOp] = useState('+')
  const [calcResult, setCalcResult] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [demonName, setDemonName] = useState<string | null>(null)
  const [chantPlaying, setChantPlaying] = useState(false)
  const [chantProgress, setChantProgress] = useState(0)
  const [bleats, setBleats] = useState(0)
  const [bingo, setBingo] = useState<string[]>(() => shuffle(BINGO_CELLS).slice(0, 9))
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [glitchText, setGlitchText] = useState('H̸E̴L̷L̶O̸')

  const shakeX = useMotionValue(0)

  const goatLabel = useMemo(() => {
    if (goatMood < 20) return ' plotting your downfall'
    if (goatMood < 40) return ' mildly disappointed'
    if (goatMood < 60) return ' neutral evil'
    if (goatMood < 80) return ' pleased, suspiciously'
    return ' ascended'
  }, [goatMood])

  const absolve = useCallback(() => {
    setAbsolution(pick(ABSOLUTIONS))
    setSin(pick(SINS))
    setHeresyMeter((h) => Math.min(100, h + rnd(3, 9)))
  }, [])

  const rollDice = useCallback(() => {
    setDice(Math.floor(Math.random() * 666) + 1)
    setHeresyMeter((h) => Math.min(100, h + rnd(5, 15)))
  }, [])

  const exorcise = useCallback(() => {
    setExorcising(true)
    let frame = 0
    const id = window.setInterval(() => {
      shakeX.set((Math.random() - 0.5) * 18)
      frame++
      if (frame > 24) {
        window.clearInterval(id)
        shakeX.set(0)
        setExorcising(false)
        setSummoned(false)
        setDemon(null)
      }
    }, 40)
  }, [shakeX])

  const summon = useCallback(() => {
    setSummoned(true)
    setDemon(pick(DEMON_NAMES))
    setHeresyMeter((h) => Math.min(100, h + 20))
  }, [])

  const playChant = useCallback(() => {
    if (chantPlaying) return
    setChantPlaying(true)
    setChantProgress(0)
    const start = performance.now()
    const duration = 4200
    const tick = () => {
      const t = performance.now() - start
      setChantProgress(Math.min(100, (t / duration) * 100))
      if (t < duration) requestAnimationFrame(tick)
      else {
        setChantPlaying(false)
        setChantProgress(0)
      }
    }
    requestAnimationFrame(tick)
  }, [chantPlaying])

  const glitchify = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const zalgo = '̸̴̷̶̵̢̧̨̛̖̗̘̙̜̝̞̟̚'
    let out = ''
    for (let i = 0; i < 6; i++) {
      out += chars[Math.floor(Math.random() * chars.length)]
      if (Math.random() > 0.4) out += zalgo[Math.floor(Math.random() * zalgo.length)]
    }
    setGlitchText(out)
  }, [])

  useEffect(() => {
    if (marked.size === 9) {
      window.setTimeout(() => {
        setMarked(new Set())
        setBingo(shuffle(BINGO_CELLS).slice(0, 9))
      }, 1800)
    }
  }, [marked])

  return (
    <motion.main
      className="relative z-0 min-h-dvh overflow-y-auto px-4 pb-32 pt-24 sm:px-6"
      style={{ x: shakeX }}
    >
      <div className="mx-auto max-w-2xl">
        <motion.header
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-fuchsia-300/50">
            Department of Questionable Affairs
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-fuchsia-100/95 sm:text-4xl">
            The Cursed Wing
          </h1>
          <p className="mt-3 text-sm text-fuchsia-200/40">
            Nothing here is real. Everything here is legally distinct from reality.
          </p>
          <div className="mt-8">
            <EyeOfJudgment />
            <p className="mt-3 text-xs text-fuchsia-300/35">it sees your browser history (it doesn&apos;t)</p>
          </div>
        </motion.header>

        <div className="flex flex-col gap-5">
          {/* Confession booth */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Drive-Thru Confessional™</h2>
            <p className="mt-2 text-sm text-fuchsia-100/70">
              You are accused of: <span className="text-rose-200/90">{sin}</span>
            </p>
            <button type="button" className="cursed-btn mt-4" onClick={absolve}>
              Absolve me (probably)
            </button>
            {absolution && (
              <motion.p
                className="mt-3 text-sm italic text-emerald-200/75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ✦ {absolution}
              </motion.p>
            )}
          </section>

          {/* Heresy meter */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Heresy Meter</h2>
            <p className="mt-1 text-xs text-fuchsia-200/40">{heresyMeter}% condemned (cosmetically)</p>
            <input
              type="range"
              min={0}
              max={100}
              value={heresyMeter}
              onChange={(e) => setHeresyMeter(Number(e.target.value))}
              className="cursed-range mt-4 w-full"
              aria-label="Heresy level"
            />
            <p className="mt-2 text-center text-sm text-fuchsia-100/60">
              {heresyMeter < 25 && 'Saint-coded (allegedly)'}
              {heresyMeter >= 25 && heresyMeter < 50 && 'Lightly unhinged'}
              {heresyMeter >= 50 && heresyMeter < 75 && 'The council is concerned'}
              {heresyMeter >= 75 && heresyMeter < 100 && 'One more click from excommunication'}
              {heresyMeter >= 100 && 'MAXIMUM HERESY ACHIEVED 🎉'}
            </p>
          </section>

          {/* D666 dice */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Unholy Dice (d666)</h2>
            <p className="mt-1 text-xs text-fuchsia-200/40">For when d20 isn&apos;t dramatic enough.</p>
            <button type="button" className="cursed-btn mt-4" onClick={rollDice}>
              Roll for consequences
            </button>
            {dice !== null && (
              <motion.p
                className="mt-4 text-center text-4xl font-medium tabular-nums text-rose-200/95"
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                key={dice}
              >
                {dice}
              </motion.p>
            )}
          </section>

          {/* Cursed calculator */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Cursed Calculator</h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <input
                className="cursed-input w-16"
                value={calcA}
                onChange={(e) => setCalcA(e.target.value.replace(/[^\d.-]/g, ''))}
                aria-label="First number"
              />
              <select
                className="cursed-input"
                value={calcOp}
                onChange={(e) => setCalcOp(e.target.value)}
                aria-label="Operation"
              >
                <option value="+">+</option>
                <option value="-">−</option>
                <option value="*">×</option>
                <option value="/">÷</option>
              </select>
              <input
                className="cursed-input w-16"
                value={calcB}
                onChange={(e) => setCalcB(e.target.value.replace(/[^\d.-]/g, ''))}
                aria-label="Second number"
              />
              <button
                type="button"
                className="cursed-btn"
                onClick={() => {
                  const a = parseFloat(calcA) || 0
                  const b = parseFloat(calcB) || 0
                  setCalcResult(cursedMath(a, b, calcOp))
                }}
              >
                =
              </button>
            </div>
            {calcResult && (
              <p className="mt-4 text-center text-lg text-amber-200/90">
                {calcA} {calcOp} {calcB} = <strong>{calcResult}</strong>
              </p>
            )}
          </section>

          {/* Prophecy & heresy facts */}
          <div className="grid gap-5 sm:grid-cols-2">
            <section className="cursed-card">
              <h2 className="cursed-card-title">Oracle of Mild Dread</h2>
              <button
                type="button"
                className="cursed-btn mt-4 w-full"
                onClick={() => setProphecy(pick(PROPHECIES))}
              >
                Reveal prophecy
              </button>
              {prophecy && <p className="mt-3 text-sm text-fuchsia-100/75">&ldquo;{prophecy}&rdquo;</p>}
            </section>
            <section className="cursed-card">
              <h2 className="cursed-card-title">Heresy Fun Fact</h2>
              <button
                type="button"
                className="cursed-btn mt-4 w-full"
                onClick={() => setHeresy(pick(HERESIES))}
              >
                Learn something wrong
              </button>
              {heresy && <p className="mt-3 text-sm text-fuchsia-100/75">{heresy}</p>}
            </section>
          </div>

          {/* Inverted prayer */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Liturgical Remix Engine</h2>
            <button type="button" className="cursed-btn mt-4" onClick={() => setPrayer(pick(INVERTED_PRAYERS))}>
              Generate unapproved verse
            </button>
            {prayer && (
              <motion.blockquote
                className="mt-4 border-l-2 border-fuchsia-500/30 pl-4 text-sm italic text-fuchsia-100/80"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {prayer}
              </motion.blockquote>
            )}
          </section>

          {/* Demon summon */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Summon Minor Inconvenience</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="cursed-btn" onClick={summon} disabled={summoned}>
                {summoned ? 'Already here' : 'Summon'}
              </button>
              <button
                type="button"
                className="cursed-btn cursed-btn--danger"
                onClick={exorcise}
                disabled={exorcising}
              >
                {exorcising ? 'Begone!!!' : 'Exorcise page'}
              </button>
            </div>
            {summoned && demon && (
              <motion.div
                className="mt-5 rounded-xl border border-rose-500/25 bg-black/40 p-4 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <pre className="text-xs leading-tight text-rose-300/80">{`   (\\_/)\n  ( •_•)\n / >👹`}</pre>
                <p className="mt-3 text-sm font-medium text-rose-200/90">{demon}</p>
                <p className="mt-1 text-xs text-rose-200/45">has entered the chat. Your Wi-Fi may suffer.</p>
              </motion.div>
            )}
          </section>

          {/* Demon name */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Demon Name Generator</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className="cursed-input min-w-0 flex-1"
                placeholder="your mortal name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={32}
              />
              <button
                type="button"
                className="cursed-btn"
                onClick={() => setDemonName(demonifyName(nameInput))}
              >
                Corrupt
              </button>
            </div>
            {demonName && (
              <p className="mt-3 text-center text-sm text-amber-200/85">
                You shall be known as <strong>{demonName}</strong>
              </p>
            )}
          </section>

          {/* Goat mood */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Goat Mood Tracker 🐐</h2>
            <p className="mt-1 text-sm text-fuchsia-100/60">
              The goat is{goatLabel}. ({goatMood}/100)
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={goatMood}
              onChange={(e) => setGoatMood(Number(e.target.value))}
              className="cursed-range mt-4 w-full"
              aria-label="Goat mood"
            />
            <button
              type="button"
              className="cursed-btn mt-4"
              onClick={() => {
                setBleats((b) => b + 1)
                setGoatMood((g) => Math.min(100, g + rnd(5, 20)))
              }}
            >
              Bleat at goat ({bleats} bleats)
            </button>
          </section>

          {/* Tithe */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Imaginary Tithe Slider</h2>
            <p className="mt-1 text-xs text-fuchsia-200/40">100% of funds go to the void. Tax deductible nowhere.</p>
            <input
              type="range"
              min={0}
              max={100}
              value={tithe}
              onChange={(e) => {
                setTithe(Number(e.target.value))
                setTitheMsg(null)
              }}
              className="cursed-range mt-4 w-full"
              aria-label="Tithe amount"
            />
            <p className="mt-2 text-center text-sm text-fuchsia-100/70">${tithe} million (fake)</p>
            <button
              type="button"
              className="cursed-btn mt-3 w-full"
              onClick={() =>
                setTitheMsg(
                  tithe === 0
                    ? 'The void respects your boundaries.'
                    : tithe < 30
                      ? 'A polite donation. The void nods.'
                      : tithe < 70
                        ? 'Generous. A raccoon somewhere got a hat.'
                        : 'You are now CFO of the abyss. No take-backs.',
                )
              }
            >
              Pay the void
            </button>
            {titheMsg && <p className="mt-3 text-center text-sm text-emerald-200/70">{titheMsg}</p>}
          </section>

          {/* Gregorian silence */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Gregorian Chant Player</h2>
            <p className="mt-1 text-xs text-fuchsia-200/40">Now playing: absolute silence, remastered.</p>
            <button type="button" className="cursed-btn mt-4 w-full" onClick={playChant} disabled={chantPlaying}>
              {chantPlaying ? 'Chanting…' : '▶ Play'}
            </button>
            {chantPlaying && (
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-fuchsia-950/80">
                <motion.div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-rose-400"
                  style={{ width: `${chantProgress}%` }}
                />
              </div>
            )}
          </section>

          {/* Blasphemy bingo */}
          <section className="cursed-card">
            <h2 className="cursed-card-title">Chronically Online Bingo</h2>
            <p className="mt-1 text-xs text-fuchsia-200/40">Tap squares you have definitely done. Free space: you&apos;re here.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {bingo.map((cell, i) => (
                <button
                  key={`${cell}-${i}`}
                  type="button"
                  className={`rounded-lg border px-2 py-3 text-center text-[10px] leading-tight transition sm:text-xs ${
                    marked.has(i)
                      ? 'border-rose-400/50 bg-rose-950/50 text-rose-100/90'
                      : 'border-fuchsia-500/20 bg-black/25 text-fuchsia-100/65 hover:border-fuchsia-400/35'
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
                  {i === 4 ? '★ free ★' : cell}
                </button>
              ))}
            </div>
            {marked.size === 9 && (
              <p className="mt-4 text-center text-sm font-medium text-rose-200/90">BINGO. Touch grass immediately.</p>
            )}
          </section>

          {/* Glitch */}
          <section className="cursed-card text-center">
            <h2 className="cursed-card-title">Sacred Text Corruptor</h2>
            <p className="mt-4 text-2xl font-medium tracking-widest text-fuchsia-200/90">{glitchText}</p>
            <button type="button" className="cursed-btn mt-4" onClick={glitchify}>
              Corrupt again
            </button>
          </section>

          <footer className="pb-8 text-center text-[10px] text-fuchsia-300/25">
            No gods, monsters, or goats were consulted in the making of this page.
            <br />
            If offended, type <kbd className="text-fuchsia-300/40">hobby</kbd> for penance.
          </footer>
        </div>
      </div>
    </motion.main>
  )
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}
