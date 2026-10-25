import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { stages } from './stageData'
import './agent-flow.css'

type Phase = { title: string; agents: string[] }

/** The journey an issue takes, and the agents (by number) inside each leg of it. */
export const flowPhases: Phase[] = [
  { title: 'Issue', agents: ['01', '02'] },
  { title: 'Investigation', agents: ['03', '04', '05'] },
  { title: 'Diagnosis', agents: ['06', '07', '08'] },
  { title: 'Repair', agents: ['09', '10', '11'] },
  { title: 'Validation', agents: ['12', '13'] },
  { title: 'Trust', agents: ['14'] }
]

const taglines: Record<string, string> = {
  '01': 'Can this repository run?',
  '02': 'Map files, tests and manifests',
  '03': 'Connect the validator to its callers',
  '04': 'Check packages against advisories',
  '05': 'Record baseline findings',
  '06': 'Make the bug actually happen',
  '07': 'Pinpoint the missing expiry check',
  '08': 'Trace what the change could touch',
  '09': 'Keep only the files that matter',
  '10': 'Order the change around a constraint',
  '11': 'Write the candidate diff',
  '12': 'Damage it — do the tests notice?',
  '13': 'Compare findings before and after',
  '14': 'Package the evidence for review'
}

const momentTitles = [
  'Reproduce the failure',
  'Constrain the repair',
  'Generate, then challenge',
  'Review the evidence'
]
const momentFor = (i: number) => (i <= 5 ? 1 : i <= 9 ? 2 : i <= 11 ? 3 : 4)
const indexOf = (n: string) => stages.findIndex((s) => s.n === n)
const stateOf = (i: number, current: number) =>
  i < current ? 'done' : i === current ? 'active' : 'upcoming'

/**
 * How a selection was made:
 * - scroll: the node closest to the viewport centre (keeps it in place while panels open/close)
 * - click / key: manual choice; scroll-driven selection pauses until the user scrolls on
 * - jump: phase legend; brings the agent to the centre of the screen
 * - reset: the box was just opened, so the first agent is shown
 */
type SelectMode = 'scroll' | 'click' | 'key' | 'jump' | 'reset'

/** Scroll distance after a manual choice before scrolling takes over again. */
const MANUAL_HOLD_PX = 40

