import { useEffect, useRef } from 'react'

type Turd = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  rot: number
  rotV: number
  squishX: number
  squishY: number
  hue: number
  sat: number
  eyes: boolean
  age: number
  grounded: boolean
  seed: number
}

type Fly = {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
}

type StinkWave = {
  x: number
  y: number
  r: number
  life: number
}

type Whisper = {
  text: string
  x: number
  y: number
  life: number
  rot: number
}

const WHISPERS = [
  'why',
  'it knows',
  'warm',
  'forbidden yogurt',
  'physics enabled',
  'you did this',
  'schlop',
  'bamboozled',
  'non-euclidean',
  'it blinks',
  'matter fountain online',
  'NVIDIA GeForce Poo',
]

const GRAVITY = 980
const MAX_TURDS = 140

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function spawnTurd(ex: number, ey: number, pressure: number): Turd {
  const angle = rnd(-0.55, 0.55) + Math.PI / 2
  const speed = rnd(120, 280) + pressure * 180
  return {
    x: ex + rnd(-8, 8),
    y: ey + rnd(-2, 6),
    vx: Math.cos(angle) * speed * rnd(0.3, 0.55),
    vy: Math.sin(angle) * speed * 0.35 + rnd(40, 120),
    r: rnd(10, 18) + pressure * 8,
    rot: rnd(0, Math.PI * 2),
    rotV: rnd(-6, 6),
    squishX: 1,
    squishY: 1,
    hue: rnd(18, 38),
    sat: rnd(55, 85),
    eyes: Math.random() < 0.14,
    age: 0,
    grounded: false,
    seed: Math.random() * 1000,
  }
}

function resolveCircleCollision(a: Turd, b: Turd) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy)
  const minDist = a.r * a.squishX * 0.9 + b.r * b.squishX * 0.9
  if (dist >= minDist || dist === 0) return

  const nx = dx / dist
  const ny = dy / dist
  const overlap = minDist - dist
  a.x -= nx * overlap * 0.5
  a.y -= ny * overlap * 0.5
  b.x += nx * overlap * 0.5
  b.y += ny * overlap * 0.5

  const dvx = a.vx - b.vx
  const dvy = a.vy - b.vy
  const rel = dvx * nx + dvy * ny
  if (rel <= 0) return

  const restitution = 0.18
  const impulse = (-(1 + restitution) * rel) / 2
  a.vx += impulse * nx
  a.vy += impulse * ny
  b.vx -= impulse * nx
  b.vy -= impulse * ny

  a.squishX = Math.max(0.55, a.squishX - 0.08)
  a.squishY = Math.min(1.45, a.squishY + 0.08)
  b.squishX = Math.max(0.55, b.squishX - 0.08)
  b.squishY = Math.min(1.45, b.squishY + 0.08)
}

