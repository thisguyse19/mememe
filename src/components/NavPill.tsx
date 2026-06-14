import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DUCK_CODEWORD } from '../config/duck'

type NavPillProps = {
  duckMode: boolean
  onDuckMode: () => void
}

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

export function NavPill({ duckMode, onDuckMode }: NavPillProps) {
  const [editing, setEditing] = useState(false)
  const [buffer, setBuffer] = useState('')
  const [wrong, setWrong] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bufferRef = useRef('')
  const wrongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobileUi()

  useLayoutEffect(() => {
    bufferRef.current = buffer
  }, [buffer])

  const resetEditing = useCallback(() => {
    if (wrongTimeoutRef.current) {
      clearTimeout(wrongTimeoutRef.current)
      wrongTimeoutRef.current = null
    }
    setEditing(false)
    setBuffer('')
    setWrong(false)
  }, [])

  const updateBuffer = useCallback(
    (raw: string) => {
      if (duckMode) return
      if (wrongTimeoutRef.current) {
        clearTimeout(wrongTimeoutRef.current)
        wrongTimeoutRef.current = null
      }

      const sanitized = raw.toLowerCase().replace(/[^a-z]/g, '').slice(0, DUCK_CODEWORD.length)
      setBuffer(sanitized)
      setWrong(false)

      if (sanitized.length === 0) return

      const expected = DUCK_CODEWORD.slice(0, sanitized.length)
      if (sanitized !== expected) {
        setWrong(true)
        wrongTimeoutRef.current = window.setTimeout(() => {
          setWrong(false)
          setBuffer('')
          wrongTimeoutRef.current = null
        }, 720)
        return
      }

      if (sanitized === DUCK_CODEWORD) {
        setEditing(false)
        setBuffer('')
        onDuckMode()
      }
    },
    [duckMode, onDuckMode],
  )

  useEffect(
    () => () => {
      if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!editing || duckMode) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        e.preventDefault()
        resetEditing()
        return
      }

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
  }, [editing, duckMode, resetEditing, updateBuffer])

  useEffect(() => {
    if (editing && !duckMode && !isMobile) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editing, duckMode, isMobile])

  const startEditing = () => {
    if (duckMode) return
    setEditing(true)
    setBuffer('')
    setWrong(false)
    if (isMobile) {
      window.setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const suffix = duckMode ? 'duck' : editing ? buffer : 'hobby'
  const dotCount = duckMode ? 0 : editing ? DUCK_CODEWORD.length : 0
  const filled = buffer.length

  return (
    <>
      <button
        type="button"
        className={`glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${
          editing ? 'ring-1 ring-blue-400/30' : ''
        } ${wrong ? 'ring-1 ring-rose-400/40' : ''}`}
        aria-label={duckMode ? 'mememe duck mode' : editing ? 'Enter codeword' : 'Tap to rename hobby'}
        onClick={startEditing}
      >
        <span className="font-medium tracking-tight text-blue-50">mememe</span>
        <span className="text-blue-200/30">/</span>

        {editing && !duckMode ? (
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: dotCount }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                  wrong
                    ? 'bg-rose-400/95'
                    : i < filled
                      ? 'bg-blue-200/95 scale-110'
                      : 'bg-blue-200/25'
                }`}
              />
            ))}
          </span>
        ) : (
          <span className={`text-blue-100/55 ${duckMode ? 'text-blue-100/90' : ''}`}>{suffix}</span>
        )}
      </button>

      {editing && !duckMode && (
        <>
          <label className="sr-only" htmlFor="nav-pill-input">
            Hobby codeword
          </label>
          <input
            id="nav-pill-input"
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={DUCK_CODEWORD.length}
            value={buffer}
            onChange={(e) => updateBuffer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                resetEditing()
              }
            }}
            className="sr-only"
            tabIndex={0}
          />
        </>
      )}
    </>
  )
}
