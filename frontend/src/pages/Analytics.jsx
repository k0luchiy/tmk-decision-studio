import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3, Calculator, Check, Clock3, Coins, Info, LineChart as LineIcon,
  RotateCcw, Sparkles, Table2, TrendingDown, X, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Button, Pill, SectionHead, Segmented } from '../components/ui.jsx';
import { DeadlineLever } from '../components/shell.jsx';
import OwnerMatrix from '../components/OwnerMatrix.jsx';
import { SCENARIO_META } from '../data/cases.js';
import { fmtMoney, fmtPercent, fmtWeeks } from '../core/format.js';

const SERIES = {
  internal: { label: 'Внутренняя команда', short: 'Команда', color: '#3d7ea6' },
  vendor: { label: 'Внешний подрядчик', short: 'Подрядчик', color: '#d9662e' },
  hybrid: { label: 'Гибридная модель', short: 'Гибрид', color: '#3f8f68' },
};

const CHART_TABS = [
  { id: 'cost', label: 'Стоимость', icon: Coins },
  { id: 'time', label: 'Сроки', icon: Clock3 },
  { id: 'tco', label: 'TCO', icon: TrendingDown },
  { id: 'breakeven', label: 'Break-even', icon: LineIcon },
  { id: 'tornado', label: 'Чувствительность', icon: BarChart3 },
  { id: 'distribution', label: 'Распределение', icon: Calculator },
];

const chartTooltip = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12 },
};

