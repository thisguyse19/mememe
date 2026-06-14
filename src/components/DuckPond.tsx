import { useEffect, useRef } from 'react'

const GRID = 96
const DAMPING = 0.993
const DRAG_LISTENER_OPTS = { capture: true, passive: false } as const

type DuckBody = {
  x: number
  y: number
  renderX: number
  renderY: number
  vx: number
  vy: number
  angle: number
  angularVel: number
}

type DragState = {
  active: boolean
  pointerX: number
  pointerY: number
  offsetX: number
  offsetY: number
  motionSamples: { x: number; y: number; t: number }[]
  lastRippleT: number
  input: 'mouse' | 'touch' | null
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

type WaterRenderCache = {
  rw: number
  rh: number
  image: ImageData | null
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  offCtx: CanvasRenderingContext2D,
  field: Float32Array,
  size: number,
  width: number,
  height: number,
  time: number,
  cache: WaterRenderCache,
  lite: boolean,
) {
  const scale = lite ? 0.38 : 0.46
  const rw = Math.max(1, Math.floor(width * scale))
  const rh = Math.max(1, Math.floor(height * scale))

  if (cache.rw !== rw || cache.rh !== rh || !cache.image) {
    cache.rw = rw
    cache.rh = rh
    offCtx.canvas.width = rw
    offCtx.canvas.height = rh
    cache.image = offCtx.createImageData(rw, rh)
  }

  const image = cache.image
  const data = image.data
  const refract = lite ? 14 : 20

  for (let py = 0; py < rh; py++) {
    for (let px = 0; px < rw; px++) {
      const sx = (px / rw) * width
      const sy = (py / rh) * height
      const { nx, ny, h } = sampleNormal(field, size, sx, sy, width, height)
      const depth = sy / height
      const dx = nx * (h * refract * 55 + 2.5)
      const dy = ny * (h * refract * 55 + 2.5)
      const [r, g, b] = waterShade(sx + dx, sy + dy, depth, nx, ny, h, time)

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

function drawDuck(
  ctx: CanvasRenderingContext2D,
  duck: DuckBody,
  bob: number,
  drawX = duck.renderX,
  drawY = duck.renderY,
) {
  const s = 34
  const x = drawX
  const y = drawY + bob

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

  const latest = samples[samples.length - 1]
  const prev = samples[samples.length - 2]
  const instantDt = Math.max(0.001, (latest.t - prev.t) / 1000)
  const instantVx = (latest.x - prev.x) / instantDt
  const instantVy = (latest.y - prev.y) / instantDt

  const windowMs = 140
  let sumVx = 0
  let sumVy = 0
  let sumW = 0
  let peakVx = instantVx
  let peakVy = instantVy
  let peakSpeed = Math.hypot(instantVx, instantVy)

  for (let i = samples.length - 1; i > 0; i--) {
    const a = samples[i]
    const b = samples[i - 1]
    if (latest.t - a.t > windowMs) break

    const segDt = Math.max(0.001, (a.t - b.t) / 1000)
    const svx = (a.x - b.x) / segDt
    const svy = (a.y - b.y) / segDt
    const age = (latest.t - a.t) / windowMs
    const weight = 1 - age * 0.65

    sumVx += svx * weight
    sumVy += svy * weight
    sumW += weight

    const speed = Math.hypot(svx, svy)
    if (speed > peakSpeed) {
      peakSpeed = speed
      peakVx = svx
      peakVy = svy
    }
  }

  if (sumW === 0) return { vx: instantVx, vy: instantVy }

  const avgVx = sumVx / sumW
  const avgVy = sumVy / sumW

  // Favor recent instantaneous speed for flicks; average stabilises slow releases.
  const peakBlend = 0.5
  const instantBlend = 0.35
  const avgBlend = 1 - peakBlend - instantBlend

  return {
    vx: avgVx * avgBlend + instantVx * instantBlend + peakVx * peakBlend,
    vy: avgVy * avgBlend + instantVy * instantBlend + peakVy * peakBlend,
  }
}

export function DuckPond() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buffersRef = useRef(createWaterBuffers(GRID))
  const duckRef = useRef<DuckBody>({
    x: 0,
    y: 0,
    renderX: 0,
    renderY: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVel: 0,
  })
  const dragRef = useRef<DragState>({
    active: false,
    pointerX: 0,
    pointerY: 0,
    offsetX: 0,
    offsetY: 0,
    motionSamples: [],
    lastRippleT: 0,
    input: null,
  })
  const sizeRef = useRef({ w: 0, h: 0 })
  const rafRef = useRef(0)
  const timeRef = useRef(0)
  const wakeRef = useRef(0)
  const bobRef = useRef(0)

  const DUCK_R = 36
  const HIT_R = 52
  const RESTITUTION = 0.62
  const DRAG = 1.15
  const MAX_SPEED = 1100
  const THROW_SCALE = 1
  const BOB_SCALE = 5

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d', { alpha: false })
    if (!offCtx) return

    const waterCache: WaterRenderCache = { rw: 0, rh: 0, image: null }

    const clientToCanvas = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const clampDuck = (x: number, y: number) => {
      const { w, h } = sizeRef.current
      return {
        x: Math.max(DUCK_R, Math.min(w - DUCK_R, x)),
        y: Math.max(DUCK_R, Math.min(h - DUCK_R, y)),
      }
    }

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
      waterCache.rw = 0
      waterCache.rh = 0
      waterCache.image = null

      if (duckRef.current.x === 0 && duckRef.current.y === 0) {
        duckRef.current.x = w * 0.5
        duckRef.current.y = h * 0.52
        duckRef.current.renderX = duckRef.current.x
        duckRef.current.renderY = duckRef.current.y
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

    const addRipple = (
      px: number,
      py: number,
      radius: number,
      strength: number,
      minIntervalMs: number,
    ) => {
      const state = dragRef.current
      const now = performance.now()
      if (minIntervalMs > 0 && now - state.lastRippleT < minIntervalMs) return
      state.lastRippleT = now
      const { w, h } = sizeRef.current
      disturb(buffersRef.current.current, GRID, px, py, w, h, radius, strength)
    }

    const recordMotion = (x: number, y: number, t = performance.now()) => {
      const drag = dragRef.current
      const samples = drag.motionSamples
      const last = samples[samples.length - 1]
      if (last && t - last.t < 4 && Math.hypot(x - last.x, y - last.y) < 0.25) return
      samples.push({ x, y, t })
      if (samples.length > 24) samples.shift()
    }

    const placeDuckAtPointer = () => {
      const drag = dragRef.current
      if (!drag.active) return
      const duck = duckRef.current
      const prevX = duck.x
      const prevY = duck.y
      const pos = clampDuck(drag.pointerX - drag.offsetX, drag.pointerY - drag.offsetY)
      duck.x = pos.x
      duck.y = pos.y
      duck.renderX = pos.x
      duck.renderY = pos.y
      recordMotion(duck.x, duck.y)

      const moveDist = Math.hypot(duck.x - prevX, duck.y - prevY)
      if (moveDist > 0.5) {
        addRipple(duck.x, duck.y, 20, 0.06 + moveDist * 0.004, 70)
      }
    }

    const removeDragListeners = () => {
      document.removeEventListener('pointermove', onPointerMoveWindow, DRAG_LISTENER_OPTS)
      document.removeEventListener('pointerup', onPointerUpWindow, DRAG_LISTENER_OPTS)
      document.removeEventListener('pointercancel', onPointerUpWindow, DRAG_LISTENER_OPTS)
      document.removeEventListener('mousemove', onMouseMoveWindow, DRAG_LISTENER_OPTS)
      document.removeEventListener('mouseup', onMouseUpWindow, DRAG_LISTENER_OPTS)
    }

    const endDrag = () => {
      const drag = dragRef.current
      if (!drag.active) return
      drag.active = false

      const throwV = throwVelocity(drag.motionSamples)
      const capped = clampSpeed(throwV.vx * THROW_SCALE, throwV.vy * THROW_SCALE, MAX_SPEED)
      duckRef.current.vx = capped.vx
      duckRef.current.vy = capped.vy

      addRipple(duckRef.current.x, duckRef.current.y, 30, 0.16, 0)
      drag.motionSamples = []
      drag.input = null

      removeDragListeners()
    }

    const beginDrag = (clientX: number, clientY: number, input: 'mouse' | 'touch') => {
      const { x, y } = clientToCanvas(clientX, clientY)
      const duck = duckRef.current
      const dist = Math.hypot(x - duck.x, y - duck.y)
      if (dist > HIT_R) return false

      const t = performance.now()
      dragRef.current = {
        active: true,
        pointerX: x,
        pointerY: y,
        offsetX: x - duck.x,
        offsetY: y - duck.y,
        motionSamples: [{ x: duck.x, y: duck.y, t }],
        lastRippleT: 0,
        input,
      }
      duck.vx = 0
      duck.vy = 0
      duck.renderX = duck.x
      duck.renderY = duck.y
      addRipple(duck.x, duck.y, 22, 0.1, 0)

      document.addEventListener('pointermove', onPointerMoveWindow, DRAG_LISTENER_OPTS)
      document.addEventListener('pointerup', onPointerUpWindow, DRAG_LISTENER_OPTS)
      document.addEventListener('pointercancel', onPointerUpWindow, DRAG_LISTENER_OPTS)
      document.addEventListener('mousemove', onMouseMoveWindow, DRAG_LISTENER_OPTS)
      document.addEventListener('mouseup', onMouseUpWindow, DRAG_LISTENER_OPTS)
      return true
    }

    const recordPointer = (clientX: number, clientY: number) => {
      const drag = dragRef.current
      if (!drag.active) return
      const { x, y } = clientToCanvas(clientX, clientY)
      drag.pointerX = x
      drag.pointerY = y
      placeDuckAtPointer()
      const { vx } = throwVelocity(drag.motionSamples)
      duckRef.current.angularVel = vx * 0.00025
    }

    const onPointerMoveWindow = (e: PointerEvent) => {
      if (!dragRef.current.active || dragRef.current.input === 'mouse') return
      e.preventDefault()
      recordPointer(e.clientX, e.clientY)
    }

    const onPointerUpWindow = (e: PointerEvent) => {
      if (!dragRef.current.active || dragRef.current.input === 'mouse') return
      e.preventDefault()
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* Safari may throw if capture was not set */
      }
      endDrag()
    }

    const onMouseMoveWindow = (e: MouseEvent) => {
      if (!dragRef.current.active || dragRef.current.input !== 'mouse') return
      e.preventDefault()
      recordPointer(e.clientX, e.clientY)
    }

    const onMouseUpWindow = (e: MouseEvent) => {
      if (!dragRef.current.active || dragRef.current.input !== 'mouse') return
      e.preventDefault()
      endDrag()
    }

    const onPointerDown = (e: PointerEvent) => {
      // Safari macOS: route mouse through mousedown/mousemove/mouseup — pointerup
      // often fires first with no pointermove samples, killing throw velocity.
      if (e.pointerType === 'mouse') return
      if (e.button !== 0) return
      const started = beginDrag(e.clientX, e.clientY, 'touch')
      if (!started) return
      e.preventDefault()
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* fall back to document listeners */
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || dragRef.current.active) return
      const started = beginDrag(e.clientX, e.clientY, 'mouse')
      if (started) e.preventDefault()
    }

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

      if (drag.active) {
        placeDuckAtPointer()
      } else {
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

        if (hitEdge) addRipple(duck.x, duck.y, 26, 0.14, 60)

        duck.angularVel += (duck.vx * 0.00035 - duck.angle * 0.05) * dt * 60
        duck.angularVel *= Math.pow(0.9, dt * 60)
        duck.angle += duck.angularVel * dt * 60

        const speed = Math.hypot(duck.vx, duck.vy)
        wakeRef.current += dt
        if (speed > 40 && wakeRef.current > 0.07) {
          wakeRef.current = 0
          addRipple(duck.x, duck.y, 18, 0.05 + speed * 0.00008, 70)
        }

        const renderFollow = 1 - Math.exp(-dt * 28)
        duck.renderX += (duck.x - duck.renderX) * renderFollow
        duck.renderY += (duck.y - duck.renderY) * renderFollow
      }

      drawWater(ctx, offCtx, buf.current, GRID, w, h, timeRef.current, waterCache, drag.active)

      const rawBob = drag.active
        ? 0
        : sampleHeight(buf.current, GRID, duck.x, duck.y, w, h) * BOB_SCALE
      const bobFollow = drag.active ? 1 : 1 - Math.exp(-dt * 16)
      bobRef.current += (rawBob - bobRef.current) * bobFollow
      drawDuck(ctx, duck, bobRef.current)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('mousedown', onMouseDown)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      removeDragListeners()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[5] cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      aria-label="Duck pond — drag the duck across the water"
    />
  )
}
