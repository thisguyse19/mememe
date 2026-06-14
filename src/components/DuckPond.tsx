import { useCallback, useEffect, useRef } from 'react'

const GRID = 112
const DAMPING = 0.993

type DuckBody = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  angularVel: number
}

type DragState = {
  active: boolean
  offsetX: number
  offsetY: number
  samples: { x: number; y: number; t: number }[]
  lastRippleT: number
}

function createWaterBuffers(size: number) {
  const n = size * size
  return {
    current: new Float32Array(n),
    previous: new Float32Array(n),
  }
}

function sampleHeight(
  field: Float32Array,
  size: number,
  px: number,
  py: number,
  width: number,
  height: number,
): number {
  const gx = Math.max(1, Math.min(size - 2, (px / width) * size))
  const gy = Math.max(1, Math.min(size - 2, (py / height) * size))
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const tx = gx - x0
  const ty = gy - y0
  const idx = (x: number, y: number) => y * size + x
  const h00 = field[idx(x0, y0)]
  const h10 = field[idx(x0 + 1, y0)]
  const h01 = field[idx(x0, y0 + 1)]
  const h11 = field[idx(x0 + 1, y0 + 1)]
  const hx0 = h00 * (1 - tx) + h10 * tx
  const hx1 = h01 * (1 - tx) + h11 * tx
  return hx0 * (1 - ty) + hx1 * ty
}

function sampleNormal(
  field: Float32Array,
  size: number,
  px: number,
  py: number,
  width: number,
  height: number,
): { nx: number; ny: number; h: number } {
  const eps = 3
  const h = sampleHeight(field, size, px, py, width, height)
  const hx =
    sampleHeight(field, size, px + eps, py, width, height) -
    sampleHeight(field, size, px - eps, py, width, height)
  const hy =
    sampleHeight(field, size, px, py + eps, width, height) -
    sampleHeight(field, size, px, py - eps, width, height)
  const nx = -hx * 1.4
  const ny = -hy * 1.4
  const len = Math.hypot(nx, ny, 1)
  return { nx: nx / len, ny: ny / len, h }
}

function disturb(
  field: Float32Array,
  size: number,
  px: number,
  py: number,
  width: number,
  height: number,
  radius: number,
  strength: number,
) {
  const cx = (px / width) * size
  const cy = (py / height) * size
  const r = (radius / width) * size
  const r2 = r * r
  const minX = Math.max(1, Math.floor(cx - r))
  const maxX = Math.min(size - 2, Math.ceil(cx + r))
  const minY = Math.max(1, Math.floor(cy - r))
  const maxY = Math.min(size - 2, Math.ceil(cy + r))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx
      const dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= r2) {
        const falloff = 1 - d2 / r2
        field[y * size + x] += strength * falloff * falloff
      }
    }
  }
}

function clampSpeed(vx: number, vy: number, max: number) {
  const speed = Math.hypot(vx, vy)
  if (speed <= max) return { vx, vy }
  const k = max / speed
  return { vx: vx * k, vy: vy * k }
}

