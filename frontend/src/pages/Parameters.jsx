import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BriefcaseBusiness, Check, CheckCircle2, Clock3, FileText,
  GitMerge, Info, Layers3, RefreshCw, Sparkles, Upload, Users, X,
} from 'lucide-react';
import { Button, Field, Pill, Progress, SectionHead, Segmented, Slider } from '../components/ui.jsx';
import { fmtMoney, fmtWeeks, weeksToUnit } from '../core/format.js';
import { SCENARIO_META } from '../data/cases.js';

const COMPLEXITY = [
  { id: 'low', label: 'Низкая' },
  { id: 'medium', label: 'Средняя' },
  { id: 'high', label: 'Высокая' },
];

const OWNER_OPTIONS = [
  { id: 'internal', label: 'Внутри', split: 80 },
  { id: 'split', label: 'Совместно', split: 50 },
  { id: 'vendor', label: 'Подрядчик', split: 20 },
];

export default function Parameters({
  state, update, params, confirmParam, rejectParam, reparse, parsed, intakeSource,
  intakeMode, changeIntakeMode,
  files, addFiles, removeFile, model, goTab, activeScenario, setActiveScenario,
}) {
  const [unit, setUnit] = useState('weeks');
  const deadlineValue = weeksToUnit(state.deadlineWeeks, unit);
  const confirmed = params.filter((p) => p.status === 'confirmed').length;
  const rec = model.scenarios[model.recommended];
  const ownerCounts = state.stages.reduce(
    (acc, stage) => ({ ...acc, [stage.owner]: (acc[stage.owner] || 0) + 1 }),
    {}
  );

  const setDeadline = (value) => {
    const numeric = Number(value) || 0;
    const weeks = unit === 'days' ? numeric / 5 : unit === 'months' ? numeric * 4.345 : numeric;
    update({ deadlineWeeks: Math.max(1, Math.round(weeks)) });
  };

  const setStageOwner = (stageId, owner, split) => {
    update({
      stages: state.stages.map((stage) => (stage.id === stageId ? { ...stage, owner, split } : stage)),
    });
  };

  const deadlineWeeks = Number(state.deadlineWeeks) || 0;
  const scheduleVariance = Math.round(((deadlineWeeks - rec.weeks) / rec.weeks) * 100);

  const summary = useMemo(
    () => [
      { label: 'Рекомендуем', value: rec ? rec.weeks : '—', note: 'сценарий' },
      { label: 'Бюджет P50', value: fmtMoney(rec?.p50 || 0), note: 'после пересчёта' },
      { label: 'Срок', value: fmtWeeks(rec?.weeks || 0), note: 'критический путь' },
      { label: 'Уверенность', value: `${model.confidence.score}%`, note: '4 фактора' },
    ],
    [model, rec]
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ШАГ 01 · ВХОДНЫЕ ДАННЫЕ</div>
          <h1>Параметры оценки</h1>
          <p>Уточните бриф и условия — все три сценария пересчитаются одновременно, без перезагрузки.</p>
        </div>
        <div className="page-heading-side">
          <Pill tone={confirmed === params.length ? 'good' : 'warn'}>
            <CheckCircle2 size={12} /> {confirmed} из {params.length} параметров
          </Pill>
          <span className="heading-note">Автопересчёт включён</span>
        </div>
      </div>

      <div className="scenario-picker">
        <span className="field-label">СМОТРИМ СЦЕНАРИЙ</span>
        <Segmented
          options={[
            { id: 'internal', label: 'Команда' },
            { id: 'vendor', label: 'Подрядчик' },
            { id: 'hybrid', label: 'Гибрид' },
          ]}
          value={activeScenario}
          onChange={setActiveScenario}
        />
        <span className="scenario-picker-note">«Кто что делает» настраивается для гибрида</span>
      </div>

      <div className="parameter-layout">
        <section className="panel brief-panel">
          <SectionHead
            eyebrow="БРИФ"
            title="Описание задачи"
            description="Исходный текст, на основании которого собраны параметры"
            actions={<Pill tone="neutral"><FileText size={11} /> Текст + файлы</Pill>}
          />
          <textarea
            className="brief-textarea"
            value={state.description}
            onChange={(event) => update({ description: event.target.value })}
            rows={9}
          />
          <div className="brief-toolbar">
            <span>{state.description.length} символов</span>
            <div>
              <label className="upload-button">
                <Upload size={14} /> Приложить файл
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.xlsx,.csv,.json,.txt"
                  onChange={(event) => addFiles(event.target.files)}
                />
              </label>
              <select
                className="intake-mode"
                value={intakeMode}
                onChange={(event) => changeIntakeMode(event.target.value)}
                aria-label="Режим разбора брифа"
              >
                <option value="off">Правила</option>
                <option value="cache">Jev-кэш</option>
                <option value="live">Jev live</option>
              </select>
              <Button size="sm" variant="primary" icon={Sparkles} onClick={reparse}>Разобрать бриф</Button>
            </div>
          </div>
          {!parsed && (
            <div className="inline-hint warn">
              <AlertTriangle size={14} /> Текст изменён. Запустите разбор, чтобы обновить параметры.
            </div>
          )}
          {files.length > 0 && (
            <div className="file-chips">
              {files.map((name) => (
                <span className="file-chip" key={name}>
                  <FileText size={13} /> {name}
                  <button type="button" onClick={() => removeFile(name)} aria-label={`Удалить ${name}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="brief-footnote">
            {intakeSource ? <Pill tone="info"><Sparkles size={11} /> Источник: {intakeSource}</Pill> : <Layers3 size={15} />}
            <span>В API-режиме параметры приходят из intake с цитатой; локальный fallback — по ключевым словам и числам.</span>
          </div>
        </section>

        <section className="panel params-panel">
          <SectionHead
            eyebrow="ПРОВЕРКА"
            title="Подтвердите параметры"
            description="Исправьте или отклоните то, что не соответствует задаче"
            actions={<b className="params-counter">{confirmed}/{params.length}</b>}
          />
          <Progress value={(confirmed / Math.max(1, params.length)) * 100} />
          <div className="param-list">
            {params.map((param) => (
              <article className={`param-row ${param.status}`} key={param.id}>
                <div className="param-main">
                  <div>
                    <span>{param.label}</span>
                    <b>{param.value}</b>
                  </div>
                  <Pill tone={param.confidence === 'Высокая' ? 'good' : 'warn'}>{param.confidence}</Pill>
                </div>
                <small>{param.source}</small>
                {param.status === 'pending' ? (
                  <div className="param-actions">
                    <button type="button" onClick={() => confirmParam(param)}><Check size={13} /> Подтвердить</button>
                    <button type="button" onClick={() => rejectParam(param)}><X size={13} /> Отклонить</button>
                  </div>
                ) : (
                  <div className={`param-status ${param.status}`}>
                    <CheckCircle2 size={12} />
                    {param.status === 'rejected' ? 'Отклонено · нужно уточнить' : 'Подтверждено и применено'}
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="panel-foot">
            <span><Info size={14} /> Неподтверждённые параметры снижают confidence</span>
            <Button size="sm" variant="primary" rightIcon={ArrowRight} onClick={() => goTab('overview')}>К результату</Button>
          </div>
        </section>
      </div>

      <section className="panel conditions-panel">
        <SectionHead
          eyebrow="УСЛОВИЯ РАСЧЁТА"
          title="Настройте сценарии"
          description="Меняйте параметры — стоимость, сроки, диапазоны и рекомендация обновятся сразу"
          actions={<span className="live-badge"><i /> LIVE</span>}
        />

        <div className="condition-grid">
          <Field label="Категория работ">
            <input value={state.type} onChange={(event) => update({ type: event.target.value })} />
          </Field>
          <Field label="Сложность">
            <Segmented options={COMPLEXITY} value={state.complexity} onChange={(value) => update({ complexity: value })} />
          </Field>
          <Field label="Количество интеграций" hint="Влияет на объём интеграционного контура">
            <input type="number" min="0" value={state.integrations} onChange={(event) => update({ integrations: Number(event.target.value) })} />
          </Field>
          <Field label="Экраны интерфейса">
            <input type="number" min="0" value={state.screens} onChange={(event) => update({ screens: Number(event.target.value) })} />
          </Field>
          <Field label="Пользователи">
            <input type="number" min="1" value={state.users} onChange={(event) => update({ users: Number(event.target.value) })} />
          </Field>
          <Field label="Целевой срок" hint="Можно задать в неделях, месяцах или днях">
            <div className="input-unit">
              <input type="number" min="1" value={Number(deadlineValue.toFixed(1))} onChange={(event) => setDeadline(event.target.value)} />
              <select value={unit} onChange={(event) => setUnit(event.target.value)}>
                <option value="weeks">нед.</option>
                <option value="months">мес.</option>
                <option value="days">дн.</option>
              </select>
            </div>
          </Field>
          <Field label="Ставка внутренней команды, ₽/ч" hint="Fully loaded: оклад, взносы, накладные, АРМ">
            <div className="input-unit">
              <input type="number" min="1000" step="100" value={state.teamRate} onChange={(event) => update({ teamRate: Number(event.target.value) })} />
              <span className="unit-static">₽/ч</span>
            </div>
          </Field>
          <Field label="Модель контракта подрядчика">
            <Segmented
              options={[{ id: 'tm', label: 'T&M' }, { id: 'fixed', label: 'Fixed Price' }]}
              value={state.contractType}
              onChange={(value) => update({ contractType: value })}
            />
          </Field>
        </div>

        <div className="condition-sliders">
          <Slider
            label="Резерв на неопределённость"
            value={state.reserve}
            min={0}
            max={30}
            step={1}
            onChange={(value) => update({ reserve: value })}
            format={(value) => `${value}%`}
            leftLabel="0% · без резерва"
            rightLabel="30% · высокая неопределённость"
            note="Резерв = P80 − P50. Включён во все три сценария."
          />
          <Slider
            label="Надзор и приёмка заказчиком"
            value={state.oversight}
            min={5}
            max={25}
            step={1}
            onChange={(value) => update({ oversight: value })}
            format={(value) => `${value}%`}
            leftLabel="5% · минимальный"
            rightLabel="25% · усиленный контроль"
            note="Применяется к сценарию подрядчика: контроль кода, архитектуры и приёмка этапов."
          />
          <div className="toggle-field">
            <div>
              <span className="field-label">Найм в внутреннюю команду</span>
              <p className="field-note">Рекрутинг и онбординг: +420 тыс. ₽, срок +2 недели, bench 6%.</p>
            </div>
            <button
              type="button"
              className={`toggle ${state.hiring ? 'on' : ''}`}
              onClick={() => update({ hiring: !state.hiring })}
              aria-pressed={state.hiring}
            >
              <i />
              <span>{state.hiring ? 'Учтён' : 'Не нужен'}</span>
            </button>
          </div>
        </div>

        <div className="deadline-hint">
          <Clock3 size={15} />
          <span>
            Целевой срок: <b>{fmtWeeks(deadlineWeeks)}</b> ({deadlineWeeks} нед. · {(deadlineWeeks / 4.345).toFixed(1).replace('.', ',')} мес.).
            {scheduleVariance < 0
              ? ` На ${Math.abs(scheduleVariance)}% короче расчётного срока — включена поправка на сжатие.`
              : ` Запас ${scheduleVariance}% к расчётному сроку.`}
          </span>
        </div>
      </section>

      {activeScenario === 'hybrid' ? (
        <section className="panel hybrid-panel">
          <SectionHead
            eyebrow="ГИБРИД"
            title="Кто что делает"
            description="Распределите ответственность по этапам. Это меняет стоимость и срок гибридного сценария."
            actions={<Pill tone="info"><GitMerge size={12} /> {state.stages.length} этапов</Pill>}
          />
          <div className="owner-summary">
            <span><i className="owner-dot internal" /> Внутри: <b>{ownerCounts.internal || 0}</b></span>
            <span><i className="owner-dot split" /> Совместно: <b>{ownerCounts.split || 0}</b></span>
            <span><i className="owner-dot vendor" /> Подрядчик: <b>{ownerCounts.vendor || 0}</b></span>
            <em>«Совместно» — работа делится между ТМК и подрядчиком</em>
          </div>
          <div className="owner-list">
            {state.stages.map((stage) => (
              <div className="owner-row" key={stage.id}>
                <div className="owner-row-title">
                  <b>{stage.name}</b>
                  <small>{stage.hours} ч · {stage.days} дн. · {stage.desc}</small>
                </div>
                <Segmented
                  className="owner-segmented"
                  options={OWNER_OPTIONS.map((option) => ({ id: option.id, label: option.label }))}
                  value={stage.owner}
                  onChange={(value) => {
                    const option = OWNER_OPTIONS.find((item) => item.id === value);
                    setStageOwner(stage.id, value, option.split);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="panel-foot">
            <span><Info size={14} /> Гибрид добавляет 3,5% на координацию, но снимает часть найма и bench.</span>
            <b>{fmtMoney(model.scenarios.hybrid.p50)}</b>
          </div>
        </section>
      ) : (
        <section className="panel hybrid-callout">
          <span className="hybrid-callout-icon"><GitMerge size={19} /></span>
          <div>
            <b>Распределение ответственности — только для гибрида</b>
            <p>
              Сейчас для детального просмотра выбрана модель «{SCENARIO_META[activeScenario].name}».
              Раздел «Кто что делает» появится, когда вы выберете гибридный сценарий.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setActiveScenario('hybrid')}>Настроить гибрид</Button>
        </section>
      )}

      <section className="live-summary">
        {summary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <b>{item.value}</b>
            <small>{item.note}</small>
          </div>
        ))}
        <Button variant="primary" rightIcon={ArrowRight} onClick={() => goTab('overview')}>Пересчитать и посмотреть</Button>
      </section>

      <div className="inline-note">
        <RefreshCw size={15} />
        <span>
          Изменения применяются мгновенно. Стоимость = (Σ часы × ставка + внешние статьи + найм) × коэффициент сложности × (1 + резерв) × поправка на сжатие.
        </span>
      </div>
    </div>
  );
}
