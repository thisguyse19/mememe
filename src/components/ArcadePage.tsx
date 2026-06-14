import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

const GAMES = [
  { id: 'snake' as const, title: 'SNAKE.EXE', subtitle: 'Eat dots. Deny mortality.', color: '#34d399' },
  { id: 'breakout' as const, title: 'BRICK THERAPY', subtitle: 'Smash corporate jargon.', color: '#f472b6' },
  { id: 'invaders' as const, title: 'INBOX DEFENSE', subtitle: 'Reply-all from orbit.', color: '#38bdf8' },
]

type GameId = (typeof GAMES)[number]['id']
type Phase = 'attract' | 'select' | 'playing' | 'gameover'

type Scores = Record<GameId, number>

const SCORE_KEY = 'mememe-arcade-scores'
const BRICK_WORDS = ['SYNERGY', 'PIVOT', 'KPI', 'OKR', 'AGILE', 'HUSTLE', 'GRIND', 'VIBE', 'DELIVER']

const PRIZES = [
  'A warm handshake from nobody',
  'Coupon for 10% off regret',
  'Mystery USB (definitely cursed)',
  'Participation trophy (participated unwillingly)',
  'One (1) audible sigh',
  'Expired gift card to the void',
  'High score on a website no one visits',
]

function loadScores(): Scores {
  try {
    const raw = localStorage.getItem(SCORE_KEY)
    if (raw) return { ...{ snake: 0, breakout: 0, invaders: 0 }, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { snake: 0, breakout: 0, invaders: 0 }
}

function saveScores(scores: Scores) {
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Snake ───────────────────────────────────────────────────────────────────

type SnakeState = {
  cells: { x: number; y: number }[]
  dir: { x: number; y: number }
  pendingDir: { x: number; y: number }
  food: { x: number; y: number }
  score: number
  accum: number
  interval: number
  dead: boolean
}

const SNAKE_COLS = 22
const SNAKE_ROWS = 18

function spawnFood(cells: { x: number; y: number }[]): { x: number; y: number } {
  for (let i = 0; i < 80; i++) {
    const p = { x: Math.floor(Math.random() * SNAKE_COLS), y: Math.floor(Math.random() * SNAKE_ROWS) }
    if (!cells.some((c) => c.x === p.x && c.y === p.y)) return p
  }
  return { x: 0, y: 0 }
}

function initSnake(): SnakeState {
  const cells = [
    { x: 10, y: 9 },
    { x: 9, y: 9 },
    { x: 8, y: 9 },
  ]
  return {
    cells,
    dir: { x: 1, y: 0 },
    pendingDir: { x: 1, y: 0 },
    food: spawnFood(cells),
    score: 0,
    accum: 0,
    interval: 0.11,
    dead: false,
  }
}

function stepSnake(s: SnakeState, dt: number): SnakeState {
  if (s.dead) return s
  const next = { ...s, accum: s.accum + dt }
  if (next.accum < next.interval) return next
  next.accum = 0

  if (s.pendingDir.x !== -s.dir.x || s.pendingDir.y !== -s.dir.y) {
    next.dir = { ...s.pendingDir }
  }

  const head = s.cells[0]
  const nh = { x: head.x + next.dir.x, y: head.y + next.dir.y }

  if (nh.x < 0 || nh.x >= SNAKE_COLS || nh.y < 0 || nh.y >= SNAKE_ROWS) {
    return { ...next, dead: true }
  }
  if (s.cells.some((c) => c.x === nh.x && c.y === nh.y)) {
    return { ...next, dead: true }
  }

  const ate = nh.x === s.food.x && nh.y === s.food.y
  const cells = [nh, ...s.cells]
  if (!ate) cells.pop()

  next.cells = cells
  if (ate) {
    next.score += 10
    next.food = spawnFood(cells)
    next.interval = Math.max(0.055, next.interval - 0.004)
  }
  return next
}

function drawSnake(ctx: CanvasRenderingContext2D, w: number, h: number, s: SnakeState) {
  const cw = w / SNAKE_COLS
  const ch = h / SNAKE_ROWS
  ctx.fillStyle = '#050508'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)'
  for (let x = 0; x <= SNAKE_COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * cw, 0)
    ctx.lineTo(x * cw, h)
    ctx.stroke()
  }
  for (let y = 0; y <= SNAKE_ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * ch)
    ctx.lineTo(w, y * ch)
    ctx.stroke()
  }

  ctx.fillStyle = '#f87171'
  ctx.shadowColor = '#f87171'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(s.food.x * cw + cw / 2, s.food.y * ch + ch / 2, Math.min(cw, ch) * 0.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  s.cells.forEach((c, i) => {
    const t = 1 - i / Math.max(1, s.cells.length)
    ctx.fillStyle = `rgba(52, 211, 153, ${0.45 + t * 0.55})`
    ctx.shadowColor = '#34d399'
    ctx.shadowBlur = i === 0 ? 12 : 4
    ctx.fillRect(c.x * cw + 1, c.y * ch + 1, cw - 2, ch - 2)
  })
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 13px ui-monospace, monospace'
  ctx.fillText(String(s.score), 8, 18)
}

// ─── Breakout ────────────────────────────────────────────────────────────────

type Brick = { x: number; y: number; w: number; h: number; alive: boolean; word: string; hue: number }

type BreakoutState = {
  paddleW: number
  paddleX: number
  ball: { x: number; y: number; vx: number; vy: number }
  bricks: Brick[]
  score: number
  lives: number
  dead: boolean
  won: boolean
}

function initBreakout(w: number, h: number): BreakoutState {
  const cols = 8
  const rows = 5
  const pad = 6
  const brickW = (w - pad * 2 - (cols - 1) * 4) / cols
  const brickH = 18
  const bricks: Brick[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: pad + c * (brickW + 4),
        y: 36 + r * (brickH + 4),
        w: brickW,
        h: brickH,
        alive: true,
        word: BRICK_WORDS[(r * cols + c) % BRICK_WORDS.length],
        hue: 280 + r * 18 + c * 8,
      })
    }
  }
  return {
    paddleW: w * 0.18,
    paddleX: w / 2,
    ball: { x: w / 2, y: h * 0.65, vx: 180, vy: -220 },
    bricks,
    score: 0,
    lives: 3,
    dead: false,
    won: false,
  }
}

