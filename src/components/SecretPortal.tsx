import { motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CODE_LENGTH, SECRET_DESTINATIONS } from '../config/secrets'

const LONG_PRESS_MS = 620
const MOVE_CANCEL_PX = 14

function useIsMobileUi() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return isMobile
}

export function SecretPortal() {
  const [armed, setArmed] = useState(false)
  const [buffer, setBuffer] = useState('')
  const [wrong, setWrong] = useState(false)
  const [success, setSuccess] = useState<{ href?: string } | null>(null)
  const isMobile = useIsMobileUi()

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startCoords = useRef<{ x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const escStreak = useRef(0)
  const escReset = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bufferRef = useRef('')
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    bufferRef.current = buffer
  }, [buffer])

  const clearUnlockTimer = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = null
    }
  }, [])

  const disarm = useCallback(() => {
    clearUnlockTimer()
    if (wrongTimeoutRef.current) {
      clearTimeout(wrongTimeoutRef.current)
      wrongTimeoutRef.current = null
    }
    setArmed(false)
    setBuffer('')
    setWrong(false)
    setSuccess(null)
  }, [clearUnlockTimer])

  const updateBuffer = useCallback(
    (raw: string) => {
      if (success) return
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

      const entry = SECRET_DESTINATIONS[sanitized]
      if (entry) {
        setSuccess({ href: entry.href })
        return
      }

      setWrong(true)
      wrongTimeoutRef.current = window.setTimeout(() => {
        setWrong(false)
        setBuffer('')
        wrongTimeoutRef.current = null
      }, 720)
    },
    [success],
  )

  useEffect(() => {
    if (!success) return

    clearUnlockTimer()
    const href = success.href
    unlockTimerRef.current = window.setTimeout(() => {
      unlockTimerRef.current = null
      if (href) {
        window.location.assign(href)
      } else {
        disarm()
      }
    }, 1000)

    return () => {
      clearUnlockTimer()
    }
  }, [success, clearUnlockTimer, disarm])

  useEffect(
    () => () => {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
      clearUnlockTimer()
    },
    [clearUnlockTimer],
  )

  useEffect(() => {
    if (!armed) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        e.preventDefault()
        disarm()
        return
      }

      if (success) return

      if (document.activeElement === inputRef.current) return

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
  }, [armed, success, disarm, updateBuffer])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || armed || success) return
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
  }, [armed, success])

  useEffect(() => {
    if (armed && !success && !isMobile) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [armed, success, isMobile])

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const onTriggerPointerDown = (e: React.PointerEvent) => {
    if (success) return
    if (armed) {
      disarm()
      return
    }
    startCoords.current = { x: e.clientX, y: e.clientY }
    clearPressTimer()
    pressTimer.current = window.setTimeout(() => {
      setArmed(true)
      startCoords.current = null
    }, LONG_PRESS_MS)
  }

  const onTriggerPointerMove = (e: React.PointerEvent) => {
    if (armed || !startCoords.current || !pressTimer.current) return
    const dx = e.clientX - startCoords.current.x
    const dy = e.clientY - startCoords.current.y
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      clearPressTimer()
      startCoords.current = null
    }
  }

  const endTriggerPointer = () => {
    clearPressTimer()
    startCoords.current = null
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBuffer(e.target.value)
  }

  const focusSecretInput = () => {
    inputRef.current?.focus()
  }

  const filled = buffer.length

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-[box-shadow] duration-700 ${
          armed ? 'shadow-[inset_0_0_120px_rgba(56,189,248,0.08)]' : ''
        } ${success ? 'shadow-[inset_0_0_160px_rgba(99,102,241,0.14)]' : ''}`}
        aria-hidden="true"
      />

      <div className="fixed bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          className={`glass-pill relative overflow-hidden rounded-full px-5 py-3 transition-opacity duration-500 ${
            armed ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${wrong ? 'ring-1 ring-rose-300/45' : ''} ${success ? '' : 'active:scale-[0.99]'}`}
          aria-label={isMobile ? 'Tap to type code' : 'Code entry'}
          onClick={() => {
            if (!armed || success) return
            if (isMobile) focusSecretInput()
          }}
        >
          {success && (
            <motion.div
              className="pointer-events-none absolute inset-0 origin-left rounded-full bg-gradient-to-r from-sky-400/45 via-indigo-400/35 to-violet-400/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left center' }}
            />
          )}
          <div
            className={`relative z-10 flex items-center justify-center gap-2.5 ${wrong ? 'translate-x-0.5' : ''}`}
            aria-hidden="true"
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  wrong ? 'bg-rose-300/95' : i < filled ? 'bg-sky-100/95 scale-110' : 'bg-white/35'
                }`}
              />
            ))}
          </div>
        </button>

        <button
          type="button"
          className={`pointer-events-auto flex h-5 w-32 touch-none items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all select-none sm:w-40 ${
            armed ? 'home-oracle-armed scale-[1.02] border-sky-300/40 bg-white/[0.08]' : 'hover:bg-white/[0.07]'
          }`}
          aria-label={armed ? 'Tap to dismiss' : 'Hold to open'}
          onPointerDown={onTriggerPointerDown}
          onPointerMove={onTriggerPointerMove}
          onPointerUp={endTriggerPointer}
          onPointerCancel={endTriggerPointer}
          onPointerLeave={endTriggerPointer}
        >
          <span
            className={`h-1 rounded-full transition-all duration-500 ${
              armed ? 'w-[72%] bg-sky-200/80' : 'w-[55%] bg-white/35'
            }`}
          />
        </button>

        {armed && (
          <label className="sr-only" htmlFor="secret-portal-input">
            Code entry
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
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              disarm()
            }
          }}
          className="sr-only"
          tabIndex={armed ? 0 : -1}
          aria-hidden={!armed}
        />
      </div>
    </>
  )
}
