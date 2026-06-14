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
  const [success, setSuccess] = useState<{ label: string; href?: string } | null>(null)
  const [postNoHref, setPostNoHref] = useState(false)
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
    setPostNoHref(false)
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
        setSuccess({ label: entry.label, href: entry.href })
        setPostNoHref(false)
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
        setPostNoHref(true)
      }
    }, 1000)

    return () => {
      clearUnlockTimer()
    }
  }, [success, clearUnlockTimer])

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (armed || success) return
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

  const focusSecretInput = () => {
    inputRef.current?.focus()
  }

  const filled = buffer.length

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-[box-shadow] duration-700 ${
          armed ? 'shadow-[inset_0_0_120px_rgba(37,99,235,0.1)]' : ''
        }`}
        aria-hidden="true"
      />

      <div className="fixed bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-3 px-4 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          className={`glass-pill max-w-md rounded-2xl px-4 py-2.5 text-center text-[11px] leading-snug tracking-wide transition-opacity duration-500 sm:px-5 sm:text-xs ${
            armed ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${armed ? 'cursor-pointer text-blue-100/90 hover:bg-blue-950/40' : ''}`}
          aria-live="polite"
          onClick={() => {
            if (armed) disarm()
          }}
        >
          {!success && isMobile && 'Tap or click here to dismiss.'}
          {!success && !isMobile && 'Press Escape to dismiss.'}
          {success && (
            <>
              <span className="inline">
                Bringing you to {success.label}
                {!postNoHref && (
                  <motion.span
                    className="inline-block w-5 text-left"
                    aria-hidden="true"
                    animate={{ opacity: [0.35, 1, 0.35] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  >
                    …
                  </motion.span>
                )}
              </span>
              {!success.href && postNoHref && (
                <span className="mt-2 block text-[10px] font-normal tracking-normal text-white/50 sm:text-[11px]">
                  This destination is not wired to a URL yet.
                </span>
              )}
            </>
          )}
        </button>

        <button
          type="button"
          className={`glass-pill relative overflow-hidden rounded-full px-5 py-3 transition-opacity duration-500 ${
            armed ? 'opacity-100' : 'pointer-events-none opacity-0'
          } ${wrong ? 'ring-1 ring-rose-300/45' : ''} ${success ? '' : 'active:scale-[0.99]'}`}
          aria-label={
            isMobile ? 'Tap to type your four-letter code' : 'Code entry indicator — type on your keyboard'
          }
          onClick={() => {
            if (!armed || success) return
            if (isMobile) focusSecretInput()
          }}
        >
          {success && (
            <motion.div
              key={success.label + (success.href ?? '')}
              className="pointer-events-none absolute inset-0 origin-left rounded-full bg-gradient-to-r from-blue-500/40 via-blue-700/35 to-indigo-900/40"
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
                  wrong ? 'bg-rose-400/90' : i < filled ? 'bg-blue-200/95 scale-110' : 'bg-blue-200/25'
                }`}
              />
            ))}
          </div>
        </button>

        <button
          type="button"
          className={`pointer-events-auto flex h-5 w-32 touch-none items-center justify-center rounded-full border border-blue-400/10 bg-blue-950/20 transition-all select-none sm:w-40 ${
            armed ? 'home-oracle-armed scale-[1.02] border-blue-400/35 bg-blue-950/30' : 'hover:bg-blue-950/25'
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
              armed ? 'w-[72%] bg-blue-300/80' : 'w-[55%] bg-blue-200/30'
            }`}
          />
        </button>

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