function stepBreakout(s: BreakoutState, dt: number, w: number, h: number, paddleTarget: number | null): BreakoutState {
  if (s.dead || s.won) return s
  const next = structuredClone(s) as BreakoutState

  if (paddleTarget !== null) {
    next.paddleX += (paddleTarget - next.paddleX) * Math.min(1, dt * 14)
  }
  next.paddleX = Math.max(next.paddleW / 2, Math.min(w - next.paddleW / 2, next.paddleX))

  next.ball.x += next.ball.vx * dt
  next.ball.y += next.ball.vy * dt

  if (next.ball.x < 8) {
    next.ball.x = 8
    next.ball.vx *= -1
  }
  if (next.ball.x > w - 8) {
    next.ball.x = w - 8
    next.ball.vx *= -1
  }
  if (next.ball.y < 8) {
    next.ball.y = 8
    next.ball.vy *= -1
  }

  const py = h - 28
  if (
    next.ball.y + 8 >= py &&
    next.ball.y - 8 <= py + 10 &&
    next.ball.x >= next.paddleX - next.paddleW / 2 &&
    next.ball.x <= next.paddleX + next.paddleW / 2 &&
    next.ball.vy > 0
  ) {
    next.ball.y = py - 8
    const hit = (next.ball.x - next.paddleX) / (next.paddleW / 2)
    next.ball.vx = hit * 260
    next.ball.vy = -Math.abs(next.ball.vy) * 1.02
  }

  if (next.ball.y > h + 20) {
    next.lives -= 1
    if (next.lives <= 0) {
      next.dead = true
    } else {
      next.ball = { x: w / 2, y: h * 0.65, vx: 180 * (Math.random() > 0.5 ? 1 : -1), vy: -220 }
    }
    return next
  }

  for (const b of next.bricks) {
    if (!b.alive) continue
    if (
      next.ball.x + 6 > b.x &&
      next.ball.x - 6 < b.x + b.w &&
      next.ball.y + 6 > b.y &&
      next.ball.y - 6 < b.y + b.h
    ) {
      b.alive = false
      next.score += 25
      next.ball.vy *= -1
      break
    }
  }

  if (next.bricks.every((b) => !b.alive)) next.won = true
  return next
}

