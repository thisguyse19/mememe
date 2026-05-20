import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CODE_LENGTH, SECRET_DESTINATIONS } from '../config/secrets'

const LONG_PRESS_MS = 620
const MOVE_CANCEL_PX = 14

export function SecretPortal() {
  const [armed, setArmed] = useState(false)
  const [buffer, setBuffer] = useState('')
  const [wrong, setWrong] = useState(false)
  const [destination, setDestination] = useState<string | null>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startCoords = useRef<{ x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const escStreak = useRef(0)
  const escReset = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bufferRef = useRef('')
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    bufferRef.current = buffer
  }, [buffer])

  const disarm = useCallback(() => {
    if (wrongTimeoutRef.current) {
      clearTimeout(wrongTimeoutRef.current)
      wrongTimeoutRef.current = null
    }
    setArmed(false)
    setBuffer('')
    setWrong(false)
  }, [])

  const updateBuffer = useCallback((raw: string) => {
    if (wrongTimeoutRef.current) {
      clearTimeout(wrongTimeoutRef.current)
      wrongTimeoutRef.current = null
    }

    const sanitized = raw.toLowerCase().replace(/[^a-z]/g, '').slice(0, CODE_LENGTH)
    if (sanitized.length < CODE_LENGTH) {
      setWrong(false)
    }
    setBuffer(sanitized)

    if (sanitized.length !== CODE_LENGTH) return

    const label = SECRET_DESTINATIONS[sanitized]
    if (label) {
      setDestination(label)
      return
    }

    setWrong(true)
    wrongTimeoutRef.current = window.setTimeout(() => {
      setWrong(false)
      setBuffer('')
      wrongTimeoutRef.current = null
    }, 720)
  }, [])

  useEffect(
    () => () => {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!armed || destination) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        e.preventDefault()
        disarm()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        updateBuffer(bufferRef.current.slice(0, -1))
        return
      }

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault()
        updateBuffer(bufferRef.current + e.key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [armed, destination, disarm, updateBuffer])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || armed || destination) return
      escStreak.current += 1
      if (escReset.current) clearTimeout(escReset.current)
      escReset.current = window.setTimeout(() => {
        escStreak.current = 0
      }, 900)
      if (escStreak.current >= 3) {
        escStreak.current = 0
        setArmed(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (escReset.current) clearTimeout(escReset.current)
    }
  }, [armed, destination])

  useEffect(() => {
    if (armed && !destination) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [armed, destination])

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (armed || destination) return
    startCoords.current = { x: e.clientX, y: e.clientY }
    clearPressTimer()
    pressTimer.current = window.setTimeout(() => {
      setArmed(true)
      startCoords.current = null
    }, LONG_PRESS_MS)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startCoords.current || !pressTimer.current) return
    const dx = e.clientX - startCoords.current.x
    const dy = e.clientY - startCoords.current.y
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      clearPressTimer()
      startCoords.current = null
    }
  }

  const endPointer = () => {
    clearPressTimer()
    startCoords.current = null
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBuffer(e.target.value)
  }

  const filled = buffer.length

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-[box-shadow] duration-700 ${
          armed ? 'shadow-[inset_0_0_120px_rgba(56,189,248,0.08)]' : ''
        }`}
        aria-hidden="true"
      />

      <div className="fixed bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4 pb-[env(safe-area-inset-bottom)]">
        <p
          className={`max-w-xs text-center text-[11px] leading-snug tracking-wide text-sky-100/55 transition-opacity duration-500 sm:text-xs ${
            armed ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-live="polite"
        >
          Soft channel open — type four letters, or press Escape to leave.
        </p>

        <button
          type="button"
          className={`pointer-events-auto flex h-5 w-32 touch-none items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all select-none sm:w-40 ${
            armed ? 'home-oracle-armed scale-[1.02] border-sky-300/40 bg-white/[0.08]' : 'hover:bg-white/[0.07]'
          }`}
          aria-label="Hold to open a hidden channel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
        >
          <span
            className={`h-1 rounded-full transition-all duration-500 ${
              armed ? 'w-[72%] bg-sky-200/80' : 'w-[55%] bg-white/35'
            }`}
          />
        </button>

        <div
          className={`flex gap-2 transition-opacity duration-500 ${
            armed ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${wrong ? 'translate-x-0.5' : ''}`}
          aria-hidden="true"
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                wrong ? 'bg-rose-300/90' : i < filled ? 'bg-sky-200/90 scale-110' : 'bg-white/25'
              }`}
            />
          ))}
        </div>

        {armed && (
          <label className="sr-only" htmlFor="secret-portal-input">
            Hidden passphrase field
          </label>
        )}
        <input
          id="secret-portal-input"
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          value={buffer}
          onChange={onInputChange}
          className="sr-only"
          tabIndex={armed ? 0 : -1}
          aria-hidden={!armed}
        />
      </div>

      <AnimatePresence>
        {destination && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/55 px-6 text-center backdrop-blur-2xl"
            role="status"
            aria-live="assertive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <motion.p
              className="text-lg font-medium tracking-tight text-white sm:text-2xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
            >
              Bringing you to {destination}
              <motion.span
                className="inline-block w-6 text-left"
                aria-hidden="true"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                …
              </motion.span>
            </motion.p>
            <motion.p
              className="mt-4 max-w-md text-sm text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              The destination link is not connected yet — this is a gentle placeholder while the
              path is finished.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
