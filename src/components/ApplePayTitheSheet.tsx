import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type ApplePayTitheSheetProps = {
  open: boolean
  amount: number
  onClose: () => void
  onPaid: (amount: number) => void
}

export function ApplePayTitheSheet({ open, amount, onClose, onPaid }: ApplePayTitheSheetProps) {
  const [phase, setPhase] = useState<'idle' | 'authorizing' | 'done'>('idle')
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  const close = () => {
    clearTimers()
    setPhase('idle')
    onClose()
  }

  useEffect(() => () => clearTimers(), [])

  const pay = () => {
    if (phase !== 'idle') return
    setPhase('authorizing')
    clearTimers()

    timersRef.current.push(
      window.setTimeout(() => {
        setPhase('done')
        timersRef.current.push(
          window.setTimeout(() => {
            onPaid(amount)
            close()
          }, 900),
        )
      }, 1400),
    )
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="apple-pay-backdrop fixed inset-0 z-[9998] border-none bg-black/55 backdrop-blur-sm"
            aria-label="Dismiss Apple Pay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="apple-pay-sheet pointer-events-auto fixed inset-x-0 bottom-0 z-[9999] mx-auto max-w-md rounded-t-[1.35rem] bg-[#f2f2f7] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-black shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            role="dialog"
            aria-modal="true"
            aria-label="Apple Pay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />

            <div className="flex items-center justify-between">
              <button type="button" className="text-[17px] text-[#007aff]" onClick={close}>
                Cancel
              </button>
              <span className="flex items-center gap-1 text-[17px] font-semibold tracking-tight">
                <AppleMark /> Pay
              </span>
              <span className="w-14" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-[13px] font-medium uppercase tracking-wide text-black/45">Church of the Empty Set</p>
              <p className="mt-2 text-[44px] font-semibold tabular-nums tracking-tight">${amount.toFixed(2)}</p>
              <p className="mt-1 text-[13px] text-black/45">Void cult tithe · non-refundable in this universe</p>
            </div>

            <div className="mt-5 rounded-xl bg-white px-4 py-3">
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-black/55">Pay with</span>
                <span className="font-medium">Apple Pay</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-black/8 pt-2 text-[15px]">
                <span className="text-black/55">Card</span>
                <span className="font-medium">VoidCard •••• 6666</span>
              </div>
            </div>

            <button
              type="button"
              className="apple-pay-confirm mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-4 text-[17px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={phase !== 'idle'}
              onClick={pay}
            >
              {phase === 'idle' && (
                <>
                  <AppleMark light /> Pay with Face ID
                </>
              )}
              {phase === 'authorizing' && (
                <span
                  className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
              )}
              {phase === 'done' && <span>Paid ✓</span>}
            </button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-black/35">
              Your tithe will be converted to vibes and forwarded to Gary.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function AppleMark({ light }: { light?: boolean }) {
  return (
    <svg viewBox="0 0 814 1000" className={light ? 'h-4 w-4 fill-white' : 'h-4 w-4 fill-black'} aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-163-39.5c-76.5 0-103.7 40.8-165.9 40.8s-109.5-57-155.5-127.5C46 791.2 0 663.5 0 541.3c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.2 0 129.2 2.6 196 98.7zM554.1 82.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.2 32.4-54.4 83.9-54.4 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.8-71.3z" />
    </svg>
  )
}
