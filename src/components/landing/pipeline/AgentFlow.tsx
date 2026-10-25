import { useState } from 'react'
import { stages, type Stage } from './stageData'
import './agent-flow.css'

type FlowGroup = { title: string; agents: string[]; moment: number; momentTitle: string }

/** The five investigation stages and the agents (by number) that run inside each. */
export const flowGroups: FlowGroup[] = [
  { title: 'Understand', agents: ['01', '02', '03'], moment: 1, momentTitle: 'Reproduce the failure' },
  { title: 'Investigate', agents: ['04', '05', '06', '07'], moment: 1, momentTitle: 'Reproduce the failure' },
  { title: 'Scope & Context', agents: ['08', '09'], moment: 2, momentTitle: 'Constrain the repair' },
  { title: 'Repair', agents: ['10', '11'], moment: 3, momentTitle: 'Generate, then challenge' },
  { title: 'Validate & Trust', agents: ['12', '13', '14'], moment: 4, momentTitle: 'Review the evidence' }
]

const byNumber = new Map(stages.map((s) => [s.n, s]))

function AgentDetail({ stage, group }: { stage: Stage; group: FlowGroup }) {
  return (
    <div className="agent-flow-detail" aria-live="polite">
      <p className="agent-flow-detail-kicker">
        Agent {stage.n} · {group.title}
      </p>
      <h4 className="agent-flow-detail-title">{stage.name}</h4>
      <p className="agent-flow-detail-desc">{stage.desc}</p>
      <p className="agent-flow-detail-chain">{stage.does.join(' → ')}</p>
      <div className="agent-flow-io">
        <span>
          <em>In</em>
          {stage.input}
        </span>
        <span aria-hidden="true">→</span>
        <span>
          <em>Out</em>
          {stage.output}
        </span>
      </div>
      <dl className="agent-flow-evidence">
        {stage.evidence.map((e) => (
          <div key={e.label}>
            <dt>{e.label}</dt>
            <dd>{e.value}</dd>
          </div>
        ))}
      </dl>
      <a className="agent-flow-detail-link" href={`#moment-${group.moment}`}>
        View {group.momentTitle.toLowerCase()} ↗
      </a>
    </div>
  )
}

export function AgentFlow() {
  const [selected, setSelected] = useState('01')
  const selectedStage = byNumber.get(selected) ?? stages[0]
  const selectedGroup = flowGroups.find((g) => g.agents.includes(selected)) ?? flowGroups[0]

  return (
    <div className="agent-flow">
      <ol className="agent-flow-stages" aria-label="Agent flow">
        {flowGroups.map((group, gi) => {
          const groupActive = group.agents.includes(selected)
          return (
            <li key={group.title} className="agent-flow-stage" data-active={groupActive}>
              <p className="agent-flow-stage-title">
                <span>0{gi + 1}</span>
                {group.title}
              </p>
              <ol className="agent-flow-agents">
                {group.agents.map((n) => {
                  const stage = byNumber.get(n)
                  if (!stage) return null
                  const active = n === selected
                  return (
                    <li key={n} id={`agent-${n}`} className="agent-flow-agent" data-active={active}>
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-controls="agent-flow-detail"
                        onClick={() => setSelected(n)}
                      >
                        <span className="agent-flow-node">{n}</span>
                        <span className="agent-flow-name">{stage.name}</span>
                      </button>
                      {active && (
                        <div className="agent-flow-inline">
                          <AgentDetail stage={stage} group={group} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ol>
      <aside id="agent-flow-detail" className="agent-flow-aside">
        <AgentDetail stage={selectedStage} group={selectedGroup} />
      </aside>
    </div>
  )
}