function drawBreakout(ctx: CanvasRenderingContext2D, w: number, h: number, s: BreakoutState) {
  ctx.fillStyle = '#08060c'
  ctx.fillRect(0, 0, w, h)

  for (const b of s.bricks) {
    if (!b.alive) continue
    ctx.fillStyle = `hsla(${b.hue}, 70%, 55%, 0.85)`
    ctx.shadowColor = `hsla(${b.hue}, 80%, 60%, 0.6)`
    ctx.shadowBlur = 6
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.font = '600 8px ui-monospace, monospace'
    ctx.fillText(b.word.slice(0, 5), b.x + 3, b.y + 12)
  }

  const py = h - 28
  ctx.fillStyle = '#f472b6'
  ctx.shadowColor = '#f472b6'
  ctx.shadowBlur = 10
  ctx.fillRect(s.paddleX - s.paddleW / 2, py, s.paddleW, 10)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#fff'
  ctx.shadowColor = '#fff'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(s.ball.x, s.ball.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 12px ui-monospace, monospace'
  ctx.fillText(`${s.score}  ♥${s.lives}`, 8, 18)
}

// ─── Invaders ────────────────────────────────────────────────────────────────

type Bullet = { x: number; y: number; vy: number; player: boolean }
type Alien = { x: number; y: number; alive: boolean; hue: number }

type InvadersState = {
  aliens: Alien[]
  playerX: number
  bullets: Bullet[]
  dir: number
  stepTimer: number
  stepInterval: number
  score: number
  lives: number
  fireCd: number
  dead: boolean
  won: boolean
}

function initInvaders(w: number): InvadersState {
  const aliens: Alien[] = []
  const cols = 9
  const rows = 4
  const startX = w * 0.12
  const startY = 48
  const gapX = (w * 0.76) / cols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      aliens.push({ x: startX + c * gapX, y: startY + r * 28, alive: true, hue: 190 + r * 20 })
    }
  }
  return {
    aliens,
    playerX: w / 2,
    bullets: [],
    dir: 1,
    stepTimer: 0,
    stepInterval: 0.55,
    score: 0,
    lives: 3,
    fireCd: 0,
    dead: false,
    won: false,
  }
}

