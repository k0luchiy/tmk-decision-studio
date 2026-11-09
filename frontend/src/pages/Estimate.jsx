import React, { useState } from 'react';
import {
  AlertTriangle, ArrowRight, Calculator, ChevronDown, Download, Info, Layers3,
  Plus, Trash2, Wallet, Workflow,
} from 'lucide-react';
import { Button, LinkButton, Pill, SectionHead, Segmented } from '../components/ui.jsx';
import { fmtHours, fmtMoney, fmtPercent, fmtWeeks } from '../core/format.js';
import { SCENARIO_META } from '../data/cases.js';

const moneyInput = (value) => new Intl.NumberFormat('ru-RU').format(value || 0);

const OWNER_OPTIONS = [
  { id: 'internal', label: 'Внутри' },
  { id: 'split', label: 'Совместно' },
  { id: 'vendor', label: 'Подрядчик' },
];

export default function Estimate({
  state, model, updateStage, removeStage, addStage, updateExtra, removeExtra, addExtra, goTab, onExportCSV,
}) {
  const [expanded, setExpanded] = useState('development');
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newExtra, setNewExtra] = useState({ name: '', internal: '', external: '', hybrid: '' });

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ШАГ 03 · ДЕКОМПОЗИЦИЯ</div>
          <h1>Структура оценки</h1>
          <p>Одна декомпозиция для всех сценариев. Меняйте часы, ставки и стоимость подрядчика — итог пересчитается сам.</p>
        </div>
        <div className="page-heading-side">
          <Button size="sm" variant="secondary" icon={Download} onClick={onExportCSV}>Выгрузить CSV</Button>
          <Button size="sm" variant="primary" icon={Plus} onClick={() => { const id = addStage(); if (id) setExpanded(id); }}>Добавить этап</Button>
        </div>
      </div>

      <div className="estimate-summary">
        <div><span>Трудоёмкость</span><b>{fmtHours(model.effort)}</b><small>{Math.round(model.effortRange.p10).toLocaleString('ru-RU')}–{Math.round(model.effortRange.p90).toLocaleString('ru-RU')} ч</small></div>
        <div><span>Команда</span><b>{fmtMoney(model.scenarios.internal.p50)}</b><small>P50</small></div>
        <div><span>Подрядчик</span><b>{fmtMoney(model.scenarios.vendor.p50)}</b><small>P50</small></div>
        <div className="highlight"><span>Гибрид</span><b>{fmtMoney(model.scenarios.hybrid.p50)}</b><small>рекомендуем</small></div>
      </div>

      <section className="panel stages-panel">
        <SectionHead
          eyebrow="ЭТАПЫ"
          title="Работы и ответственность"
          description="7 этапов · единый шаблон для внутренней команды и подрядчика"
          actions={<span className="table-hint"><Layers3 size={14} /> значения редактируются</span>}
        />
        <div className="stage-list">
          {state.stages.map((stage, index) => {
            const open = expanded === stage.id;
            const internalCost = stage.hours * stage.rate;
            return (
              <article className={`stage-card ${open ? 'open' : ''}`} key={stage.id}>
                <button type="button" className="stage-card-head" onClick={() => setExpanded(open ? '' : stage.id)}>
                  <span className="stage-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="stage-title">
                    <b>{stage.name}</b>
                    <small>{stage.desc}</small>
                  </span>
                  <span className={`owner-chip ${stage.owner}`}>
                    {stage.owner === 'internal' ? 'Внутри' : stage.owner === 'vendor' ? 'Подрядчик' : 'Совместно'}
                  </span>
                  <span className="stage-metric"><small>ЧАСЫ</small><b>{stage.hours}</b></span>
                  <span className="stage-metric"><small>КОМАНДА</small><b>{fmtMoney(internalCost)}</b></span>
                  <span className="stage-metric"><small>ПОДРЯДЧИК</small><b>{fmtMoney(stage.external)}</b></span>
                  <span className="stage-metric"><small>ДНИ</small><b>{stage.days}</b></span>
                  <ChevronDown size={16} className={`chevron ${open ? 'open' : ''}`} />
                </button>
                {open && (
                  <div className="stage-editor">
                    <div className="stage-editor-grid">
                      <label className="stage-editor-name"><span>Название этапа</span><input value={stage.name} onChange={(event) => updateStage(stage.id, 'name', event.target.value)} /></label>
                      <label className="stage-editor-desc"><span>Описание</span><input value={stage.desc} onChange={(event) => updateStage(stage.id, 'desc', event.target.value)} /></label>
                      <label><span>Часы ТМК</span><input type="number" min="0" value={stage.hours} onChange={(event) => updateStage(stage.id, 'hours', event.target.value)} /></label>
                      <label><span>Ставка, ₽/ч</span><input type="number" min="0" step="100" value={stage.rate} onChange={(event) => updateStage(stage.id, 'rate', event.target.value)} /></label>
                      <label><span>Стоимость подрядчика, ₽</span><input type="number" min="0" step="10000" value={stage.external} onChange={(event) => updateStage(stage.id, 'external', event.target.value)} /></label>
                      <label><span>Длительность, дни</span><input type="number" min="0" value={stage.days} onChange={(event) => updateStage(stage.id, 'days', event.target.value)} /></label>
                    </div>
                    <div className="stage-editor-bottom">
                      <div className="stage-owner-editor">
                        <span>Ответственность в гибриде</span>
                        <Segmented
                          className="owner-segmented"
                          options={OWNER_OPTIONS}
                          value={stage.owner}
                          onChange={(value) => updateStage(stage.id, 'owner', value)}
                        />
                      </div>
                      <div className="stage-editor-costs">
                        <span>Внутри: <b>{fmtMoney(internalCost)}</b></span>
                        <span>Подрядчик: <b>{fmtMoney(stage.external)}</b></span>
                        <span>Гибрид: <b>{fmtMoney(stage.hours * stage.rate * (stage.split / 100) + stage.external * (1 - stage.split / 100))}</b></span>
                      </div>
                      <button type="button" className="danger-link" onClick={() => removeStage(stage.id)}><Trash2 size={14} /> Удалить этап</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="stage-total">
          <div><span>Итого по работам</span><b>{fmtHours(model.effort)}</b></div>
          <div><span>Внутренняя стоимость работ</span><b>{fmtMoney(model.stageRows.reduce((acc, stage) => acc + stage.internalCost, 0))}</b></div>
          <div><span>Стоимость подрядчика</span><b>{fmtMoney(model.stageRows.reduce((acc, stage) => acc + stage.external, 0))}</b></div>
          <div><span>Календарный срок</span><b>{fmtWeeks(model.scenarios[model.recommended].weeks)}</b></div>
        </div>
        <div className="panel-foot">
          <span><Info size={14} /> Итоговая стоимость = работы + внешние статьи + коэффициенты + резерв. Формулы раскрыты в методике.</span>
          <LinkButton onClick={() => goTab('method')}>Как считается</LinkButton>
        </div>
      </section>

      <section className="panel extras-panel">
        <SectionHead
          eyebrow="ДОПОЛНИТЕЛЬНЫЕ СТАТЬИ"
          title="Инфраструктура, лицензии, оборудование"
          description="Статьи можно менять отдельно для каждого сценария"
          actions={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowAddExtra(!showAddExtra)}>Добавить статью</Button>}
        />
        {showAddExtra && (
          <div className="add-extra-form">
            <input placeholder="Название статьи" value={newExtra.name} onChange={(event) => setNewExtra({ ...newExtra, name: event.target.value })} />
            <input placeholder="Внутри, ₽" type="number" value={newExtra.internal} onChange={(event) => setNewExtra({ ...newExtra, internal: event.target.value })} />
            <input placeholder="Подрядчик, ₽" type="number" value={newExtra.external} onChange={(event) => setNewExtra({ ...newExtra, external: event.target.value })} />
            <input placeholder="Гибрид, ₽" type="number" value={newExtra.hybrid} onChange={(event) => setNewExtra({ ...newExtra, hybrid: event.target.value })} />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (!newExtra.name.trim()) return;
                addExtra({
                  name: newExtra.name.trim(),
                  kind: 'Прочие затраты',
                  internal: Number(newExtra.internal) || 0,
                  external: Number(newExtra.external) || 0,
                  hybrid: Number(newExtra.hybrid) || 0,
                });
                setNewExtra({ name: '', internal: '', external: '', hybrid: '' });
                setShowAddExtra(false);
              }}
            >
              Добавить
            </Button>
          </div>
        )}
        <div className="extra-card-grid">
          {state.extras.map((item) => (
            <article className="extra-card" key={item.id}>
              <div className="extra-card-head">
                <div>
                  <b>{item.name}</b>
                  <small>{item.kind}</small>
                </div>
                <button type="button" className="icon-button subtle" onClick={() => removeExtra(item.id)} title="Удалить статью"><Trash2 size={14} /></button>
              </div>
              <div className="extra-card-values">
                {[
                  ['internal', 'Команда'],
                  ['external', 'Подрядчик'],
                  ['hybrid', 'Гибрид'],
                ].map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <div className="currency-input">
                      <input type="number" min="0" step="1000" value={item[key]} onChange={(event) => updateExtra(item.id, key, event.target.value)} />
                      <i>₽</i>
                    </div>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="estimate-formula">
        <div className="estimate-formula-icon"><Calculator size={20} /></div>
        <div>
          <b>Формула, по которой сходится итог</b>
          <code>Итог = (Σ часы × ставка + внешние статьи + найм) × Kсложности × (1 + резерв) × Kсжатия</code>
          <span>Для подрядчика вместо внутренних часов используется смета по этапам плюс надзор, тендер и риск-премия.</span>
        </div>
        <Button variant="secondary" rightIcon={ArrowRight} onClick={() => goTab('justification')}>К обоснованию</Button>
      </div>

      <div className="inline-note">
        <AlertTriangle size={15} />
        <span>Это предварительная декомпозиция для выбора модели реализации, а не детальная смета. Все значения — демонстрационные.</span>
      </div>
    </div>
  );
}
