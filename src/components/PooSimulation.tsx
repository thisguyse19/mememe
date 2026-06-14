import { useEffect, useRef } from 'react'

type Blob = {
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
  lit: number
  age: number
  seed: number
  liquid: boolean
}

type Droplet = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  hue: number
  sat: number
  trail: boolean
}

type Stain = {
  x: number
  y: number
  r: number
  life: number
  maxLife: number
  hue: number
  drip: number
}

type Bubble = {
  x: number
  y: number
  vy: number
  r: number
  life: number
}

type Fly = { x: number; y: number; vx: number; vy: number; phase: number }
type StinkWave = { x: number; y: number; r: number; life: number }
type Whisper = { text: string; x: number; y: number; life: number; rot: number }

const WHISPERS = [
  'splorch',
  'viscosity: unset',
  'wet',
  'forbidden slurry',
  'you hear that?',
  'schlop schlop schlop',
  'surface tension failing',
  'it spreads',
  'NVIDIA GeForce Poo',
  'gurgle',
  'do not slip',
]

const GRAVITY = 1180
const MAX_BLOBS = 70
const MAX_DROPLETS = 220
const MAX_STAINS = 55
const MAX_BUBBLES = 35

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function spawnBlob(ex: number, ey: number, pressure: number, liquid = false): Blob {
  const speed = rnd(80, 220) + pressure * 200
  return {
    x: ex + rnd(-14, 14),
    y: ey + rnd(-4, 8),
    vx: rnd(-90, 90) * (0.4 + pressure * 0.4),
    vy: speed * rnd(0.35, 0.75),
    r: liquid ? rnd(6, 14) + pressure * 6 : rnd(14, 24) + pressure * 10,
    rot: rnd(0, Math.PI * 2),
    rotV: rnd(-8, 8),
    squishX: 1.1,
    squishY: 0.85,
    hue: rnd(22, 42),
    sat: rnd(62, 92),
    lit: rnd(28, 42),
    age: 0,
    seed: Math.random() * 1000,
    liquid,
  }
}

function spawnDroplet(
  x: number,
  y: number,
  vx: number,
  vy: number,
  r: number,
  hue: number,
  sat: number,
  trail = false,
): Droplet {
  return { x, y, vx, vy, r, life: rnd(0.4, 1.2), hue, sat, trail }
}

function burstSplash(
  droplets: Droplet[],
  x: number,
  y: number,
  vy: number,
  hue: number,
  sat: number,
  intensity: number,
) {
  const n = Math.floor(6 + intensity * 14)
  for (let i = 0; i < n && droplets.length < MAX_DROPLETS; i++) {
    const a = rnd(-Math.PI * 0.85, -Math.PI * 0.15)
    const sp = rnd(80, 320 + intensity * 280)
    droplets.push(
      spawnDroplet(
        x + rnd(-4, 4),
        y,
        Math.cos(a) * sp + rnd(-40, 40),
        Math.sin(a) * sp * 0.6 + vy * 0.25,
        rnd(2, 7 + intensity * 4),
        hue + rnd(-4, 4),
        sat,
        true,
      ),
    )
  }
}

function addStain(stains: Stain[], x: number, r: number, hue: number, floor: number) {
  if (stains.length >= MAX_STAINS) stains.shift()
  stains.push({
    x,
    y: floor - rnd(2, 8),
    r,
    life: 0,
    maxLife: rnd(12, 28),
    hue,
    drip: Math.random() < 0.4 ? rnd(0.5, 2) : 0,
  })
}