function stepInvaders(
  s: InvadersState,
  dt: number,
  w: number,
  h: number,
  playerTarget: number | null,
  fire: boolean,
): InvadersState {
  if (s.dead || s.won) return s
  const next = structuredClone(s) as InvadersState

  if (playerTarget !== null) {
    next.playerX += (playerTarget - next.playerX) * Math.min(1, dt * 12)
  }
  next.playerX = Math.max(20, Math.min(w - 20, next.playerX))

  next.fireCd = Math.max(0, next.fireCd - dt)
  if (fire && next.fireCd <= 0) {
    next.bullets.push({ x: next.playerX, y: h - 36, vy: -320, player: true })
    next.fireCd = 0.35
  }

  next.stepTimer += dt
  if (next.stepTimer >= next.stepInterval) {
    next.stepTimer = 0
    next.stepInterval = Math.max(0.22, next.stepInterval - 0.008)
    let hitEdge = false
    for (const a of next.aliens) {
      if (!a.alive) continue
      if ((a.x <= 24 && next.dir < 0) || (a.x >= w - 24 && next.dir > 0)) hitEdge = true
    }
    const dx = hitEdge ? 0 : next.dir * 10
    const dy = hitEdge ? 14 : 0
    if (hitEdge) next.dir *= -1
    for (const a of next.aliens) {
      if (a.alive) {
        a.x += dx
        a.y += dy
        if (a.y > h - 80) next.dead = true
      }
    }
    if (Math.random() < 0.35) {
      const live = next.aliens.filter((a) => a.alive)
      if (live.length) {
        const shooter = pick(live)
        next.bullets.push({ x: shooter.x, y: shooter.y + 10, vy: 140, player: false })
      }
    }
  }

  next.bullets = next.bullets.filter((b) => {
    b.y += b.vy * dt
    if (b.y < 0 || b.y > h) return false

    if (b.player) {
      for (const a of next.aliens) {
        if (!a.alive) continue
        if (Math.abs(b.x - a.x) < 16 && Math.abs(b.y - a.y) < 14) {
          a.alive = false
          next.score += 50
          return false
        }
      }
    } else if (Math.abs(b.x - next.playerX) < 18 && Math.abs(b.y - (h - 32)) < 12) {
      next.lives -= 1
      if (next.lives <= 0) next.dead = true
      return false
    }
    return true
  })

  if (next.aliens.every((a) => !a.alive)) next.won = true
  return next
}

