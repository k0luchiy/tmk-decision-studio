import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BarChart3, BookOpen, Calculator, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, Database, FileJson, FileSpreadsheet, FileText, GitMerge, Home, LineChart,
  Moon, Printer, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Users, Workflow,
} from 'lucide-react';
import { Button, Ring } from './ui.jsx';
import { CASE_LIST, SCENARIO_META } from '../data/cases.js';
import { fmtMoney, fmtPercent, fmtWeeks } from '../core/format.js';

const SCENARIO_ICONS = {
  internal: Users,
  vendor: Workflow,
  hybrid: GitMerge,
};

const API_STATUS = {
  idle: { label: 'локально', title: 'Локальный расчёт (API не используется)' },
  loading: { label: 'API…', title: 'Запрос к API выполняется' },
  error: { label: 'ошибка API', title: 'API недоступен — показаны локальные расчёты' },
  api: { label: 'API', title: 'Расчёты получены от backend API' },
};

function ApiBadge({ apiStatus = 'idle' }) {
  const status = API_STATUS[apiStatus] ?? API_STATUS.idle;
  return (
    <span className={`demo-badge api-status api-${apiStatus}`} title={status.title}>
      {status.label}
    </span>
  );
}

export function Topbar({ page, goHome, theme, toggleTheme, apiStatus }) {
  return (
    <header className="topbar">
      <button type="button" className="brand-button" onClick={goHome} aria-label="На главную">
        <span className="brand-mark"><span /></span>
        <span className="brand-copy">
          <strong>DECISION STUDIO</strong>
          <small>ТМК++ · ИНСТРУМЕНТ ОЦЕНКИ ИТ-РАБОТ</small>
        </span>
      </button>
      <div className="topbar-right">
        {page === 'start' && (
          <button type="button" className="theme-button" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <span className="demo-badge" title="Все данные демонстрационные"><i /> ДЕМО</span>
        <ApiBadge apiStatus={apiStatus} />
      </div>
    </header>
  );
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'parameters', label: 'Параметры', icon: SlidersHorizontal },
  { id: 'analytics', label: 'Аналитика', icon: LineChart },
  { id: 'estimate', label: 'Структура оценки', icon: Calculator },
  { id: 'justification', label: 'Обоснование', icon: ShieldCheck },
  { id: 'method', label: 'Методика', icon: BookOpen },
  { id: 'data', label: 'Данные', icon: Database },
];

export function Sidebar({ activeTab, goTab, goHome, model }) {
  return (
    <aside className="sidebar" aria-label="Разделы оценки">
      <div className="sidebar-label">ОЦЕНКА</div>
      <nav className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => goTab(item.id)}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
            {item.id === 'parameters' && model.pending > 0 && <i className="tab-notice">{model.pending}</i>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status"><i /> Демо-режим <small>v2.0</small></div>
        <button type="button" className="sidebar-home" onClick={goHome}><Home size={14} /> На старт</button>
      </div>
    </aside>
  );
}

function CaseSwitcher({ model, onCaseChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = CASE_LIST.find((item) => item.id === model.meta.id);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div className="case-switcher" ref={rootRef}>
      <button type="button" className="case-switcher-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox">
        <span className="case-code">{model.meta.id}</span>
        <span className="case-name">{current?.name || model.meta.name}</span>
        <ChevronDown size={14} className={open ? 'open' : ''} />
      </button>
      {open && (
        <div className="case-menu" role="listbox" aria-label="Выбор кейса">
          {CASE_LIST.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === model.meta.id}
              className={item.id === model.meta.id ? 'active' : ''}
              onClick={() => {
                setOpen(false);
                onCaseChange(item.id);
              }}
            >
              <span className="case-code">{item.id}</span>
              <span><b>{item.name}</b><small>{item.type}</small></span>
              {item.id === model.meta.id && <CheckCircle2 size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceBar({ model, onCaseChange, onExportJSON, onExportCSV, onExportPDF, onExportXLSX, theme, toggleTheme, apiStatus }) {
  return (
    <div className="workspace-bar">
      <div className="workspace-case">
        <span className="live-square" />
        <div>
          <b>{model.state.name}</b>
          <small>{model.meta.id} · {model.meta.type} · демо-данные</small>
        </div>
      </div>
      <div className="workspace-actions">
        <ApiBadge apiStatus={apiStatus} />
        <CaseSwitcher model={model} onCaseChange={onCaseChange} />
        <div className="workspace-icons">
          <button type="button" className="icon-button" onClick={onExportJSON} title="Скачать JSON-снимок" aria-label="Скачать JSON-снимок">
            <FileJson size={16} />
          </button>
          <button type="button" className="icon-button" onClick={onExportCSV} title="Скачать CSV этапов" aria-label="Скачать CSV этапов">
            <FileSpreadsheet size={16} />
          </button>
          <button type="button" className="icon-button" onClick={onExportPDF} title="Сформировать PDF" aria-label="Сформировать PDF">
            <Printer size={16} />
          </button>
          {model.estimateId && (
            <button type="button" className="icon-button" onClick={onExportXLSX} title="Скачать XLSX" aria-label="Скачать XLSX">
              <FileSpreadsheet size={16} />
            </button>
          )}
          <button type="button" className="icon-button theme-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} aria-label="Переключить тему">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScenarioStrip({ model, active, setActive, goTab }) {
  return (
    <section className="scenario-strip" aria-label="Сравнение трёх вариантов">
      <div className="scenario-strip-head">
        <div>
          <span className="eyebrow">ТРИ ВАРИАНТА РЕАЛИЗАЦИИ</span>
          <h2>Что предлагаем и что смотрим сейчас</h2>
        </div>
        <span className="scenario-strip-note">Единая декомпозиция работ · диапазон P10–P90</span>
      </div>

      <div className="scenario-cards">
        {['internal', 'vendor', 'hybrid'].map((id) => {
          const item = model.scenarios[id];
          const meta = SCENARIO_META[id];
          const Icon = SCENARIO_ICONS[id];
          const recommended = model.recommended === id;
          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              className={`scenario-card ${meta.color} ${active === id ? 'selected' : ''} ${recommended ? 'recommended' : ''}`}
              onClick={() => setActive(id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setActive(id);
              }}
            >
              <div className="scenario-card-top">
                <span className={`scenario-icon ${meta.color}`}><Icon size={17} /></span>
                <div>
                  <b>{meta.name}</b>
                  <small>{meta.subtitle}</small>
                </div>
                {recommended && <span className="reco-badge"><Sparkles size={11} /> РЕКОМЕНДУЕМ</span>}
              </div>
              <div className="scenario-card-cost">
                <strong>{fmtMoney(item.p50)}</strong>
                <span>{fmtMoney(item.p10)} — {fmtMoney(item.p90)}</span>
              </div>
              <div className="scenario-card-meta">
                <span><Clock3 size={13} /> {fmtWeeks(item.weeks)}</span>
                <span><ShieldCheck size={13} /> Индекс {item.score.toFixed(1)}</span>
              </div>
              <p>{meta.description}</p>
              <div className="scenario-card-foot">
                <span>{active === id ? <><CheckCircle2 size={13} /> Выбран для детального просмотра</> : 'Выбрать сценарий'}</span>
                <button
                  type="button"
                  className="scenario-detail-link"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive(id);
                    goTab('analytics');
                  }}
                >
                  Детали <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}

export function DeadlineLever({ model, onDeadlineChange }) {
  const deadline = Number(model.state.deadlineWeeks) || 0;
  const rec = model.scenarios[model.recommended];
  const months = (deadline / 4.345).toFixed(1).replace('.', ',');

  return (
    <div className="deadline-lever">
      <div className="lever-head">
        <Clock3 size={16} />
        <span>Срок проекта</span>
        <b>{deadline} нед. <small>· {months} мес.</small></b>
        <em>перетащите, чтобы увидеть сжатие</em>
      </div>
      <input
        type="range"
        min="6"
        max="32"
        step="1"
        value={deadline}
        onChange={(event) => onDeadlineChange(Number(event.target.value))}
        aria-label="Целевой срок проекта в неделях"
      />
      <div className="lever-foot">
        <div className="deadline-ticks">
          {['internal', 'vendor', 'hybrid'].map((id) => (
            <span key={id}><i className={id} />{SCENARIO_META[id].shortName} {model.scenarios[id].rawWeeks} нед.</span>
          ))}
        </div>
        <div className="lever-impact">
          <span>Рекомендуем: {SCENARIO_META[rec.id].shortName}</span>
          <b>{fmtWeeks(rec.weeks)} · {fmtMoney(rec.p50)}</b>
        </div>
      </div>
    </div>
  );
}

export function Recommendation({ model, rationale, goTab, onExport, active }) {
  const recId = active || model.recommended;
  const rec = model.scenarios[recId];
  const meta = SCENARIO_META[recId];
  const recommendedMeta = SCENARIO_META[model.recommended];
  const recommendedScenario = model.scenarios[model.recommended];
  const vendor = model.scenarios.vendor;
  const internal = model.scenarios.internal;
  const isRecommended = recId === model.recommended;
  const saving = vendor.p50 - rec.p50;
  const faster = internal.weeks - rec.weeks;
  const priceDelta = rec.p50 - recommendedScenario.p50;
  const weekDelta = rec.weeks - recommendedScenario.weeks;

  const rationaleText = isRecommended
    ? rationale
    : `${meta.description} По расчёту: ${fmtMoney(rec.p50)} и ${fmtWeeks(rec.weeks)}. ${
        priceDelta > 0
          ? `Дороже рекомендованного сценария на ${fmtMoney(priceDelta)}`
          : priceDelta < 0
            ? `Дешевле рекомендованного на ${fmtMoney(-priceDelta)}`
            : 'Стоимость совпадает с рекомендованным'
      }; срок ${weekDelta > 0 ? `на ${weekDelta} нед. дольше` : weekDelta < 0 ? `на ${-weekDelta} нед. короче` : 'такой же'}. Система рекомендует ${recommendedMeta.shortName} по совокупности стоимости, срока и риска.`;

  const termNote = isRecommended
    ? (faster > 0 ? `${faster} нед. быстрее внутренней команды` : 'в пределах целевого срока')
    : weekDelta > 0
      ? `на ${weekDelta} нед. дольше рекомендованного`
      : weekDelta < 0
        ? `на ${-weekDelta} нед. короче рекомендованного`
        : 'как у рекомендованного';

  const thirdMetric = recId === 'vendor'
    ? { label: 'Рыночная оценка', value: fmtMoney(rec.p50), note: 'база для сравнения' }
    : saving >= 0
      ? { label: 'Экономия к подрядчику', value: fmtMoney(saving), note: fmtPercent((saving / vendor.p50) * 100) }
      : { label: 'Дороже подрядчика', value: fmtMoney(-saving), note: 'рыночная оценка ниже' };

  return (
    <section className="recommendation">
      <div className="recommendation-main">
        <div className="recommendation-top">
          <span className="recommendation-kicker"><Sparkles size={14} /> {isRecommended ? 'РЕКОМЕНДАЦИЯ СИСТЕМЫ' : 'ВЫБРАННЫЙ СЦЕНАРИЙ'}</span>
          {!isRecommended && <span className="recommendation-note">Рекомендуем: {recommendedMeta.shortName}</span>}
        </div>
        <h1>{meta.name}</h1>
        <p className="recommendation-lead">{rationaleText}</p>
        <div className="recommendation-metrics">
          <div><span>Бюджет · P50</span><b>{fmtMoney(rec.p50)}</b><small>{fmtMoney(rec.p10)} — {fmtMoney(rec.p90)}</small></div>
          <div><span>Срок</span><b>{fmtWeeks(rec.weeks)}</b><small>{termNote}</small></div>
          <div><span>{thirdMetric.label}</span><b>{thirdMetric.value}</b><small>{thirdMetric.note}</small></div>
        </div>
        <div className="recommendation-facts">
          <span><i>Трудоёмкость</i><b>{Math.round(model.effort).toLocaleString('ru-RU')} ч</b></span>
          <span><i>Ожидаемый риск</i><b>{fmtMoney(model.risksTotal)}</b></span>
          <span><i>TCO · 3 года</i><b>{fmtMoney(rec.tco3)}</b></span>
          <span><i>Сопровождение</i><b>{fmtMoney(rec.supportMonthly)}/мес.</b></span>
        </div>
        <div className="recommendation-actions">
          <Button variant="primary" icon={FileText} onClick={() => goTab('justification')}>
            {isRecommended ? 'Почему так? Открыть обоснование' : 'К обоснованию рекомендации'}
          </Button>
          <Button variant="dark-ghost" icon={ArrowRight} onClick={() => goTab('parameters')}>Изменить условия</Button>
          <button type="button" className="recommendation-export" onClick={onExport}>
            <FileJson size={14} /> Экспорт
          </button>
        </div>
      </div>
      <aside className="recommendation-side">
        <div className="recommendation-ring-wrap">
          <Ring value={model.confidence.score} size={150} />
          <div className="ring-caption">
            <b>Уверенность оценки</b>
            <span>Индикатор качества входных данных, а не вероятность точности</span>
          </div>
        </div>
        <div className="confidence-factors">
          {model.confidence.components.map((item) => (
            <div key={item.id} className="confidence-factor">
              <span>{item.label}</span>
              <div className="factor-track"><i style={{ width: `${item.value}%` }} /></div>
              <b>{item.value}%</b>
            </div>
          ))}
        </div>
        <button type="button" className="ring-link" onClick={() => goTab('justification')}>
          Как сложился confidence <ChevronRight size={14} />
        </button>
      </aside>
    </section>
  );
}

export function Tabbar({ activeTab, goTab, model }) {
  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BarChart3 },
    { id: 'parameters', label: 'Параметры', icon: Workflow },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'estimate', label: 'Структура оценки', icon: FileText },
    { id: 'justification', label: 'Обоснование', icon: ShieldCheck },
    { id: 'method', label: 'Методика', icon: BookOpen },
  ];
  return (
    <nav className="tabbar" aria-label="Разделы оценки">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => goTab(tab.id)}>
          <tab.icon size={14} />
          <span>{tab.label}</span>
          {tab.id === 'parameters' && model.pending > 0 && <i className="tab-notice">{model.pending}</i>}
        </button>
      ))}
    </nav>
  );
}

export function Footer({ goHome }) {
  return (
    <footer className="app-footer">
      <div>
        <b>TMK DECISION STUDIO</b>
        <span>РадиоХак 4.0 · трек ТМК++</span>
      </div>
      <span>Все расчёты демонстрационные · не являются коммерческим предложением</span>
      <div className="footer-links">
        <button type="button" onClick={goHome}>Старт</button>
        <span>·</span>
        <span>v2.0</span>
      </div>
    </footer>
  );
}