function drawTurd(ctx: CanvasRenderingContext2D, t: Turd) {
  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.rotate(t.rot)
  ctx.scale(t.squishX, t.squishY)

  const grad = ctx.createRadialGradient(-t.r * 0.2, -t.r * 0.25, t.r * 0.1, 0, 0, t.r)
  grad.addColorStop(0, `hsl(${t.hue + 12} ${t.sat}% ${38 + t.age * 0.4}%)`)
  grad.addColorStop(0.55, `hsl(${t.hue} ${t.sat + 8}% ${26}%)`)
  grad.addColorStop(1, `hsl(${t.hue - 8} ${t.sat + 12}% ${14}%)`)

  ctx.fillStyle = grad
  ctx.beginPath()

  const lumps = 5
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2
    const wobble = Math.sin(t.seed + i * 1.7) * 0.12
    const lx = Math.cos(a) * t.r * (0.55 + wobble)
    const ly = Math.sin(a) * t.r * (0.45 + wobble)
    if (i === 0) ctx.moveTo(lx, ly)
    else ctx.lineTo(lx, ly)
  }
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(80, 40, 10, 0.35)'
  ctx.beginPath()
  ctx.ellipse(t.r * 0.15, t.r * 0.1, t.r * 0.35, t.r * 0.22, 0.4, 0, Math.PI * 2)
  ctx.fill()

  if (t.eyes) {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-t.r * 0.22, -t.r * 0.08, t.r * 0.14, 0, Math.PI * 2)
    ctx.arc(t.r * 0.08, -t.r * 0.12, t.r * 0.11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#111'
    const blink = Math.sin(t.age * 12) > 0.92
    if (!blink) {
      ctx.beginPath()
      ctx.arc(-t.r * 0.2, -t.r * 0.08, t.r * 0.06, 0, Math.PI * 2)
      ctx.arc(t.r * 0.1, -t.r * 0.12, t.r * 0.05, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}

function drawVoidPortal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pulse: number,
  time: number,
) {
  ctx.save()
  ctx.translate(cx, cy)

  const wobble = Math.sin(time * 3.1) * 2

  // ceiling mount / industrial chute
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(-70, -36 + wobble, 140, 28)
  ctx.fillStyle = '#44403c'
  ctx.fillRect(-58, -10 + wobble, 116, 8)

  // void hole — abstract, no anatomy
  const holeGrad = ctx.createRadialGradient(0, 18 + wobble, 2, 0, 18 + wobble, 38 + pulse * 10)
  holeGrad.addColorStop(0, '#050403')
  holeGrad.addColorStop(0.45, '#1a0f08')
  holeGrad.addColorStop(0.75, `rgba(120, 60, 20, ${0.35 + pulse * 0.35})`)
  holeGrad.addColorStop(1, 'rgba(132, 204, 22, 0)')

  ctx.fillStyle = holeGrad
  ctx.beginPath()
  ctx.ellipse(0, 18 + wobble, 34 + pulse * 8, 16 + pulse * 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // inner swirl
  ctx.strokeStyle = `rgba(163, 230, 53, ${0.15 + pulse * 0.35})`
  ctx.lineWidth = 2
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    const r = 12 + i * 8 + pulse * 6
    ctx.ellipse(0, 18 + wobble, r, r * 0.45, time * 1.8 + i, 0, Math.PI * 2)
    ctx.stroke()
  }

  // drip glow when emitting
  if (pulse > 0.6) {
    ctx.fillStyle = `rgba(180, 83, 9, ${(pulse - 0.6) * 0.5})`
    ctx.beginPath()
    ctx.moveTo(-6, 28 + wobble)
    ctx.quadraticCurveTo(0, 42 + pulse * 20 + wobble, 6, 28 + wobble)
    ctx.fill()
  }

  ctx.restore()
}

export function PooSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const turds: Turd[] = []
    const flies: Fly[] = []
    const stinks: StinkWave[] = []
    const whispers: Whisper[] = []
    let pressure = 0
    let pulse = 0
    let shake = 0
    let time = 0
    let w = 0
    let h = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 12; i++) {
      flies.push({
        x: rnd(w * 0.2, w * 0.8),
        y: rnd(h * 0.3, h * 0.85),
        vx: rnd(-40, 40),
        vy: rnd(-40, 40),
        phase: rnd(0, Math.PI * 2),
      })
    }

    const emitterX = () => w * 0.5
    const emitterY = () => h * 0.14 + 36

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      time += dt

      pressure = Math.min(1, pressure + dt * 0.22)
      pulse = 0.35 + Math.sin(time * 2.8) * 0.15 + pressure * 0.55

      if (pressure > 0.75 && turds.length < MAX_TURDS && Math.random() < dt * 7) {
        turds.push(spawnTurd(emitterX(), emitterY(), pressure))
        pressure *= 0.55
        pulse = 1
        shake = Math.min(12, shake + 4)
        stinks.push({ x: emitterX(), y: emitterY() + 10, r: 20, life: 1 })
        if (Math.random() < 0.35) {
          whispers.push({
            text: WHISPERS[Math.floor(Math.random() * WHISPERS.length)],
            x: rnd(w * 0.15, w * 0.85),
            y: rnd(h * 0.25, h * 0.75),
            life: 1,
            rot: rnd(-0.2, 0.2),
          })
        }
      }

      shake *= 0.88

      for (let i = turds.length - 1; i >= 0; i--) {
        const t = turds[i]
        t.age += dt
        t.vy += GRAVITY * dt
        t.vx *= 1 - dt * 0.4
        t.vy *= 1 - dt * 0.08
        t.x += t.vx * dt
        t.y += t.vy * dt
        t.rot += t.rotV * dt
        t.rotV *= 1 - dt * 2.5
        t.squishX += (1 - t.squishX) * dt * 6
        t.squishY += (1 - t.squishY) * dt * 6

        const floor = h - 24
        if (t.y + t.r > floor) {
          t.y = floor - t.r
          if (Math.abs(t.vy) > 80) {
            shake = Math.min(10, shake + Math.abs(t.vy) * 0.02)
            stinks.push({ x: t.x, y: t.y + t.r, r: t.r * 1.5, life: 0.8 })
          }
          t.vy *= -0.28
          t.vx *= 0.72
          t.squishX = 1.35
          t.squishY = 0.65
          t.grounded = true
        }

        if (t.x - t.r < 0) {
          t.x = t.r
          t.vx *= -0.35
        }
        if (t.x + t.r > w) {
          t.x = w - t.r
          t.vx *= -0.35
        }

        if (t.grounded && Math.abs(t.vy) < 8 && Math.abs(t.vx) < 8 && t.age > 8) {
          turds.splice(i, 1)
        }
      }

      for (let i = 0; i < turds.length; i++) {
        for (let j = i + 1; j < turds.length; j++) {
          resolveCircleCollision(turds[i], turds[j])
        }
      }

      for (const f of flies) {
        f.phase += dt * 14
        f.vx += Math.sin(f.phase) * 40 * dt
        f.vy += Math.cos(f.phase * 1.3) * 40 * dt
        f.x += f.vx * dt
        f.y += f.vy * dt
        f.vx *= 0.98
        f.vy *= 0.98
        if (f.x < 0 || f.x > w) f.vx *= -1
        if (f.y < 0 || f.y > h) f.vy *= -1
      }

      for (let i = stinks.length - 1; i >= 0; i--) {
        stinks[i].life -= dt * 0.7
        stinks[i].r += dt * 55
        if (stinks[i].life <= 0) stinks.splice(i, 1)
      }

      for (let i = whispers.length - 1; i >= 0; i--) {
        whispers[i].life -= dt * 0.35
        if (whispers[i].life <= 0) whispers.splice(i, 1)
      }

      const sx = (Math.random() - 0.5) * shake
      const sy = (Math.random() - 0.5) * shake

      ctx.save()
      ctx.translate(sx, sy)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#1a1208')
      bg.addColorStop(0.45, '#2a1f0a')
      bg.addColorStop(1, '#0d1a0a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.globalAlpha = 0.07
      ctx.fillStyle = '#84cc16'
      for (let i = 0; i < 6; i++) {
        const gy = ((time * 30 + i * 90) % (h + 100)) - 50
        ctx.fillRect(0, gy, w, 2)
      }
      ctx.globalAlpha = 1

      for (const s of stinks) {
        ctx.strokeStyle = `rgba(132, 204, 22, ${s.life * 0.25})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = `rgba(180, 83, 9, ${s.life * 0.15})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 0.65, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(15, 10, 5, 0.85)'
      ctx.fillRect(0, h - 24, w, 24)
      ctx.fillStyle = 'rgba(60, 35, 15, 0.5)'
      for (let x = 0; x < w; x += 40) {
        ctx.fillRect(x, h - 24, 20, 4)
      }

      for (const t of turds) drawTurd(ctx, t)

      drawVoidPortal(ctx, emitterX(), h * 0.1, pulse, time)

      for (const f of flies) {
        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)'
        ctx.beginPath()
        ctx.ellipse(f.x, f.y, 3, 2, f.phase, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 0.3
        ctx.strokeStyle = '#666'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.ellipse(f.x - 6, f.y - 4, 8, 4, f.phase * 0.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      ctx.font = '11px ui-monospace, monospace'
      for (const wsp of whispers) {
        ctx.save()
        ctx.translate(wsp.x, wsp.y)
        ctx.rotate(wsp.rot)
        ctx.globalAlpha = wsp.life * 0.55
        ctx.fillStyle = '#a3e635'
        ctx.fillText(wsp.text, 0, 0)
        ctx.restore()
      }

      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(2, 0, 3, h)
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(w - 5, 0, 3, h)
      ctx.globalAlpha = 1

      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = 'rgba(180, 120, 60, 0.45)'
      ctx.fillText('PhysX™ Void Emitter · pressure ' + pressure.toFixed(2), 12, h - 8)

      ctx.restore()

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[5]"
      aria-label="PhysX poo simulation"
    />
  )
}
