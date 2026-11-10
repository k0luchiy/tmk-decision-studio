import React from 'react';
import {
  AlertTriangle, ArrowRight, Clock3, Coins, Gauge, Info, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { Button, Pill, Progress, SectionHead, LinkButton } from '../components/ui.jsx';
import { Recommendation } from '../components/shell.jsx';
import OwnerMatrix from '../components/OwnerMatrix.jsx';
import { SCENARIO_META } from '../data/cases.js';
import { fmtMoney, fmtPercent, fmtWeeks } from '../core/format.js';

export default function Overview({ model, rationale, goTab, onExport, active, state, onStageOwnerChange }) {
  const selectedId = active || model.recommended;
  const selected = model.scenarios[selectedId];
  const selectedMeta = SCENARIO_META[selectedId];
  const recommendedId = model.recommended;
  const recommended = model.scenarios[recommendedId];
  const recommendedMeta = SCENARIO_META[recommendedId];
  const cheapest = Object.values(model.scenarios).sort((a, b) => a.p50 - b.p50)[0];
  const internal = model.scenarios.internal;
  const maxLine = Math.max(...selected.lines.map((line) => line.value));

  return (
    <div className="page-stack">
      <Recommendation model={model} rationale={rationale} goTab={goTab} onExport={onExport} active={active} />

      {active === 'hybrid' && (
        <OwnerMatrix state={state} model={model} onOwnerChange={onStageOwnerChange} compact />
      )}

      {model.calendar && (
        <section className="panel calendar-note">
          <div className="calendar-note-head">
            <span className="calendar-note-icon"><Clock3 size={16} /></span>
            <div>
              <b>Календарные допущения</b>
              <span>Почему срок именно такой: работа + организационные буферы</span>
            </div>
            <Pill tone="info">{fmtWeeks(recommended.weeks)} в рекомендации</Pill>
          </div>
          <div className="calendar-note-chips">
            <span>Работа: <b>{fmtWeeks(model.calendar.effortP50Weeks)}</b></span>
            <span>Лаги этапов: <b>{fmtWeeks(model.calendar.lagWeeks)}</b></span>
            {model.calendar.pilotWeeks > 0 && <span>Пилот: <b>{fmtWeeks(model.calendar.pilotWeeks)}</b></span>}
            {model.calendar.supportTermWeeks && <span>Контракт support: <b>{fmtWeeks(model.calendar.supportTermWeeks)}</b></span>}
            <span>Минимум: <b>{fmtWeeks(model.calendar.minCalendarWeeks)}</b></span>
          </div>
        </section>
      )}

      <div className="overview-grid">
        <section className="panel">
          <SectionHead
            title="Статьи затрат"
            description={`${selectedMeta.name}: работы, внешние статьи и резерв`}
            actions={<LinkButton onClick={() => goTab('estimate')}>Все этапы</LinkButton>}
          />
          <div className="line-bars">
            {selected.lines
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((line) => (
                <div className="line-bar" key={line.label}>
                  <div className="line-bar-head">
                    <span>{line.label}</span>
                    <b>{fmtMoney(line.value)}</b>
                  </div>
                  <div className="line-bar-track">
                    <i style={{ width: `${Math.max(3, (line.value / maxLine) * 100)}%` }} />
                  </div>
                  <small>{fmtPercent((line.value / selected.p50) * 100, 1)} от бюджета</small>
                </div>
              ))}
          </div>
          <div className="panel-foot">
            <span><Info size={14} /> Резерв включает неопределённость и поправку на сжатие срока</span>
            <b>{fmtMoney(selected.p50)}</b>
          </div>
        </section>

        <section className="panel">
          <SectionHead
            eyebrow="ЛОГИКА ВЫБОРА"
            title="Факторы рекомендации"
            description="Стоимость, срок, риск, гибкость"
            actions={<Pill tone="good"><Sparkles size={11} /> {recommendedMeta.shortName}</Pill>}
          />
          <div className="factor-table">
            {[
              { id: 'cost', label: 'Стоимость', icon: Coins, note: cheapest.id === recommendedId ? 'самый дешёвый вариант' : `${fmtPercent(((recommended.p50 - cheapest.p50) / cheapest.p50) * 100)} к самому дешёвому` },
              { id: 'time', label: 'Срок', icon: Clock3, note: `${recommended.weeks} нед. · ${recommended.weeks <= internal.weeks ? 'быстрее внутренней команды' : 'уступает по скорости'}` },
              { id: 'risk', label: 'Риск и контроль', icon: ShieldCheck, note: recommendedId === 'vendor' ? 'зрелый рынок, низкая зависимость' : 'знания и приёмка остаются внутри' },
              { id: 'flexibility', label: 'Гибкость', icon: Gauge, note: recommendedId === 'hybrid' ? 'можно менять ответственность по этапам' : 'фиксированная модель работ' },
            ].map((factor) => {
              const value = recommended.scoreParts[factor.id];
              return (
                <div className="factor-row" key={factor.id}>
                  <span className="factor-icon"><factor.icon size={15} /></span>
                  <div className="factor-copy">
                    <div><b>{factor.label}</b><span>{factor.note}</span></div>
                    <Progress value={value} />
                  </div>
                  <b className="factor-score">{Math.round(value)}</b>
                </div>
              );
            })}
          </div>
          <div className="score-summary">
            {['internal', 'vendor', 'hybrid'].map((id) => (
              <div key={id} className={recommendedId === id ? 'best' : ''}>
                <span>{SCENARIO_META[id].shortName}</span>
                <b>{model.scenarios[id].score.toFixed(1)}</b>
                <small>/ 100</small>
              </div>
            ))}
          </div>
          <LinkButton onClick={() => goTab('justification')}>Методика и веса факторов</LinkButton>
        </section>
      </div>

      {model.warnings.length > 0 && (
        <div className="overview-alert">
          <AlertTriangle size={16} />
          <div>
            <b>{model.warnings[0].title}</b>
            <span>{model.warnings[0].text}</span>
          </div>
          <LinkButton onClick={() => goTab('justification')}>Все ограничения</LinkButton>
        </div>
      )}

      <div className="overview-actions">
        <div><Users size={16} /><span>Изменить состав команды и ответственность подрядчика</span></div>
        <Button variant="secondary" rightIcon={ArrowRight} onClick={() => goTab('parameters')}>Настроить сценарии</Button>
        <Button variant="ghost" rightIcon={ArrowRight} onClick={() => goTab('analytics')}>Открыть графики</Button>
      </div>
    </div>
  );
}