export function AgentFlow() {
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const nodes = useRef<(HTMLSpanElement | null)[]>([])
  const pending = useRef<{ mode: SelectMode; el: HTMLElement | null; top: number } | null>(null)
  const holdY = useRef<number | null>(null)
  const activePhase = flowPhases.findIndex((p) => p.agents.includes(stages[selected].n))

  const applyPending = () => {
    const p = pending.current
    pending.current = null
    if (!p) return
    const el = p.el
    if (el && (p.mode === 'scroll' || p.mode === 'click' || p.mode === 'key')) {
      // Panels above the agent opened or closed: keep the agent where the reader is looking.
      const drift = el.getBoundingClientRect().top - p.top
      if (Math.abs(drift) > 0.5) window.scrollTo({ top: window.scrollY + drift, behavior: 'instant' })
    }
    if (el && p.mode === 'key') el.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    if (el && p.mode === 'jump') el.scrollIntoView({ block: 'center', behavior: 'instant' })
    if (p.mode !== 'scroll') holdY.current = window.scrollY
  }

  const select = (i: number, mode: SelectMode) => {
    const next = Math.max(0, Math.min(stages.length - 1, i))
    const el = nodes.current[next]
    pending.current = { mode, el, top: el?.getBoundingClientRect().top ?? 0 }
    const changed = next !== selectedRef.current
    selectedRef.current = next
    if (changed) setSelected(next)
    else applyPending()
    if (mode === 'key') buttons.current[next]?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    applyPending()
  }, [selected])

  // Scroll-driven selection: the agent closest to the middle of the screen is the active one.
  useEffect(() => {
    const details = root.current?.closest('details') ?? null
    let frame = 0

    const evaluate = () => {
      frame = 0
      if (details && !details.open) return
      if (holdY.current !== null) {
        if (Math.abs(window.scrollY - holdY.current) < MANUAL_HOLD_PX) return
        holdY.current = null
      }
      const box = track.current?.getBoundingClientRect()
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return
      const middle = window.innerHeight / 2
      let best = -1
      let bestDistance = Infinity
      nodes.current.forEach((node, i) => {
        if (!node) return
        const r = node.getBoundingClientRect()
        const distance = Math.abs(r.top + r.height / 2 - middle)
        if (distance < bestDistance) {
          bestDistance = distance
          best = i
        }
      })
      if (best >= 0 && best !== selectedRef.current) select(best, 'scroll')
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(evaluate)
    }
    const onToggle = () => {
      if (details?.open) select(0, 'reset')
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    details?.addEventListener('toggle', onToggle)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      details?.removeEventListener('toggle', onToggle)
    }
    // select only touches refs and state setters, so the first-render version stays valid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const moves: Record<string, number> = {
      ArrowDown: i + 1,
      ArrowRight: i + 1,
      ArrowUp: i - 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: stages.length - 1
    }
    if (e.key in moves) {
      e.preventDefault()
      select(moves[e.key], 'key')
    }
  }

  return (
    <div className="aflow" ref={root}>
      <ol className="aflow-legend" aria-label="Pipeline phases">
        {flowPhases.map((phase, pi) => (
          <li key={phase.title}>
            <button
              type="button"
              data-state={stateOf(pi, activePhase)}
              onClick={() => select(indexOf(phase.agents[0]), 'jump')}
            >
              {phase.title}
            </button>
            {pi < flowPhases.length - 1 && <span aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <div className="aflow-track" ref={track}>
        <span className="aflow-pulse" aria-hidden="true">
          <span />
        </span>
        <ol className="aflow-rows" aria-label="Agent journey">
          {flowPhases.map((phase, pi) => (
            <Fragment key={phase.title}>
              <li
                className="aflow-phase"
                data-state={stateOf(pi, activePhase)}
                data-first={pi === 0}
                aria-hidden="true"
              >
                <span className="aflow-spine">
                  <span className="aflow-diamond" />
                </span>
                <span className="aflow-chip">
                  <span>0{pi + 1}</span>
                  {phase.title}
                </span>
              </li>
              {phase.agents.map((n) => {
                const i = indexOf(n)
                const stage = stages[i]
                const state = stateOf(i, selected)
                const active = state === 'active'
                const moment = momentFor(i)
                return (
                  <li
                    key={n}
                    id={`agent-${n}`}
                    className="aflow-row"
                    data-side={i % 2 === 0 ? 'right' : 'left'}
                    data-state={state}
                  >
                    <span className="aflow-spine" aria-hidden="true" onClick={() => select(i, 'click')}>
                      <span
                        className="aflow-node"
                        ref={(el) => {
                          nodes.current[i] = el
                        }}
                      >
                        {n}
                        {active && (
                          <svg className="aflow-ring" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="17" pathLength={100} />
                          </svg>
                        )}
                      </span>
                    </span>
                    <div className="aflow-card">
                      <button
                        ref={(el) => {
                          buttons.current[i] = el
                        }}
                        type="button"
                        aria-expanded={active}
                        aria-controls={`aflow-detail-${n}`}
                        onClick={() => select(i, 'click')}
                        onKeyDown={(e) => onKey(e, i)}
                      >
                        <span className="aflow-name">
                          <span className="sr-only">Agent {n}: </span>
                          {stage.name}
                        </span>
                        <span className="aflow-tagline">{taglines[n]}</span>
                      </button>
                      <div className="aflow-reveal" id={`aflow-detail-${n}`} inert={!active}>
                        <div>
                          <div className="aflow-detail">
                            <p className="aflow-desc">{stage.desc}</p>
                            <p className="aflow-io">
                              <span>
                                <em>In</em>
                                {stage.input}
                              </span>
                              <span aria-hidden="true">→</span>
                              <span>
                                <em>Out</em>
                                {stage.output}
                              </span>
                            </p>
                            <dl className="aflow-evidence">
                              {stage.evidence.map((ev) => (
                                <div key={ev.label}>
                                  <dt>{ev.label}</dt>
                                  <dd>{ev.value}</dd>
                                </div>
                              ))}
                            </dl>
                            <a className="aflow-link" href={`#moment-${moment}`}>
                              View {momentTitles[moment - 1].toLowerCase()} ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </Fragment>
          ))}
          <li className="aflow-end" aria-hidden="true">
            <span className="aflow-spine">
              <span className="aflow-terminus" />
            </span>
            <span className="aflow-chip">Developer decides whether to merge</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
