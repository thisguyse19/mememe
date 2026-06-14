import { useCallback, useEffect, useRef } from 'react'

const GRID = 96
const DAMPING = 0.991

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
  lastX: number
  lastY: number
  lastT: number
  throwVx: number
  throwVy: number
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
  const hx = sampleHeight(field, size, px + eps, py, width, height) -
    sampleHeight(field, size, px - eps, py, width, height)
  const hy = sampleHeight(field, size, px, py + eps, width, height) -
    sampleHeight(field, size, px, py - eps, width, height)
  const nx = -hx * 2.2
  const ny = -hy * 2.2
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

function drawWater(
  ctx: CanvasRenderingContext2D,
  offCtx: CanvasRenderingContext2D,
  field: Float32Array,
  size: number,
  width: number,
  height: number,
  time: number,
) {
  const scale = 0.45
  const rw = Math.max(1, Math.floor(width * scale))
  const rh = Math.max(1, Math.floor(height * scale))
  offCtx.canvas.width = rw
  offCtx.canvas.height = rh
  const image = offCtx.createImageData(rw, rh)
  const data = image.data

  for (let py = 0; py < rh; py++) {
    for (let px = 0; px < rw; px++) {
      const sx = (px / rw) * width
      const sy = (py / rh) * height
      const { nx, ny, h } = sampleNormal(field, size, sx, sy, width, height)
      const depth = sy / height
      const caustic =
        Math.sin(sx * 0.018 + time * 1.4) * Math.cos(sy * 0.014 - time * 1.1) * 0.04
      const light = Math.max(0, nx * 0.35 + ny * 0.25 + 0.55 + h * 3.5 + caustic)

      const deepR = 2 + depth * 8
      const deepG = 18 + depth * 28
      const deepB = 48 + depth * 42

      const shallowR = 24 + light * 55
      const shallowG = 72 + light * 95
      const shallowB = 110 + light * 110

      const mix = Math.min(1, Math.max(0, light * 0.85 + h * 8))
      const r = deepR * (1 - mix) + shallowR * mix
      const g = deepG * (1 - mix) + shallowG * mix
      const b = deepB * (1 - mix) + shallowB * mix

      const spec = Math.pow(Math.max(0, nx * 0.6 + ny * 0.2 + 0.4), 6) * 80
      const idx = (py * rw + px) * 4
      data[idx] = Math.min(255, r + spec)
      data[idx + 1] = Math.min(255, g + spec * 0.8)
      data[idx + 2] = Math.min(255, b + spec)
      data[idx + 3] = 255
    }
  }

  offCtx.putImageData(image, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(offCtx.canvas, 0, 0, width, height)
}

function drawDuck(
  ctx: CanvasRenderingContext2D,
  duck: DuckBody,
  bob: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width, height) * 0.00085
  const s = scale * 72
  const x = duck.x
  const y = duck.y + bob

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(duck.angle)

  // water shadow
  ctx.save()
  ctx.scale(1, 0.35)
  ctx.fillStyle = 'rgba(0, 20, 40, 0.35)'
  ctx.beginPath()
  ctx.ellipse(4, s * 0.55, s * 0.55, s * 0.28, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // body
  const bodyGrad = ctx.createRadialGradient(-s * 0.1, -s * 0.15, s * 0.1, 0, 0, s * 0.55)
  bodyGrad.addColorStop(0, '#ffe566')
  bodyGrad.addColorStop(0.55, '#ffc400')
  bodyGrad.addColorStop(1, '#e6a800')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.52, s * 0.38, 0, 0, Math.PI * 2)
  ctx.fill()

  // head
  const headGrad = ctx.createRadialGradient(-s * 0.05, -s * 0.35, s * 0.05, -s * 0.05, -s * 0.28, s * 0.28)
  headGrad.addColorStop(0, '#fff176')
  headGrad.addColorStop(1, '#ffc400')
  ctx.fillStyle = headGrad
  ctx.beginPath()
  ctx.arc(-s * 0.05, -s * 0.28, s * 0.26, 0, Math.PI * 2)
  ctx.fill()

  // beak
  ctx.fillStyle = '#ff7043'
  ctx.beginPath()
  ctx.moveTo(-s * 0.28, -s * 0.26)
  ctx.lineTo(-s * 0.52, -s * 0.22)
  ctx.lineTo(-s * 0.28, -s * 0.18)
  ctx.closePath()
  ctx.fill()

  // eye
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath()
  ctx.arc(-s * 0.12, -s * 0.32, s * 0.045, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(-s * 0.1, -s * 0.34, s * 0.018, 0, Math.PI * 2)
  ctx.fill()

  // wing highlight
  ctx.fillStyle = 'rgba(255, 220, 80, 0.45)'
  ctx.beginPath()
  ctx.ellipse(s * 0.12, -s * 0.02, s * 0.18, s * 0.12, 0.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function DuckPond() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buffersRef = useRef(createWaterBuffers(GRID))
  const duckRef = useRef<DuckBody>({ x: 0, y: 0, vx: 0, vy: 0, angle: 0, angularVel: 0 })
  const dragRef = useRef<DragState>({
    active: false,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
    lastT: 0,
    throwVx: 0,
    throwVy: 0,
  })
  const sizeRef = useRef({ w: 0, h: 0 })
  const rafRef = useRef(0)
  const timeRef = useRef(0)

  const DUCK_R = 42
  const RESTITUTION = 0.62
  const WATER_DRAG = 0.988
  const BUOYANCY = 0.08

  const pointerToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

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
    for (let i = 0; i < 8; i++) {
      disturb(
        current,
        GRID,
        Math.random() * w,
        Math.random() * h,
        w,
        h,
        40 + Math.random() * 60,
        0.35 + Math.random() * 0.4,
      )
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

      // swap & propagate water
      for (let y = 1; y < GRID - 1; y++) {
        for (let x = 1; x < GRID - 1; x++) {
          const i = y * GRID + x
          const sum =
            buf.previous[i - 1] +
            buf.previous[i + 1] +
            buf.previous[i - GRID] +
            buf.previous[i + GRID]
          buf.current[i] = ((sum / 2 - buf.current[i]) * DAMPING)
        }
      }
      ;[buf.current, buf.previous] = [buf.previous, buf.current]

      // ambient wind ripples
      if (Math.random() < 0.02) {
        disturb(buf.current, GRID, Math.random() * w, Math.random() * h, w, h, 28, 0.18)
      }

      if (drag.active) {
        // position set by pointer handlers
      } else {
        duck.vx *= WATER_DRAG
        duck.vy *= WATER_DRAG

        const waveH = sampleHeight(buf.current, GRID, duck.x, duck.y, w, h)
        const { nx, ny } = sampleNormal(buf.current, GRID, duck.x, duck.y, w, h)

        // drift with subtle current + wave slope
        duck.vx += nx * BUOYANCY * 60 * dt
        duck.vy += ny * BUOYANCY * 60 * dt

        duck.x += duck.vx * dt * 60
        duck.y += duck.vy * dt * 60

        // edge bounce
        if (duck.x < DUCK_R) {
          duck.x = DUCK_R
          duck.vx = Math.abs(duck.vx) * RESTITUTION
          disturb(buf.current, GRID, duck.x, duck.y, w, h, 50, 1.2)
        } else if (duck.x > w - DUCK_R) {
          duck.x = w - DUCK_R
          duck.vx = -Math.abs(duck.vx) * RESTITUTION
          disturb(buf.current, GRID, duck.x, duck.y, w, h, 50, 1.2)
        }
        if (duck.y < DUCK_R) {
          duck.y = DUCK_R
          duck.vy = Math.abs(duck.vy) * RESTITUTION
          disturb(buf.current, GRID, duck.x, duck.y, w, h, 50, 1.2)
        } else if (duck.y > h - DUCK_R) {
          duck.y = h - DUCK_R
          duck.vy = -Math.abs(duck.vy) * RESTITUTION
          disturb(buf.current, GRID, duck.x, duck.y, w, h, 50, 1.2)
        }

        duck.angularVel += (duck.vx * 0.004 - duck.angle * 0.06) * dt * 60
        duck.angularVel *= 0.94
        duck.angle += duck.angularVel * dt * 60

        const speed = Math.hypot(duck.vx, duck.vy)
        if (speed > 0.4) {
          disturb(buf.current, GRID, duck.x, duck.y, w, h, 36 + speed * 2, speed * 0.15)
        }

        void waveH
      }

      drawWater(ctx, offCtx, buf.current, GRID, w, h, timeRef.current)

      const bob = sampleHeight(buf.current, GRID, duck.x, duck.y, w, h) * 14
      drawDuck(ctx, duck, bob, w, h)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = pointerToCanvas(e.clientX, e.clientY)
      const duck = duckRef.current
      const dist = Math.hypot(x - duck.x, y - (duck.y + sampleHeight(buffersRef.current.current, GRID, duck.x, duck.y, sizeRef.current.w, sizeRef.current.h) * 14))
      if (dist > DUCK_R * 1.6) return

      canvas.setPointerCapture(e.pointerId)
      dragRef.current = {
        active: true,
        offsetX: x - duck.x,
        offsetY: y - duck.y,
        lastX: x,
        lastY: y,
        lastT: performance.now(),
        throwVx: 0,
        throwVy: 0,
      }
      duck.vx = 0
      duck.vy = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      const { x, y } = pointerToCanvas(e.clientX, e.clientY)
      const { w, h } = sizeRef.current
      const duck = duckRef.current
      const now = performance.now()
      const dt = Math.max(0.001, (now - dragRef.current.lastT) / 1000)

      dragRef.current.throwVx = (x - dragRef.current.lastX) / dt
      dragRef.current.throwVy = (y - dragRef.current.lastY) / dt
      dragRef.current.lastX = x
      dragRef.current.lastY = y
      dragRef.current.lastT = now

      duck.x = Math.max(DUCK_R, Math.min(w - DUCK_R, x - dragRef.current.offsetX))
      duck.y = Math.max(DUCK_R, Math.min(h - DUCK_R, y - dragRef.current.offsetY))

      disturb(buffersRef.current.current, GRID, duck.x, duck.y, w, h, 48, 1.4)
      duck.angularVel = dragRef.current.throwVx * 0.002
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      canvas.releasePointerCapture(e.pointerId)
      dragRef.current.active = false
      duckRef.current.vx = dragRef.current.throwVx * 0.35
      duckRef.current.vy = dragRef.current.throwVy * 0.35
      const { w, h } = sizeRef.current
      disturb(buffersRef.current.current, GRID, duckRef.current.x, duckRef.current.y, w, h, 64, 2.2)
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
  }, [pointerToCanvas])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 touch-none"
      aria-label="Duck pond — drag the duck across the water"
    />
  )
}
