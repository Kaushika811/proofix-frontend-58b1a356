import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useReducedMotionPreference } from '@/components/landing/hooks/useReducedMotionPreference'

const EVIDENCE = [
  'Root cause confirmed',
  'Runtime reproduction',
  'Behavioral validation',
  'Mutation checks',
  'Security scan',
  'Blast radius assessed'
]

const EASE = [0.2, 0.7, 0.2, 1] as const
const FIRST_ITEM_MS = 250
const ITEM_STEP_MS = 380
const AUTO_MERGE_DELAY_MS = 450
const DRAFT_PAUSE_MS = 1900

type Decision = 'pending' | 'auto-merge' | 'draft-pr'

export function ProofSection() {
  const reduced = useReducedMotionPreference()
  const panelRef = useRef<HTMLDivElement>(null)
  const inView = useInView(panelRef, { once: true, amount: 0.45 })
  const [shown, setShown] = useState(0)
  const [decision, setDecision] = useState<Decision>('pending')

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setShown(EVIDENCE.length)
      setDecision('draft-pr')
      return
    }
    const timers = EVIDENCE.map((_, i) =>
      setTimeout(() => setShown(i + 1), FIRST_ITEM_MS + i * ITEM_STEP_MS)
    )
    const allShown = FIRST_ITEM_MS + (EVIDENCE.length - 1) * ITEM_STEP_MS
    const autoAt = allShown + AUTO_MERGE_DELAY_MS
    timers.push(setTimeout(() => setDecision('auto-merge'), autoAt))
    timers.push(setTimeout(() => setDecision('draft-pr'), autoAt + DRAFT_PAUSE_MS))
    return () => timers.forEach(clearTimeout)
  }, [inView, reduced])

  const complete = shown === EVIDENCE.length

  return (
    <section
      id="trust"
      className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6 md:px-12 lg:px-16"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.25em] text-sky-300">
            What the developer receives
          </p>
          <h2 className="mt-5 font-display text-4xl tracking-tight md:text-6xl">
            Inspect the repair.
            <br />
            Make the decision.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Review the candidate alongside the behavior it changes, the checks
            that challenged it, and the findings that still need attention.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">
            Illustrative review package. Results here are examples, not a live
            run or a guarantee of correctness.
          </p>
        </div>
        <div
          ref={panelRef}
          className="rounded-xl border border-border bg-secondary/20 p-5 md:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <span className="font-mono text-xs">Trust decision</span>
            <span
              className="rounded-full border border-sky-300/30 px-3 py-1 text-[10px] text-sky-200 transition-opacity duration-500"
              aria-live="polite"
            >
              {complete ? 'Evidence complete' : `Collecting evidence · ${shown} / ${EVIDENCE.length}`}
            </span>
          </div>

          <ul className="mt-2 text-xs" aria-label="Evidence">
            {EVIDENCE.map((label, i) => {
              const visible = i < shown
              return (
                <motion.li
                  key={label}
                  initial={false}
                  animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
                  aria-hidden={!visible}
                  className="flex items-center justify-between gap-4 border-b border-border py-3"
                >
                  <span>{label}</span>
                  <span className="flex items-center gap-2 text-sky-200">
                    <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                      Passed
                    </span>
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full border border-sky-300/40 bg-sky-300/10 text-[11px] leading-none"
                      aria-label="passed"
                    >
                      ✓
                    </span>
                  </span>
                </motion.li>
              )
            })}
          </ul>

          <div className="relative mt-5 h-[80px]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {decision === 'auto-merge' && (
                <motion.div
                  key="auto"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="absolute inset-0 flex flex-col justify-center rounded-lg border border-sky-300/30 bg-sky-300/5 px-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">
                    Decision
                  </p>
                  <p className="mt-1 font-display text-2xl tracking-tight text-sky-200 md:text-3xl">
                    AUTO MERGE
                  </p>
                </motion.div>
              )}
              {decision === 'draft-pr' && (
                <motion.div
                  key="draft"
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="absolute inset-0 flex flex-col justify-center rounded-lg border border-amber-300/25 bg-amber-300/5 px-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[.25em] text-muted-foreground">
                    Decision · merge held
                  </p>
                  <p className="mt-1 font-display text-2xl tracking-tight text-amber-200 md:text-3xl">
                    DRAFT PR
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
