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
      className={`glass-pill pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${
        editing ? 'ring-1 ring-blue-400/35' : ''
      } ${reject ? 'ring-1 ring-rose-400/45' : ''}`}
    >
      <span className="font-medium tracking-tight text-blue-50">mememe</span>
      <span className="text-blue-200/30">/</span>

      {editing ? (
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
          placeholder=""
          className={`min-w-[3.5rem] max-w-[9rem] border-none bg-transparent text-blue-100/90 outline-none placeholder:text-blue-200/30 ${
            reject ? 'text-rose-200/90' : ''
          }`}
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
      ) : (
        <button
          type="button"
          className={`text-blue-100/55 hover:text-blue-100/80 ${duckMode ? 'text-blue-100/90' : ''}`}
          aria-label={`Change destination, currently ${suffixLabel}`}
          onClick={startEditing}
        >
          {suffixLabel}
        </button>
      )}
    </div>
  )
}