function FormulaDrawer({ data, close }) {
  if (!data) return null;
  return (
    <div className="drawer-overlay" onClick={close}>
      <aside className="formula-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">ПРОИСХОЖДЕНИЕ ПОКАЗАТЕЛЯ</div>
            <h2>{data.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={close}><X size={17} /></button>
        </div>
        <div className="drawer-formula"><code>{data.formula}</code></div>
        <p>{data.text}</p>
        <div className="drawer-note"><Info size={15} /><span>{data.note}</span></div>
        <div className="drawer-source">
          <span>ИСТОЧНИК</span>
          <b>{data.source}</b>
          <small>{data.date}</small>
        </div>
        <Button variant="primary" onClick={close}>Понятно</Button>
      </aside>
    </div>
  );
}

export default function Analytics({ model, active, setActive, onDeadlineChange, state, onStageOwnerChange }) {
  const [chart, setChart] = useState('cost');
  const [view, setView] = useState('chart');
  const [drawer, setDrawer] = useState(null);
  const [zoomMonths, setZoomMonths] = useState(36);
  const [zoomYears, setZoomYears] = useState(5);
  const chartRef = useRef(null);
  const zoomable = chart === 'breakeven' || chart === 'tco';

  const adjustZoom = (direction) => {
    if (chart === 'breakeven') setZoomMonths((value) => Math.min(36, Math.max(6, value + direction * 3)));
    if (chart === 'tco') setZoomYears((value) => Math.min(5, Math.max(1, value + direction)));
  };

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !zoomable) return undefined;
    const handleWheel = (event) => {
      event.preventDefault();
      adjustZoom(event.deltaY > 0 ? -1 : 1);
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [chart, zoomable]);
  const selected = model.scenarios[active] || model.scenarios[model.recommended];

  const maxCost = Math.max(...['internal', 'vendor', 'hybrid'].map((id) => model.scenarios[id].p90));

  const timeData = ['internal', 'vendor', 'hybrid'].map((id) => ({
    id,
    name: SERIES[id].short,
    weeks: model.scenarios[id].weeks,
    effort: Math.round(model.effort),
  }));

  const tcoData = model.tcoSeries.slice(0, zoomYears + 1).map((row) => ({
    label: row.label,
    internal: row.internal,
    vendor: row.vendor,
    hybrid: row.hybrid,
  }));
  const breakEvenData = model.breakEvenSeries.filter((point) => point.month <= zoomMonths);

  const tornadoData = model.sensitivity.map((item) => ({
    name: item.name,
    low: item.low * 100,
    high: item.high * 100,
    lowValue: item.lowValue,
    highValue: item.highValue,
  }));

  const tableFor = () => {
    if (chart === 'cost') {
      return (
        <table>
          <thead><tr><th>Сценарий</th><th>P10</th><th>P50</th><th>P90</th><th>Индекс</th></tr></thead>
          <tbody>
            {['internal', 'vendor', 'hybrid'].map((id) => (
              <tr key={id} className={model.recommended === id ? 'best' : ''}>
                <td>{SERIES[id].label}</td>
                <td>{fmtMoney(model.scenarios[id].p10)}</td>
                <td><b>{fmtMoney(model.scenarios[id].p50)}</b></td>
                <td>{fmtMoney(model.scenarios[id].p90)}</td>
                <td>{model.scenarios[id].score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (chart === 'time') {
      return (
        <table>
          <thead><tr><th>Сценарий</th><th>Расчёт, нед.</th><th>С учётом срока</th><th>Сжатие</th><th>Трудоёмкость</th></tr></thead>
          <tbody>
            {['internal', 'vendor', 'hybrid'].map((id) => (
              <tr key={id} className={model.recommended === id ? 'best' : ''}>
                <td>{SERIES[id].label}</td>
                <td>{model.scenarios[id].rawWeeks} нед.</td>
                <td><b>{fmtWeeks(model.scenarios[id].weeks)}</b></td>
                <td>{model.scenarios[id].compressed ? `+${Math.round((model.scenarios[id].compressionMultiplier - 1) * 100)}% к стоимости` : 'не требуется'}</td>
                <td>{Math.round(model.effort).toLocaleString('ru-RU')} ч</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (chart === 'tco') {
      return (
        <table>
          <thead><tr><th>Горизонт</th><th>Команда</th><th>Подрядчик</th><th>Гибрид</th></tr></thead>
          <tbody>
            {[1, 3, 5].map((year) => {
              const key = year === 1 ? 'tco1' : year === 3 ? 'tco3' : 'tco5';
              return (
                <tr key={year}>
                  <td>{year} {year === 1 ? 'год' : 'года'}</td>
                  {['internal', 'vendor', 'hybrid'].map((id) => <td key={id}>{fmtMoney(model.scenarios[id][key])}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    if (chart === 'breakeven') {
      return (
        <table>
          <thead><tr><th>Месяц</th><th>Команда</th><th>Подрядчик</th><th>Гибрид</th></tr></thead>
          <tbody>
            {model.breakEvenSeries.filter((point) => [0, 3, 6, 9, 12, 18, 24, 30, 36].includes(point.month)).map((point) => (
              <tr key={point.month}>
                <td>М{point.month}</td>
                <td>{fmtMoney(point.internal * 1_000_000)}</td>
                <td>{fmtMoney(point.vendor * 1_000_000)}</td>
                <td>{fmtMoney(point.hybrid * 1_000_000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (chart === 'tornado') {
      return (
        <table>
          <thead><tr><th>Фактор</th><th>Нижняя оценка</th><th>Верхняя оценка</th><th>Размах</th></tr></thead>
          <tbody>
            {model.sensitivity.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{fmtMoney(item.lowValue)}</td>
                <td>{fmtMoney(item.highValue)}</td>
                <td>{fmtMoney(item.highValue - item.lowValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return (
      <table>
        <thead><tr><th>Диапазон бюджета</th><th>Относительная частота</th><th>Комментарий</th></tr></thead>
        <tbody>
          {model.distribution.map((bin) => (
            <tr key={bin.label}>
              <td>{bin.label} млн ₽</td>
              <td>{bin.count}</td>
              <td>{bin.value < model.scenarios[model.recommended].p10 ? 'ниже P10' : bin.value > model.scenarios[model.recommended].p90 ? 'выше P90' : 'в коридоре'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const chartContent = () => {
    if (chart === 'cost') {
      return (
        <div className="cost-range-chart">
          <div className="cost-range-scale">
            <span>0</span>
            <span>{fmtMoney(maxCost / 2)}</span>
            <span>{fmtMoney(maxCost)}</span>
          </div>
          {['internal', 'vendor', 'hybrid'].map((id) => {
            const item = model.scenarios[id];
            const left = (item.p10 / maxCost) * 100;
            const width = ((item.p90 - item.p10) / maxCost) * 100;
            const mid = (item.p50 / maxCost) * 100;
            const color = SERIES[id].color;
            return (
              <div className={`cost-range-row ${model.recommended === id ? 'best' : ''}`} key={id}>
                <div className="cost-range-name">
                  <i style={{ background: color }} />
                  {SERIES[id].label}
                  {model.recommended === id && <em>рекомендуем</em>}
                </div>
                <div className="cost-range-track">
                  <span className="cost-range-band" style={{ left: `${left}%`, width: `${width}%`, background: `${color}22` }} />
                  <span className="cost-range-line" style={{ left: `${left}%`, width: `${width}%`, background: color }} />
                  <span className="cost-range-dot" style={{ left: `${mid}%`, background: color }} />
                </div>
                <div className="cost-range-values">
                  <b>{fmtMoney(item.p50)}</b>
                  <span>{fmtMoney(item.p10)} — {fmtMoney(item.p90)}</span>
                </div>
              </div>
            );
          })}
          <div className="cost-range-caption">Полоса — диапазон P10–P90, точка — медиана P50. Рекомендуемый сценарий выделен.</div>
        </div>
      );
    }
    if (chart === 'time') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={timeData} margin={{ top: 18, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} н.`} width={40} />
            <Tooltip {...chartTooltip} formatter={(value) => [`${value} нед.`, 'Срок']} />
            <Bar dataKey="weeks" radius={[3, 3, 0, 0]} barSize={58} isAnimationActive={false}>
              {timeData.map((row) => <Cell key={row.id} fill={SERIES[row.id].color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chart === 'tco') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={tcoData} margin={{ top: 18, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}м`} width={38} />
            <Tooltip {...chartTooltip} formatter={(value, name) => [`${Number(value).toFixed(2).replace('.', ',')} млн ₽`, SERIES[name]?.label || name]} />
            {['internal', 'vendor', 'hybrid'].map((id) => (
              <Line key={id} type="monotone" dataKey={id} stroke={SERIES[id].color} strokeWidth={2.4} dot={{ r: 3 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (chart === 'breakeven') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={breakEvenData} margin={{ top: 18, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" tickFormatter={(v) => `М${v}`} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}м`} width={38} />
            <Tooltip {...chartTooltip} labelFormatter={(value) => `Месяц ${value}`} formatter={(value, name) => [`${Number(value).toFixed(2).replace('.', ',')} млн ₽`, SERIES[name]?.label || name]} />
            {model.breakEven && <ReferenceLine x={model.breakEven} stroke="var(--line-strong)" strokeDasharray="4 4" label={{ value: `М${model.breakEven}`, fontSize: 10, fill: 'var(--muted)' }} />}
            {['internal', 'vendor', 'hybrid'].map((id) => (
              <Line key={id} type="monotone" dataKey={id} stroke={SERIES[id].color} strokeWidth={2.2} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (chart === 'tornado') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={tornadoData} layout="vertical" margin={{ top: 10, right: 26, left: 10, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={156} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <Tooltip {...chartTooltip} formatter={(value, name) => [`${Number(value).toFixed(0)}%`, name === 'low' ? 'Ниже' : 'Выше']} />
            <ReferenceLine x={0} stroke="var(--line-strong)" />
            <Bar dataKey="low" fill="#3d7ea6" barSize={13} isAnimationActive={false} radius={[3, 0, 0, 3]} />
            <Bar dataKey="high" fill="#d9662e" barSize={13} isAnimationActive={false} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={model.distribution} margin={{ top: 18, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}м`} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={34} />
          <Tooltip {...chartTooltip} formatter={(value) => [value, 'Относительная частота']} labelFormatter={(value) => `Бюджет ${value} млн ₽`} />
          <Bar dataKey="count" fill="#3f8f68" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line type="monotone" dataKey="count" stroke="#3d7ea6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const chartInfo = {
    cost: {
      title: 'Стоимость: медиана и диапазон',
      text: 'Полоса показывает коридор P10–P90, точка — медиану P50. Так видно не только «среднюю» цифру, но и разброс оценки.',
      formula: 'C = (Σ часы × ставка + внешние статьи + найм) × Kсложности × (1 + резерв) × Kсжатия',
      note: 'Для подрядчика вместо часов используется смета по этапам, плюс надзор, тендер и риск-премия.',
      source: 'Расчётное ядро TMK Decision Studio, версия 3.0',
      date: '09.11.2026',
    },
    time: {
      title: 'Срок реализации',
      text: 'Календарный срок зависит от критического пути, параллельности работ и целевого дедлайна. При сжатии срока стоимость растёт.',
      formula: 'T = Critical Path × Kпараллельности + буфер; E ∝ T^(−4) при сжатии (Putnam)',
      note: 'Это не «трудоёмкость / 8 часов × число людей», а оценка критического пути.',
      source: 'План работ · PERT · демо-данные',
      date: '09.11.2026',
    },
    tco: {
      title: 'Стоимость владения (TCO)',
      text: 'К стоимости реализации добавляется ежемесячное сопровождение. Подрядчик часто дешевле на старте, но дороже на горизонте 3–5 лет.',
      formula: 'TCO(t) = CAPEX + Σ OPEX × 12 × t',
      note: 'OPEX — демонстрационная стоимость сопровождения: команда 80 тыс. ₽/мес, подрядчик 160 тыс. ₽/мес.',
      source: 'Демо-модель сопровождения',
      date: '09.11.2026',
    },
    breakeven: {
      title: 'Точка равенства (break-even)',
      text: 'Месяц, в котором накопленные затраты внутренней команды и подрядчика сравниваются. После него выигрывает более дешёвое сопровождение.',
      formula: 'C_team + S_team × t = C_vendor + S_vendor × t',
      note: 'Если линии не пересекаются в горизонте 36 месяцев, точка равенства не достигается.',
      source: 'Расчётное ядро TMK Decision Studio',
      date: '09.11.2026',
    },
    tornado: {
      title: 'Чувствительность (tornado)',
      text: 'Показывает, какие факторы сильнее всего меняют итоговый бюджет. Чем шире полоса, тем важнее уточнить этот параметр.',
      formula: 'ΔC = C × (1 + Δфактора) − C',
      note: 'Оценка относительного влияния, а не статистическая вероятность.',
      source: 'Анализ чувствительности, демо',
      date: '09.11.2026',
    },
    distribution: {
      title: 'Распределение бюджета',
      text: 'Распределение стоимости вокруг P50 по 4 000 итерациям Монте-Карло.',
      formula: 'Логнормальное распределение: μ = (ln P10 + ln P90) / 2; σ = (ln P90 − ln P10) / (2 × 1,2816)',
      note: 'В бэкенде — 4 000 итераций Монте-Карло, корреляция ρ = 0,5 и seed.',
      source: 'Методика оценки · демо',
      date: '09.11.2026',
    },
  }[chart];

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ШАГ 02 · РАСЧЁТ И СРАВНЕНИЕ</div>
          <h1>Аналитика сценариев</h1>
          <p>Стоимость, сроки, TCO, break-even, чувствительность и распределение.</p>
        </div>
        <div className="page-heading-side">
          <Pill tone="good"><Sparkles size={12} /> Рекомендуем: {SCENARIO_META[model.recommended].shortName}</Pill>
          <span className="heading-note">Данные пересчитаны</span>
        </div>
      </div>

      <DeadlineLever model={model} onDeadlineChange={onDeadlineChange} />

      <div className="analytics-toolbar">
        <div>
          <span className="field-label">СЦЕНАРИЙ ДЛЯ ДЕТАЛЬНОГО ПРОСМОТРА</span>
          <Segmented
            options={['internal', 'vendor', 'hybrid'].map((id) => ({ id, label: SCENARIO_META[id].shortName }))}
            value={active}
            onChange={setActive}
          />
        </div>
        <div className="analytics-toolbar-right">
          <div className="segmented compact">
            {CHART_TABS.map((tab) => (
              <button key={tab.id} type="button" className={chart === tab.id ? 'on' : ''} onClick={() => { setChart(tab.id); setView('chart'); }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button type="button" className="view-toggle" onClick={() => setView(view === 'chart' ? 'table' : 'chart')}>
            {view === 'chart' ? <Table2 size={14} /> : <BarChart3 size={14} />}
            {view === 'chart' ? 'Таблица' : 'График'}
          </button>
        </div>
      </div>

      <section className="panel chart-panel">
        <div className="chart-panel-head">
          <div>
            <h2>{chartInfo.title}</h2>
            <p>{chartInfo.text}</p>
          </div>
          <div className="chart-panel-actions">
            <Pill tone={active === model.recommended ? 'good' : 'neutral'}>
              {active === model.recommended ? <Check size={11} /> : null} {SCENARIO_META[active].name}
            </Pill>
            {zoomable && (
              <div className="zoom-control" title="Масштаб графика: колесо мыши или кнопки">
                <button type="button" onClick={() => adjustZoom(-1)} aria-label="Уменьшить масштаб"><ZoomOut size={14} /></button>
                <span>{chart === 'breakeven' ? `М0–М${zoomMonths}` : `${zoomYears} лет`}</span>
                <button type="button" onClick={() => adjustZoom(1)} aria-label="Увеличить масштаб"><ZoomIn size={14} /></button>
                <button type="button" onClick={() => { setZoomMonths(36); setZoomYears(5); }} aria-label="Сбросить масштаб"><RotateCcw size={13} /></button>
              </div>
            )}
            <button type="button" className="formula-link" onClick={() => setDrawer(chartInfo)}>
              <Calculator size={14} /> Формула
            </button>
          </div>
        </div>

        <div className="chart-legend">
          {['internal', 'vendor', 'hybrid'].map((id) => (
            <span key={id}><i style={{ background: SERIES[id].color }} /> {SERIES[id].label}</span>
          ))}
          {chart === 'cost' && <span className="legend-note">полоса — P10–P90, точка — P50</span>}
          {chart === 'time' && <span className="legend-note">целевой срок: {model.state.deadlineWeeks} нед.</span>}
          {chart === 'breakeven' && model.breakEven && <Pill tone="info">Точка равенства · М{model.breakEven}</Pill>}
          {chart === 'tornado' && <span className="legend-note">синий — ниже P50, оранжевый — выше P50</span>}
          {zoomable && <span className="legend-note">колесо мыши — масштаб</span>}
        </div>

        <div className={`chart-area ${zoomable ? 'zoomable' : ''}`} ref={chartRef}>{view === 'chart' ? chartContent() : <div className="table-view">{tableFor()}</div>}</div>

        <div className="chart-foot">
          <span><Info size={14} /> {chartInfo.note}</span>
          <span>Версия модели 2.0 · демо-данные</span>
        </div>
      </section>

      {active === 'hybrid' && (
        <OwnerMatrix state={state} model={model} onOwnerChange={onStageOwnerChange} compact />
      )}

      <div className="insight-grid">
        <div className="insight-card">
          <span className="insight-icon"><Coins size={17} /></span>
          <div><b>Разница стоимости</b><p>{SCENARIO_META[model.recommended].shortName} vs подрядчик: {fmtMoney(Math.abs(model.scenarios.vendor.p50 - model.scenarios[model.recommended].p50))} ({fmtPercent(Math.abs(1 - model.scenarios[model.recommended].p50 / model.scenarios.vendor.p50) * 100)}).</p></div>
        </div>
        <div className="insight-card">
          <span className="insight-icon"><Clock3 size={17} /></span>
          <div><b>Разница срока</b><p>Быстрее всего — {SCENARIO_META[Object.values(model.scenarios).sort((a, b) => a.weeks - b.weeks)[0].id].shortName}: {Math.min(...Object.values(model.scenarios).map((s) => s.weeks))} нед. против {model.scenarios.internal.weeks} нед. у команды.</p></div>
        </div>
        <div className="insight-card">
          <span className="insight-icon"><TrendingDown size={17} /></span>
          <div><b>TCO за 3 года</b><p>Минимальная стоимость владения — {SCENARIO_META[Object.values(model.scenarios).sort((a, b) => a.tco3 - b.tco3)[0].id].shortName}: {fmtMoney(Object.values(model.scenarios).sort((a, b) => a.tco3 - b.tco3)[0].tco3)}.</p></div>
        </div>
      </div>

      <section className="panel scenario-detail-panel">
        <SectionHead
          eyebrow="ПРОФИЛЬ СЦЕНАРИЯ"
          title={SCENARIO_META[active].name}
          description={SCENARIO_META[active].description}
          actions={<Pill tone={active === model.recommended ? 'good' : 'neutral'}>{active === model.recommended ? 'Рекомендуем' : 'Для сравнения'}</Pill>}
        />
        <div className="scenario-detail-grid">
          <div className="detail-stat"><span>Бюджет P50</span><b>{fmtMoney(selected.p50)}</b><small>{fmtMoney(selected.p10)} — {fmtMoney(selected.p90)}</small></div>
          <div className="detail-stat"><span>Срок</span><b>{fmtWeeks(selected.weeks)}</b><small>{selected.weeks !== selected.rawWeeks ? `сжатие с ${selected.rawWeeks} нед.` : 'без сжатия'}</small></div>
          <div className="detail-stat"><span>TCO · 3 года</span><b>{fmtMoney(selected.tco3)}</b><small>сопровождение {fmtMoney(selected.supportMonthly)}/мес.</small></div>
          <div className="detail-stat"><span>Индекс</span><b>{selected.score.toFixed(1)}</b><small>из 100 · взвешенная оценка</small></div>
        </div>
        <div className="score-breakdown">
          {[
            ['Стоимость', selected.scoreParts.cost, 45],
            ['Срок', selected.scoreParts.time, 25],
            ['Риск и контроль', selected.scoreParts.risk, 20],
            ['Гибкость', selected.scoreParts.flexibility, 10],
          ].map(([label, value, weight]) => (
            <div key={label}>
              <span>{label} <small>вес {weight}%</small></span>
              <div className="factor-track"><i style={{ width: `${value}%` }} /></div>
              <b>{Math.round(value)}</b>
            </div>
          ))}
        </div>
      </section>

      <FormulaDrawer data={drawer} close={() => setDrawer(null)} />
    </div>
  );
}
