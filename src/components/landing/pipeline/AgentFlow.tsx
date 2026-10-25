import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
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

export function AgentFlow() {
  const [selected, setSelected] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const activePhase = flowPhases.findIndex((p) => p.agents.includes(stages[selected].n))

  const select = (i: number, focus = false) => {
    const next = Math.max(0, Math.min(stages.length - 1, i))
    setSelected(next)
    if (focus) buttons.current[next]?.focus()
  }

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
      select(moves[e.key], true)
    }
  }

  return (
    <div className="aflow">
      <ol className="aflow-legend" aria-label="Pipeline phases">
        {flowPhases.map((phase, pi) => (
          <li key={phase.title}>
            <button
              type="button"
              data-state={stateOf(pi, activePhase)}
              onClick={() => select(indexOf(phase.agents[0]))}
            >
              {phase.title}
            </button>
            {pi < flowPhases.length - 1 && <span aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <div className="aflow-track">
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
                    <span className="aflow-spine" aria-hidden="true" onClick={() => select(i)}>
                      <span className="aflow-node">{n}</span>
                    </span>
                    <div className="aflow-card">
                      <button
                        ref={(el) => {
                          buttons.current[i] = el
                        }}
                        type="button"
                        aria-expanded={active}
                        aria-controls={`aflow-detail-${n}`}
                        onClick={() => select(i)}
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
