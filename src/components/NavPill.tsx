import { useCallback, useEffect, useRef, useState } from 'react'
import { NAV_COMMANDS, NAV_INPUT_MAX } from '../config/duck'

type NavPillProps = {
  duckMode: boolean
  onDuckMode: () => void
  onHobbyMode: () => void
}

export function NavPill({ duckMode, onDuckMode, onHobbyMode }: NavPillProps) {
  const [editing, setEditing] = useState(false)
  const [buffer, setBuffer] = useState('')
  const [reject, setReject] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const resetEditing = useCallback(() => {
    setEditing(false)
    setBuffer('')
    setReject(false)
  }, [])

  const submit = useCallback(
    (raw: string) => {
      const word = raw.toLowerCase().replace(/[^a-z]/g, '')
      if (word === NAV_COMMANDS.duck) {
        resetEditing()
        onDuckMode()
        return
      }
      if (word === NAV_COMMANDS.hobby) {
        resetEditing()
        onHobbyMode()
        return
      }
      if (word.length === 0) {
        resetEditing()
        return
      }
      setReject(true)
      window.setTimeout(() => {
        setReject(false)
        setBuffer('')
      }, 520)
    },
    [onDuckMode, onHobbyMode, resetEditing],
  )

  useEffect(() => {
    if (!editing) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.activeElement === inputRef.current) return

      if (e.key === 'Escape') {
        e.preventDefault()
        resetEditing()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editing, resetEditing])

  useEffect(() => {
    if (editing) {
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [editing])

  const startEditing = () => {
    setEditing(true)
    setBuffer('')
    setReject(false)
  }

  const suffixLabel = duckMode ? NAV_COMMANDS.duck : NAV_COMMANDS.hobby

  return (
    <div
      className={`glass-pill pointer-events-auto inline-flex w-fit max-w-[min(100vw-2rem,20rem)] items-center gap-2 rounded-full px-4 py-2 text-sm transition-[width,padding,box-shadow] duration-200 ${
        editing ? 'ring-1 ring-blue-400/35' : ''
      } ${reject ? 'ring-1 ring-rose-400/45' : ''}`}
    >
      <span className="shrink-0 font-medium tracking-tight text-blue-50">mememe</span>
      <span className="shrink-0 text-blue-200/30">/</span>

      {editing ? (
        <span className="relative inline-flex min-w-0 items-end leading-none">
          {buffer.length > 0 && (
            <span
              className={`whitespace-pre text-blue-100/90 ${reject ? 'text-rose-200/90' : ''}`}
              aria-hidden="true"
            >
              {buffer}
            </span>
          )}
          <span
            className={`console-cursor ${reject ? 'console-cursor--reject' : ''} ${buffer.length === 0 ? 'ml-0' : ''}`}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={NAV_INPUT_MAX}
            value={buffer}
            aria-label="Destination name"
            className="nav-pill-input absolute inset-0 w-full min-w-0 border-none bg-transparent opacity-0 outline-none"
            onChange={(e) => {
              setReject(false)
              setBuffer(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                resetEditing()
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                submit(buffer)
              }
            }}
            onBlur={() => {
              if (buffer.length === 0) resetEditing()
            }}
          />
        </span>
      ) : (
        <button
          type="button"
          className={`shrink-0 text-blue-100/55 hover:text-blue-100/80 ${duckMode ? 'text-blue-100/90' : ''}`}
          aria-label={`Change destination, currently ${suffixLabel}`}
          onClick={startEditing}
        >
          {suffixLabel}
        </button>
      )}
    </div>
  )
}
