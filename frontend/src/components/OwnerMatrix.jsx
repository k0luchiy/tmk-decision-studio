import React from 'react';
import { GitMerge, Info } from 'lucide-react';
import { Pill, SectionHead, Segmented } from './ui.jsx';
import { fmtMoney, fmtWeeks } from '../core/format.js';

const OWNER_OPTIONS = [
  { id: 'internal', label: 'Внутри' },
  { id: 'split', label: 'Совместно' },
  { id: 'vendor', label: 'Подрядчик' },
];

export default function OwnerMatrix({ state, model, onOwnerChange, compact = false }) {
  const counts = state.stages.reduce(
    (acc, stage) => ({ ...acc, [stage.owner]: (acc[stage.owner] || 0) + 1 }),
    {}
  );

  return (
    <section className={`panel owner-matrix ${compact ? 'compact' : ''}`}>
      <SectionHead
        eyebrow="ГИБРИД"
        title="Распределение обязанностей"
        description="Распределите ответственность по этапам — стоимость и срок гибрида обновятся сразу."
        actions={<Pill tone="info"><GitMerge size={12} /> {state.stages.length} этапов</Pill>}
      />
      <div className="owner-summary">
        <span><i className="owner-dot internal" /> Внутри: <b>{counts.internal || 0}</b></span>
        <span><i className="owner-dot split" /> Совместно: <b>{counts.split || 0}</b></span>
        <span><i className="owner-dot vendor" /> Подрядчик: <b>{counts.vendor || 0}</b></span>
        <em>«Совместно» — работа делится между ТМК и подрядчиком</em>
      </div>
      <div className="owner-list">
        {state.stages.map((stage) => (
          <div className="owner-row" key={stage.id}>
            <div className="owner-row-title">
              <b>{stage.name}</b>
              <small>{stage.hours} ч · {stage.days} дн.{compact ? '' : ` · ${stage.desc}`}</small>
            </div>
            <Segmented
              className="owner-segmented"
              options={OWNER_OPTIONS}
              value={stage.owner}
              onChange={(value) => onOwnerChange(stage.id, value)}
            />
          </div>
        ))}
      </div>
      <div className="panel-foot">
        <span><Info size={14} /> Гибрид добавляет 3,5% на координацию, но снимает часть найма и bench.</span>
        {model && (
          <b>{fmtMoney(model.scenarios.hybrid.p50)} · {fmtWeeks(model.scenarios.hybrid.weeks)}</b>
        )}
      </div>
    </section>
  );
}