function waterShade(
  sx: number,
  sy: number,
  depth: number,
  nx: number,
  ny: number,
  h: number,
  time: number,
): [number, number, number] {
  const caustic =
    Math.sin(sx * 0.014 + time * 0.65) * Math.cos(sy * 0.011 - time * 0.5) * 0.022
  const light = Math.max(0, nx * 0.28 + ny * 0.2 + 0.36 + h * 2.8 + caustic)

  const deepR = 1 + depth * 4
  const deepG = 6 + depth * 12
  const deepB = 18 + depth * 24

  const shallowR = 6 + light * 16
  const shallowG = 22 + light * 28
  const shallowB = 40 + light * 38

  const mix = Math.min(1, Math.max(0, light * 0.5 + Math.abs(h) * 4.5))
  const r = deepR * (1 - mix) + shallowR * mix
  const g = deepG * (1 - mix) + shallowG * mix
  const b = deepB * (1 - mix) + shallowB * mix

  const spec = Math.pow(Math.max(0, nx * 0.5 + ny * 0.18 + 0.26), 7) * 32
  return [
    Math.min(255, r + spec),
    Math.min(255, g + spec * 0.55),
    Math.min(255, b + spec * 0.35),
  ]
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  offCtx: CanvasRenderingContext2D,
  field: Float32Array,
  size: number,
  width: number,
  height: number,
  time: number,
) {
  const scale = 0.5
  const rw = Math.max(1, Math.floor(width * scale))
  const rh = Math.max(1, Math.floor(height * scale))
  offCtx.canvas.width = rw
  offCtx.canvas.height = rh
  const image = offCtx.createImageData(rw, rh)
  const data = image.data
  const refract = 22

  for (let py = 0; py < rh; py++) {
    for (let px = 0; px < rw; px++) {
      const sx = (px / rw) * width
      const sy = (py / rh) * height
      const { nx, ny, h } = sampleNormal(field, size, sx, sy, width, height)
      const depth = sy / height

      // refraction: sample shade from displaced coords for distorted-water look
      const dx = nx * (h * refract * 55 + 2.5)
      const dy = ny * (h * refract * 55 + 2.5)
      const [r, g, b] = waterShade(
        sx + dx,
        sy + dy,
        depth,
        nx,
        ny,
        h,
        time,
      )

      const idx = (py * rw + px) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }

  offCtx.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(offCtx.canvas, 0, 0, width, height)
}

function drawDuck(ctx: CanvasRenderingContext2D, duck: DuckBody, bob: number) {
  const s = 34
  const x = duck.x
  const y = duck.y + bob

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(duck.angle * 0.6)

  ctx.save()
  ctx.scale(1, 0.28)
  ctx.fillStyle = 'rgba(0, 8, 20, 0.28)'
  ctx.beginPath()
  ctx.ellipse(0, s * 1.05, s * 0.72, s * 0.34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const body = ctx.createRadialGradient(-s * 0.08, -s * 0.12, s * 0.08, 0, s * 0.02, s * 0.72)
  body.addColorStop(0, '#fff1a8')
  body.addColorStop(0.45, '#ffd54f')
  body.addColorStop(1, '#f4a900')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(0, s * 0.04, s * 0.62, s * 0.48, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffc107'
  ctx.beginPath()
  ctx.ellipse(s * 0.48, s * 0.02, s * 0.16, s * 0.12, 0.5, 0, Math.PI * 2)
  ctx.fill()

  const head = ctx.createRadialGradient(-s * 0.06, -s * 0.38, s * 0.04, -s * 0.04, -s * 0.32, s * 0.3)
  head.addColorStop(0, '#fff8dc')
  head.addColorStop(1, '#ffca28')
  ctx.fillStyle = head
  ctx.beginPath()
  ctx.arc(-s * 0.04, -s * 0.32, s * 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ff8f00'
  ctx.beginPath()
  ctx.moveTo(-s * 0.28, -s * 0.3)
  ctx.quadraticCurveTo(-s * 0.46, -s * 0.27, -s * 0.44, -s * 0.24)
  ctx.quadraticCurveTo(-s * 0.38, -s * 0.22, -s * 0.28, -s * 0.24)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(-s * 0.1, -s * 0.36, s * 0.038, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(-s * 0.088, -s * 0.372, s * 0.014, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(230, 160, 0, 0.35)'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.ellipse(s * 0.08, s * 0.06, s * 0.22, s * 0.14, 0.55, 0.6, Math.PI * 1.05)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(180, 120, 0, 0.22)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(0, s * 0.04, s * 0.62, s * 0.48, 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

function throwVelocity(samples: { x: number; y: number; t: number }[]) {
  if (samples.length < 2) return { vx: 0, vy: 0 }
  const a = samples[samples.length - 1]
  const b = samples[Math.max(0, samples.length - 4)]
  const dt = Math.max(0.008, a.t - b.t)
  return { vx: (a.x - b.x) / dt, vy: (a.y - b.y) / dt }
}

export function DuckPond() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buffersRef = useRef(createWaterBuffers(GRID))
  const duckRef = useRef<DuckBody>({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVel: 0 })
  const dragRef = useRef<DragState>({
    active: false,
    offsetX: 0,
    offsetY: 0,
    samples: [],
    lastRippleT: 0,
  })
  const sizeRef = useRef({ w: 0, h: 0 })
  const rafRef = useRef(0)
  const timeRef = useRef(0)
  const wakeRef = useRef(0)

  const DUCK_R = 36
  const RESTITUTION = 0.62
  const DRAG = 1.8
  const MAX_SPEED = 920
  const THROW_SCALE = 0.52
  const BOB_SCALE = 5

  const pointerToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const addRipple = useCallback(
    (
      px: number,
      py: number,
      radius: number,
      strength: number,
      minIntervalMs: number,
      state: DragState,
    ) => {
      const now = performance.now()
      if (minIntervalMs > 0 && now - state.lastRippleT < minIntervalMs) return
      state.lastRippleT = now
      const { w, h } = sizeRef.current
      disturb(buffersRef.current.current, GRID, px, py, w, h, radius, strength)
    },
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d', { alpha: false })
    if (!offCtx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      sizeRef.current = { w, h }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (duckRef.current.x === 0 && duckRef.current.y === 0) {
        duckRef.current.x = w * 0.5
        duckRef.current.y = h * 0.52
      }
    }

    resize()

    const { current } = buffersRef.current
    const { w, h } = sizeRef.current
    for (let i = 0; i < 4; i++) {
      disturb(current, GRID, w * (0.25 + i * 0.18), h * (0.35 + i * 0.12), w, h, 28, 0.09)
    }
    buffersRef.current.previous.set(current)

    window.addEventListener('resize', resize)

    let lastFrame = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - lastFrame) / 1000)
      lastFrame = now
      timeRef.current += dt

      const { w, h } = sizeRef.current
      const duck = duckRef.current
      const drag = dragRef.current
      const buf = buffersRef.current

      for (let y = 1; y < GRID - 1; y++) {
        for (let x = 1; x < GRID - 1; x++) {
          const i = y * GRID + x
          const sum =
            buf.previous[i - 1] + buf.previous[i + 1] + buf.previous[i - GRID] + buf.previous[i + GRID]
          buf.current[i] = (sum / 2 - buf.current[i]) * DAMPING
        }
      }
      ;[buf.current, buf.previous] = [buf.previous, buf.current]

      if (!drag.active) {
        const dragFactor = Math.exp(-DRAG * dt)
        duck.vx *= dragFactor
        duck.vy *= dragFactor

        const capped = clampSpeed(duck.vx, duck.vy, MAX_SPEED)
        duck.vx = capped.vx
        duck.vy = capped.vy

        duck.x += duck.vx * dt
        duck.y += duck.vy * dt

        let hitEdge = false
        if (duck.x < DUCK_R) {
          duck.x = DUCK_R
          duck.vx = Math.abs(duck.vx) * RESTITUTION
          hitEdge = true
        } else if (duck.x > w - DUCK_R) {
          duck.x = w - DUCK_R
          duck.vx = -Math.abs(duck.vx) * RESTITUTION
          hitEdge = true
        }
        if (duck.y < DUCK_R) {
          duck.y = DUCK_R
          duck.vy = Math.abs(duck.vy) * RESTITUTION
          hitEdge = true
        } else if (duck.y > h - DUCK_R) {
          duck.y = h - DUCK_R
          duck.vy = -Math.abs(duck.vy) * RESTITUTION
          hitEdge = true
        }

        if (hitEdge) {
          addRipple(duck.x, duck.y, 26, 0.14, 60, drag)
        }

        duck.angularVel += (duck.vx * 0.00035 - duck.angle * 0.05) * dt * 60
        duck.angularVel *= Math.pow(0.9, dt * 60)
        duck.angle += duck.angularVel * dt * 60

        const speed = Math.hypot(duck.vx, duck.vy)
        wakeRef.current += dt
        if (speed > 40 && wakeRef.current > 0.07) {
          wakeRef.current = 0
          addRipple(duck.x, duck.y, 18, 0.05 + speed * 0.00008, 70, drag)
        }
      }

      drawWater(ctx, offCtx, buf.current, GRID, w, h, timeRef.current)

      const bob = sampleHeight(buf.current, GRID, duck.x, duck.y, w, h) * BOB_SCALE
      drawDuck(ctx, duck, bob)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = pointerToCanvas(e.clientX, e.clientY)
      const duck = duckRef.current
      const { w, h } = sizeRef.current
      const bob = sampleHeight(buffersRef.current.current, GRID, duck.x, duck.y, w, h) * BOB_SCALE
      const dist = Math.hypot(x - duck.x, y - (duck.y + bob))
      if (dist > DUCK_R * 1.5) return

      canvas.setPointerCapture(e.pointerId)
      const t = performance.now()
      dragRef.current = {
        active: true,
        offsetX: x - duck.x,
        offsetY: y - duck.y,
        samples: [{ x, y, t }],
        lastRippleT: 0,
      }
      duck.vx = 0
      duck.vy = 0
      addRipple(duck.x, duck.y, 22, 0.1, 0, dragRef.current)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      const { x, y } = pointerToCanvas(e.clientX, e.clientY)
      const { w, h } = sizeRef.current
      const duck = duckRef.current
      const t = performance.now()

      const prevX = duck.x
      const prevY = duck.y

      duck.x = Math.max(DUCK_R, Math.min(w - DUCK_R, x - dragRef.current.offsetX))
      duck.y = Math.max(DUCK_R, Math.min(h - DUCK_R, y - dragRef.current.offsetY))

      dragRef.current.samples.push({ x, y, t })
      if (dragRef.current.samples.length > 8) {
        dragRef.current.samples.shift()
      }

      const moveDist = Math.hypot(duck.x - prevX, duck.y - prevY)
      if (moveDist > 0.5) {
        addRipple(duck.x, duck.y, 20, 0.06 + moveDist * 0.004, 55, dragRef.current)
      }

      const { vx } = throwVelocity(dragRef.current.samples)
      duck.angularVel = vx * 0.00025
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      canvas.releasePointerCapture(e.pointerId)
      dragRef.current.active = false

      const throwV = throwVelocity(dragRef.current.samples)
      const capped = clampSpeed(
        throwV.vx * THROW_SCALE,
        throwV.vy * THROW_SCALE,
        MAX_SPEED,
      )
      duckRef.current.vx = capped.vx
      duckRef.current.vy = capped.vy

      addRipple(duckRef.current.x, duckRef.current.y, 30, 0.16, 0, dragRef.current)
      dragRef.current.samples = []
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [pointerToCanvas, addRipple])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 touch-none"
      aria-label="Duck pond — drag the duck across the water"
    />
  )
}