function drawInvaders(ctx: CanvasRenderingContext2D, w: number, h: number, s: InvadersState) {
  ctx.fillStyle = '#060810'
  ctx.fillRect(0, 0, w, h)

  for (const a of s.aliens) {
    if (!a.alive) continue
    ctx.fillStyle = `hsla(${a.hue}, 75%, 58%, 0.9)`
    ctx.shadowColor = `hsla(${a.hue}, 90%, 60%, 0.5)`
    ctx.shadowBlur = 8
    ctx.fillRect(a.x - 12, a.y - 8, 24, 16)
    ctx.fillRect(a.x - 8, a.y - 14, 16, 6)
    ctx.shadowBlur = 0
  }

  for (const b of s.bullets) {
    ctx.fillStyle = b.player ? '#fef08a' : '#fb7185'
    ctx.fillRect(b.x - 2, b.y - 6, 4, 10)
  }

  ctx.fillStyle = '#38bdf8'
  ctx.shadowColor = '#38bdf8'
  ctx.shadowBlur = 12
  ctx.fillRect(s.playerX - 16, h - 32, 32, 12)
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 12px ui-monospace, monospace'
  ctx.fillText(`${s.score}  ♥${s.lives}`, 8, 18)
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ArcadePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('attract')
  const [gameIdx, setGameIdx] = useState(0)
  const [credits, setCredits] = useState(0)
  const [scores, setScores] = useState<Scores>(loadScores)
  const [lastScore, setLastScore] = useState(0)
  const [prize, setPrize] = useState<string | null>(null)
  const [marquee, setMarquee] = useState(0)

  const phaseRef = useRef(phase)
  const gameIdxRef = useRef(gameIdx)
  const snakeRef = useRef<SnakeState | null>(null)
  const breakoutRef = useRef<BreakoutState | null>(null)
  const invadersRef = useRef<InvadersState | null>(null)
  const inputRef = useRef({ left: false, right: false, up: false, down: false, fire: false })
  const pointerXRef = useRef<number | null>(null)
  const attractTRef = useRef(0)
  const endedRef = useRef(false)

  const game = GAMES[gameIdx]

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    gameIdxRef.current = gameIdx
  }, [gameIdx])

  const insertCoin = useCallback(() => {
    setCredits((c) => c + 1)
  }, [])

  const startGame = useCallback(() => {
    setCredits((c) => {
      if (c <= 0) return c
      const id = GAMES[gameIdxRef.current].id
      if (id === 'snake') snakeRef.current = initSnake()
      else if (id === 'breakout') {
        const canvas = canvasRef.current
        breakoutRef.current = initBreakout(canvas?.clientWidth ?? 320, canvas?.clientHeight ?? 240)
      } else {
        const canvas = canvasRef.current
        invadersRef.current = initInvaders(canvas?.clientWidth ?? 320)
      }
      setPhase('playing')
      setPrize(null)
      endedRef.current = false
      return c - 1
    })
  }, [])

  const endGame = useCallback((score: number, id: GameId) => {
    setLastScore(score)
    setScores((prev) => {
      const next = { ...prev }
      if (score > prev[id]) {
        next[id] = score
        saveScores(next)
        setPrize(pick(PRIZES))
      }
      return next
    })
    setPhase('gameover')
  }, [])

  const resetToSelect = useCallback(() => {
    snakeRef.current = null
    breakoutRef.current = null
    invadersRef.current = null
    setPhase('select')
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setMarquee((m) => (m + 1) % GAMES.length), 3200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (phase === 'attract') {
      const t = window.setTimeout(() => setPhase('select'), 2400)
      return () => window.clearTimeout(t)
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const down = e.type === 'keydown'
      if (e.key === 'ArrowLeft') inputRef.current.left = down
      if (e.key === 'ArrowRight') inputRef.current.right = down
      if (e.key === 'ArrowUp') inputRef.current.up = down
      if (e.key === 'ArrowDown') inputRef.current.down = down
      if (e.key === ' ') inputRef.current.fire = down

      if (!down) return
      if (phaseRef.current === 'select') {
        if (e.key === 'ArrowLeft') setGameIdx((i) => (i + GAMES.length - 1) % GAMES.length)
        if (e.key === 'ArrowRight') setGameIdx((i) => (i + 1) % GAMES.length)
        if (e.key === 'Enter') startGame()
      }
      if (phaseRef.current === 'gameover' && e.key === 'Enter') resetToSelect()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [startGame, resetToSelect])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      attractTRef.current += dt

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
      const inp = inputRef.current
      const phaseNow = phaseRef.current
      const gIdx = gameIdxRef.current
      const gId = GAMES[gIdx].id

      if (phaseNow === 'playing') {
        if (gId === 'snake') {
          let s = snakeRef.current ?? initSnake()
          if (inp.up) s.pendingDir = { x: 0, y: -1 }
          if (inp.down) s.pendingDir = { x: 0, y: 1 }
          if (inp.left) s.pendingDir = { x: -1, y: 0 }
          if (inp.right) s.pendingDir = { x: 1, y: 0 }
          s = stepSnake(s, dt)
          snakeRef.current = s
          drawSnake(ctx, w, h, s)
          if (s.dead && !endedRef.current) {
            endedRef.current = true
            endGame(s.score, 'snake')
          }
        } else if (gId === 'breakout') {
          let s = breakoutRef.current ?? initBreakout(w, h)
          if (inp.left) s.paddleX -= 320 * dt
          if (inp.right) s.paddleX += 320 * dt
          if (pointerXRef.current !== null) s.paddleX += (pointerXRef.current - s.paddleX) * Math.min(1, dt * 14)
          s.paddleX = Math.max(s.paddleW / 2, Math.min(w - s.paddleW / 2, s.paddleX))
          s = stepBreakout(s, dt, w, h, null)
          breakoutRef.current = s
          drawBreakout(ctx, w, h, s)
          if ((s.dead || s.won) && !endedRef.current) {
            endedRef.current = true
            endGame(s.score + (s.won ? 200 : 0), 'breakout')
          }
        } else {
          let s = invadersRef.current ?? initInvaders(w)
          if (inp.left) s.playerX -= 280 * dt
          if (inp.right) s.playerX += 280 * dt
          if (pointerXRef.current !== null) s.playerX += (pointerXRef.current - s.playerX) * Math.min(1, dt * 12)
          s.playerX = Math.max(20, Math.min(w - 20, s.playerX))
          s = stepInvaders(s, dt, w, h, null, inp.fire)
          invadersRef.current = s
          drawInvaders(ctx, w, h, s)
          if ((s.dead || s.won) && !endedRef.current) {
            endedRef.current = true
            endGame(s.score + (s.won ? 300 : 0), 'invaders')
          }
        }
      } else {
        ctx.fillStyle = '#050508'
        ctx.fillRect(0, 0, w, h)
        const demo = GAMES[gIdx]
        ctx.fillStyle = demo.color
        ctx.shadowColor = demo.color
        ctx.shadowBlur = 20
        ctx.font = '700 22px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(demo.title, w / 2, h * 0.38)
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.font = '400 11px ui-sans-serif, system-ui, sans-serif'
        ctx.fillText(demo.subtitle, w / 2, h * 0.48)

        if (phaseNow === 'attract') {
          const pulse = 0.5 + Math.sin(attractTRef.current * 4) * 0.5
          ctx.fillStyle = `rgba(250, 204, 21, ${0.4 + pulse * 0.6})`
          ctx.font = '600 14px ui-monospace, monospace'
          ctx.fillText('INSERT COIN', w / 2, h * 0.68)
        } else if (phaseNow === 'select') {
          ctx.fillStyle = credits > 0 ? '#a7f3d0' : 'rgba(255,255,255,0.35)'
          ctx.font = '600 12px ui-monospace, monospace'
          ctx.fillText(credits > 0 ? 'PRESS START' : 'NEED CREDIT', w / 2, h * 0.68)
        } else if (phaseNow === 'gameover') {
          ctx.fillStyle = '#fb7185'
          ctx.font = '700 18px ui-monospace, monospace'
          ctx.fillText('GAME OVER', w / 2, h * 0.62)
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.font = '600 13px ui-monospace, monospace'
          ctx.fillText(`SCORE ${lastScore}`, w / 2, h * 0.72)
        }
        ctx.textAlign = 'left'
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [endGame, lastScore, credits])

  const handleCanvasPointer = (clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointerXRef.current = clientX - rect.left
  }

  return (
    <main className="relative z-0 min-h-dvh overflow-x-hidden pb-28 pt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <header className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-violet-300/50">mememe arcade</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-violet-50 sm:text-3xl">
            Neon Regret Cabinet
          </h1>
          <p className="mt-1 text-xs text-violet-200/45">Three games · one quarter · infinite coping</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
          <div className="arcade-cabinet mx-auto w-full max-w-lg">
            <div className="arcade-marquee relative overflow-hidden rounded-t-xl px-4 py-2 text-center">
              <motion.p
                key={marquee}
                className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-200"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {GAMES[marquee].title} — {GAMES[marquee].subtitle}
              </motion.p>
            </div>

            <div className="arcade-screen-wrap border-x-4 border-zinc-800 px-3 py-3">
              <div className="arcade-screen relative overflow-hidden rounded-lg">
                <canvas
                  ref={canvasRef}
                  className="block h-56 w-full sm:h-64"
                  aria-label={`Arcade game: ${game.title}`}
                  onPointerMove={(e) => handleCanvasPointer(e.clientX)}
                  onPointerDown={(e) => handleCanvasPointer(e.clientX)}
                  onPointerLeave={() => {
                    pointerXRef.current = null
                  }}
                />
                <div className="arcade-scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
              </div>
            </div>

            <div className="rounded-b-xl border-x-4 border-b-4 border-zinc-800 bg-zinc-900/90 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">Credits</span>
                  <span className="arcade-credit tabular-nums">{credits}</span>
                </div>
                <button
                  type="button"
                  className="arcade-coin-slot"
                  aria-label="Insert coin"
                  onClick={insertCoin}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Coin</span>
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="arcade-btn arcade-btn--sm"
                    aria-label="Previous game"
                    onClick={() => setGameIdx((i) => (i + GAMES.length - 1) % GAMES.length)}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    className="arcade-btn arcade-btn--start"
                    disabled={phase === 'playing' || (phase === 'select' && credits <= 0)}
                    onClick={() => {
                      if (phase === 'gameover') resetToSelect()
                      else startGame()
                    }}
                  >
                    {phase === 'gameover' ? 'Again' : 'Start'}
                  </button>
                  <button
                    type="button"
                    className="arcade-btn arcade-btn--sm"
                    aria-label="Next game"
                    onClick={() => setGameIdx((i) => (i + 1) % GAMES.length)}
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-6">
                <div className="grid grid-cols-3 gap-1">
                  {(['up', 'left', 'right', 'down'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      className={`arcade-btn arcade-btn--pad ${dir === 'up' ? 'col-start-2' : dir === 'down' ? 'col-start-2 row-start-2' : dir === 'left' ? 'row-start-2' : 'col-start-3 row-start-2'}`}
                      aria-label={dir}
                      onPointerDown={() => {
                        if (dir === 'up') inputRef.current.up = true
                        if (dir === 'down') inputRef.current.down = true
                        if (dir === 'left') inputRef.current.left = true
                        if (dir === 'right') inputRef.current.right = true
                      }}
                      onPointerUp={() => {
                        if (dir === 'up') inputRef.current.up = false
                        if (dir === 'down') inputRef.current.down = false
                        if (dir === 'left') inputRef.current.left = false
                        if (dir === 'right') inputRef.current.right = false
                      }}
                      onPointerLeave={() => {
                        if (dir === 'up') inputRef.current.up = false
                        if (dir === 'down') inputRef.current.down = false
                        if (dir === 'left') inputRef.current.left = false
                        if (dir === 'right') inputRef.current.right = false
                      }}
                    >
                      {dir === 'up' ? '▲' : dir === 'down' ? '▼' : dir === 'left' ? '◀' : '▶'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="arcade-btn arcade-btn--fire h-16 w-16 self-center rounded-full text-xs font-bold"
                  aria-label="Fire"
                  onPointerDown={() => {
                    inputRef.current.fire = true
                  }}
                  onPointerUp={() => {
                    inputRef.current.fire = false
                  }}
                >
                  FIRE
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="arcade-card">
              <h2 className="arcade-card-title">Now Loading</h2>
              <p className="mt-1 text-lg font-semibold" style={{ color: game.color }}>
                {game.title}
              </p>
              <p className="mt-1 text-xs text-violet-200/50">{game.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {GAMES.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide transition ${i === gameIdx ? 'bg-violet-500/30 text-violet-100' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    onClick={() => setGameIdx(i)}
                  >
                    {g.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="arcade-card">
              <h2 className="arcade-card-title">High Scores</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {GAMES.map((g) => (
                  <li key={g.id} className="flex justify-between tabular-nums text-violet-100/75">
                    <span className="text-violet-200/45">{g.title.split(' ')[0]}</span>
                    <span style={{ color: g.color }}>{scores[g.id]}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="arcade-btn mt-3 w-full text-xs"
                onClick={() => {
                  const cleared = { snake: 0, breakout: 0, invaders: 0 }
                  saveScores(cleared)
                  setScores(cleared)
                }}
              >
                Reset board (coward)
              </button>
            </div>

            <div className="arcade-card">
              <h2 className="arcade-card-title">How to play</h2>
              <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-violet-200/55">
                <li>
                  <strong className="text-violet-200/80">Snake:</strong> arrows / D-pad · eat red dots
                </li>
                <li>
                  <strong className="text-violet-200/80">Breakout:</strong> move paddle · smash buzzwords
                </li>
                <li>
                  <strong className="text-violet-200/80">Invaders:</strong> dodge · FIRE to shoot emails
                </li>
              </ul>
            </div>

            <AnimatePresence>
              {prize && (
                <motion.div
                  className="arcade-card border-amber-400/25 bg-amber-950/20"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="arcade-card-title text-amber-200/90">Ticket dispensed!</h2>
                  <p className="mt-2 text-xs text-amber-100/70">{prize}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </main>
  )
}