function drawLiquid(ctx: CanvasRenderingContext2D, b: Blob) {
  const speed = Math.hypot(b.vx, b.vy)
  ctx.save()
  ctx.translate(b.x, b.y)
  ctx.rotate(b.rot)
  ctx.scale(b.squishX, b.squishY)

  if (speed > 60 && b.liquid) {
    ctx.strokeStyle = `hsla(${b.hue}, ${b.sat}%, ${b.lit + 8}%, 0.35)`
    ctx.lineWidth = b.r * 0.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-b.vx * 0.02, -b.vy * 0.015)
    ctx.lineTo(-b.vx * 0.06, -b.vy * 0.045)
    ctx.stroke()
  }

  const grad = ctx.createRadialGradient(-b.r * 0.25, -b.r * 0.3, b.r * 0.05, 0, 0, b.r * 1.1)
  grad.addColorStop(0, `hsl(${b.hue + 8} ${b.sat}% ${b.lit + 18}%)`)
  grad.addColorStop(0.35, `hsl(${b.hue} ${b.sat + 5}% ${b.lit}%)`)
  grad.addColorStop(0.75, `hsl(${b.hue - 6} ${b.sat + 10}% ${b.lit - 12}%)`)
  grad.addColorStop(1, `hsl(${b.hue - 10} ${b.sat + 15}% ${b.lit - 20}%)`)

  ctx.fillStyle = grad
  ctx.beginPath()
  if (b.liquid) {
    ctx.ellipse(0, 0, b.r * 1.05, b.r * 0.82, 0, 0, Math.PI * 2)
  } else {
    const lumps = 6
    for (let i = 0; i < lumps; i++) {
      const a = (i / lumps) * Math.PI * 2
      const wob = Math.sin(b.seed + i * 1.4 + b.age * 3) * 0.18
      const lx = Math.cos(a) * b.r * (0.5 + wob)
      const ly = Math.sin(a) * b.r * (0.42 + wob)
      if (i === 0) ctx.moveTo(lx, ly)
      else ctx.lineTo(lx, ly)
    }
    ctx.closePath()
  }
  ctx.fill()

  ctx.fillStyle = `rgba(255, 255, 220, ${0.12 + speed * 0.0004})`
  ctx.beginPath()
  ctx.ellipse(-b.r * 0.25, -b.r * 0.28, b.r * 0.22, b.r * 0.12, -0.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(60, 30, 8, 0.25)'
  ctx.beginPath()
  ctx.ellipse(b.r * 0.1, b.r * 0.15, b.r * 0.4, b.r * 0.2, 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawDroplet(ctx: CanvasRenderingContext2D, d: Droplet) {
  ctx.save()
  ctx.globalAlpha = Math.min(1, d.life * 1.4)
  const g = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r)
  g.addColorStop(0, `hsl(${d.hue + 5} ${d.sat}% 45%)`)
  g.addColorStop(1, `hsl(${d.hue} ${d.sat + 8}% 22%)`)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(d.x, d.y, d.r * 1.1, d.r * 0.95, Math.atan2(d.vy, d.vx), 0, Math.PI * 2)
  ctx.fill()
  if (d.trail && Math.hypot(d.vx, d.vy) > 100) {
    ctx.strokeStyle = `hsla(${d.hue}, ${d.sat}%, 35%, 0.4)`
    ctx.lineWidth = d.r * 0.6
    ctx.beginPath()
    ctx.moveTo(d.x, d.y)
    ctx.lineTo(d.x - d.vx * 0.018, d.y - d.vy * 0.018)
    ctx.stroke()
  }
  ctx.restore()
}

function drawStain(ctx: CanvasRenderingContext2D, s: Stain) {
  const fade = 1 - s.life / s.maxLife
  ctx.save()
  ctx.globalAlpha = fade * 0.55
  const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
  g.addColorStop(0, `hsla(${s.hue}, 70%, 28%, 0.7)`)
  g.addColorStop(0.6, `hsla(${s.hue}, 80%, 18%, 0.45)`)
  g.addColorStop(1, 'hsla(30, 60%, 10%, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(s.x, s.y, s.r * 1.2, s.r * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()

  if (s.drip > 0) {
    const dripLen = s.drip * 18 * fade
    ctx.fillStyle = `hsla(${s.hue}, 75%, 25%, ${fade * 0.5})`
    ctx.beginPath()
    ctx.moveTo(s.x - 3, s.y)
    ctx.quadraticCurveTo(s.x + s.drip * 4, s.y + dripLen * 0.5, s.x + 2, s.y + dripLen)
    ctx.lineTo(s.x - 2, s.y + dripLen)
    ctx.fill()
  }
  ctx.restore()
}

function drawVoidPortal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pulse: number,
  time: number,
  dripping: boolean,
) {
  ctx.save()
  ctx.translate(cx, cy)
  const wobble = Math.sin(time * 3.1) * 2

  ctx.fillStyle = '#1c1917'
  ctx.fillRect(-70, -36 + wobble, 140, 28)
  ctx.fillStyle = '#44403c'
  ctx.fillRect(-58, -10 + wobble, 116, 8)

  const holeGrad = ctx.createRadialGradient(0, 18 + wobble, 2, 0, 18 + wobble, 42 + pulse * 12)
  holeGrad.addColorStop(0, '#050403')
  holeGrad.addColorStop(0.35, '#2a1508')
  holeGrad.addColorStop(0.65, `rgba(140, 70, 20, ${0.45 + pulse * 0.4})`)
  holeGrad.addColorStop(1, 'rgba(132, 204, 22, 0)')

  ctx.fillStyle = holeGrad
  ctx.beginPath()
  ctx.ellipse(0, 18 + wobble, 36 + pulse * 10, 18 + pulse * 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(163, 230, 53, ${0.2 + pulse * 0.4})`
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    const r = 10 + i * 9 + pulse * 8
    ctx.ellipse(0, 18 + wobble, r, r * 0.42, time * 2.2 + i * 0.8, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (pulse > 0.45 || dripping) {
    const dripPhase = time * 5
    for (let d = -1; d <= 1; d++) {
      const len = 18 + pulse * 35 + Math.sin(dripPhase + d) * 8
      ctx.fillStyle = `rgba(120, 55, 15, ${0.35 + pulse * 0.35})`
      ctx.beginPath()
      ctx.moveTo(d * 8, 28 + wobble)
      ctx.quadraticCurveTo(d * 12 + Math.sin(dripPhase) * 3, 28 + len * 0.5, d * 6, 28 + len)
      ctx.quadraticCurveTo(d * 2, 28 + len * 1.1, d * 8, 28 + len * 0.85)
      ctx.fill()
    }
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

    const blobs: Blob[] = []
    const droplets: Droplet[] = []
    const stains: Stain[] = []
    const bubbles: Bubble[] = []
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

    for (let i = 0; i < 14; i++) {
      flies.push({ x: rnd(w * 0.2, w * 0.8), y: rnd(h * 0.3, h * 0.85), vx: rnd(-50, 50), vy: rnd(-50, 50), phase: rnd(0, Math.PI * 2) })
    }

    const emitterX = () => w * 0.5
    const emitterY = () => h * 0.14 + 36
    const floor = () => h - 24

    const emitBurst = (intensity: number) => {
      const ex = emitterX()
      const ey = emitterY()
      blobs.push(spawnBlob(ex, ey, intensity, false))
      for (let i = 0; i < 4 + intensity * 6 && blobs.length < MAX_BLOBS; i++) {
        blobs.push(spawnBlob(ex, ey, intensity * 0.85, true))
      }
      for (let i = 0; i < 8 + intensity * 10 && droplets.length < MAX_DROPLETS; i++) {
        droplets.push(
          spawnDroplet(ex + rnd(-12, 12), ey, rnd(-60, 60), rnd(60, 200), rnd(2, 5), rnd(22, 40), rnd(70, 95), true),
        )
      }
      for (let i = 0; i < 3 && bubbles.length < MAX_BUBBLES; i++) {
        bubbles.push({ x: ex + rnd(-20, 20), y: ey + rnd(0, 30), vy: rnd(-30, -80), r: rnd(3, 8), life: rnd(0.6, 1.4) })
      }
      stinks.push({ x: ex, y: ey + 10, r: 24, life: 1 })
      shake = Math.min(14, shake + 3 + intensity * 5)
      if (Math.random() < 0.4) {
        whispers.push({
          text: WHISPERS[Math.floor(Math.random() * WHISPERS.length)],
          x: rnd(w * 0.1, w * 0.9),
          y: rnd(h * 0.2, h * 0.8),
          life: 1,
          rot: rnd(-0.25, 0.25),
        })
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      time += dt
      const ground = floor()

      pressure = Math.min(1, pressure + dt * 0.28)
      pulse = 0.35 + Math.sin(time * 3.2) * 0.18 + pressure * 0.58

      if (pressure > 0.65 && blobs.length < MAX_BLOBS && Math.random() < dt * 9) {
        emitBurst(pressure)
        pressure *= 0.45
        pulse = 1
      }

      if (pressure > 0.4 && Math.random() < dt * 4) {
        const ex = emitterX()
        const ey = emitterY()
        droplets.push(spawnDroplet(ex + rnd(-10, 10), ey, rnd(-20, 20), rnd(40, 120), rnd(1.5, 4), 30, 80, true))
      }

      shake *= 0.86

      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i]
        b.age += dt
        b.vy += GRAVITY * dt
        b.vx *= 1 - dt * (b.liquid ? 0.8 : 1.8)
        b.vy *= 1 - dt * 0.04
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.rot += b.rotV * dt
        b.rotV *= 1 - dt * 1.8
        b.squishX += (1 - b.squishX) * dt * 8
        b.squishY += (1 - b.squishY) * dt * 8

        b.r = Math.max(3, b.r - dt * (b.liquid ? 0.15 : 0.05))

        if (b.y + b.r > ground) {
          const impact = Math.abs(b.vy)
          b.y = ground - b.r
          if (impact > 50) {
            burstSplash(droplets, b.x, b.y + b.r * 0.5, b.vy, b.hue, b.sat, impact / 400)
            addStain(stains, b.x, b.r * rnd(1.2, 2.2), b.hue, ground)
            shake = Math.min(12, shake + impact * 0.025)
            stinks.push({ x: b.x, y: ground, r: b.r * 2, life: 0.9 })
          }
          b.vy *= -0.12
          b.vx *= 0.55
          b.squishX = 1.55
          b.squishY = 0.45
          if (b.liquid || b.r < 5) {
            addStain(stains, b.x, b.r * 1.5, b.hue, ground)
            blobs.splice(i, 1)
            continue
          }
        }

        if (b.x - b.r < 0) { b.x = b.r; b.vx *= -0.2; burstSplash(droplets, b.x, b.y, b.vy * 0.3, b.hue, b.sat, 0.3) }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx *= -0.2; burstSplash(droplets, b.x, b.y, b.vy * 0.3, b.hue, b.sat, 0.3) }

        if (b.age > 14 && b.r < 6) blobs.splice(i, 1)
      }

      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i]
          const b = blobs[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.hypot(dx, dy)
          const min = a.r + b.r
          if (dist < min && dist > 0) {
            const nx = dx / dist
            const ny = dy / dist
            const push = (min - dist) * 0.35
            a.x -= nx * push
            a.y -= ny * push
            b.x += nx * push
            b.y += ny * push
            a.squishX = 0.7
            a.squishY = 1.3
            b.squishX = 0.7
            b.squishY = 1.3
          }
        }
      }

      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i]
        d.life -= dt
        d.vy += GRAVITY * dt * 1.05
        d.vx *= 1 - dt * 0.5
        d.x += d.vx * dt
        d.y += d.vy * dt

        if (d.y + d.r > ground) {
          d.y = ground - d.r
          if (Math.abs(d.vy) > 60) {
            burstSplash(droplets, d.x, ground, d.vy * 0.2, d.hue, d.sat, Math.abs(d.vy) / 500)
            addStain(stains, d.x, d.r * 2.5, d.hue, ground)
          } else {
            addStain(stains, d.x, d.r * 1.8, d.hue, ground)
          }
          droplets.splice(i, 1)
          continue
        }
        if (d.life <= 0 || d.x < -20 || d.x > w + 20) droplets.splice(i, 1)
      }

      for (const s of stains) s.life += dt

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]
        b.life -= dt
        b.vy -= 40 * dt
        b.x += Math.sin(time * 6 + b.r) * dt * 20
        b.y += b.vy * dt
        if (b.life <= 0 || b.y < 0) bubbles.splice(i, 1)
      }

      for (const f of flies) {
        f.phase += dt * 16
        f.vx += Math.sin(f.phase) * 55 * dt
        f.vy += Math.cos(f.phase * 1.2) * 55 * dt
        f.x += f.vx * dt
        f.y += f.vy * dt
        f.vx *= 0.97
        f.vy *= 0.97
        if (f.x < 0 || f.x > w) f.vx *= -1
        if (f.y < 0 || f.y > h) f.vy *= -1
      }

      for (let i = stinks.length - 1; i >= 0; i--) {
        stinks[i].life -= dt * 0.65
        stinks[i].r += dt * 70
        if (stinks[i].life <= 0) stinks.splice(i, 1)
      }
      for (let i = whispers.length - 1; i >= 0; i--) {
        whispers[i].life -= dt * 0.32
        if (whispers[i].life <= 0) whispers.splice(i, 1)
      }

      const sx = (Math.random() - 0.5) * shake
      const sy = (Math.random() - 0.5) * shake

      ctx.save()
      ctx.translate(sx, sy)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#141008')
      bg.addColorStop(0.4, '#221808')
      bg.addColorStop(1, '#0a140a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.globalAlpha = 0.09
      ctx.fillStyle = '#84cc16'
      for (let i = 0; i < 8; i++) {
        const gy = ((time * 35 + i * 70) % (h + 120)) - 60
        ctx.fillRect(0, gy, w, 3)
      }
      ctx.globalAlpha = 1

      for (const s of stinks) {
        ctx.strokeStyle = `rgba(132, 204, 22, ${s.life * 0.3})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = `rgba(234, 179, 8, ${s.life * 0.18})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(12, 8, 4, 0.92)'
      ctx.fillRect(0, ground, w, h - ground)
      for (const s of stains) drawStain(ctx, s)

      ctx.fillStyle = 'rgba(40, 25, 10, 0.35)'
      for (let x = 0; x < w; x += 30) {
        ctx.fillRect(x, ground, 14, 3)
      }

      for (const b of blobs) {
        for (const other of blobs) {
          const dx = other.x - b.x
          const dy = other.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && dist < (b.r + other.r) * 1.4) {
            ctx.strokeStyle = `hsla(${b.hue}, 70%, 30%, ${0.15 * (1 - dist / ((b.r + other.r) * 1.4))})`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(b.x, b.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
          }
        }
      }

      for (const d of droplets) drawDroplet(ctx, d)
      for (const b of blobs) drawLiquid(ctx, b)

      drawVoidPortal(ctx, emitterX(), h * 0.1, pulse, time, pressure > 0.35)

      for (const b of bubbles) {
        ctx.strokeStyle = `rgba(200, 255, 150, ${b.life * 0.35})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(180, 230, 100, ${b.life * 0.08})`
        ctx.fill()
      }

      for (const f of flies) {
        ctx.fillStyle = 'rgba(15, 15, 15, 0.9)'
        ctx.beginPath()
        ctx.ellipse(f.x, f.y, 3, 2, f.phase, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.font = '11px ui-monospace, monospace'
      for (const wsp of whispers) {
        ctx.save()
        ctx.translate(wsp.x, wsp.y)
        ctx.rotate(wsp.rot)
        ctx.globalAlpha = wsp.life * 0.5
        ctx.fillStyle = '#bef264'
        ctx.fillText(wsp.text, 0, 0)
        ctx.restore()
      }

      ctx.globalAlpha = 0.1
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(2, 0, 3, h)
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(w - 5, 0, 3, h)
      ctx.globalAlpha = 1

      ctx.font = '10px ui-monospace, monospace'
      ctx.fillStyle = 'rgba(180, 120, 60, 0.5)'
      ctx.fillText(
        `PhysX™ Slurry Engine · pressure ${pressure.toFixed(2)} · ${droplets.length} droplets`,
        12,
        h - 8,
      )

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
      aria-label="PhysX liquid slurry simulation"
    />
  )
}
