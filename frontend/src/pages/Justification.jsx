import React from 'react';
import {
  AlertTriangle, ArrowRight, BookOpen, Check, CheckCircle2, Database, FileJson,
  FileSpreadsheet, FileText, Info, Printer, ShieldCheck, Sparkles, Target,
} from 'lucide-react';
import { Button, LinkButton, Pill, Progress, Ring, SectionHead } from '../components/ui.jsx';
import { SCENARIO_META } from '../data/cases.js';
import { fmtMoney, fmtMoneyRange, fmtPercent, fmtWeeks } from '../core/format.js';
import { recommendedRationale } from '../core/calc.js';

const SENSITIVITY_TONE = { Высокая: 'warn', Средняя: 'info', Низкая: 'neutral' };

export default function Justification({ model, goTab, onExportJSON, onExportCSV, onPrint }) {
  const meta = model.meta;
  const recId = model.recommended;
  const rec = model.scenarios[recId];
  const rationale = recommendedRationale(model);
  const estimateId = `${meta.id}-2026-${String(model.confidence.score).padStart(2, '0')}${String(Math.round(model.effort)).slice(-3)}`;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ШАГ 04 · ПРОВЕРЯЕМОСТЬ</div>
          <h1>Обоснование оценки</h1>
          <p>Откуда взялись цифры, какие допущения использованы и что может изменить результат.</p>
        </div>
        <div className="page-heading-side">
          <Pill tone="warn"><AlertTriangle size={12} /> Часть данных — демо</Pill>
          <span className="heading-note">ID оценки: {estimateId}</span>
        </div>
      </div>

      <div className="justification-top">
        <section className="verdict-card">
          <div className="verdict-kicker"><Sparkles size={14} /> ВЕРДИКТ</div>
          <h2>{SCENARIO_META[recId].name}</h2>
          <p>{rationale}</p>
          <div className="verdict-metrics">
            <div><span>Бюджет P50</span><b>{fmtMoney(rec.p50)}</b></div>
            <div><span>Диапазон</span><b>{fmtMoneyRange(rec.p10, rec.p90)}</b></div>
            <div><span>Срок</span><b>{fmtWeeks(rec.weeks)}</b></div>
            <div><span>Индекс</span><b>{rec.score.toFixed(1)} / 100</b></div>
          </div>
          <div className="verdict-foot">
            <span><CheckCircle2 size={13} /> Основано на подтверждённых параметрах</span>
            <span>Оценка порядка, не смета</span>
          </div>
        </section>

        <aside className="export-card">
          <div className="eyebrow light">РЕЗУЛЬТАТ ДЛЯ СОГЛАСОВАНИЯ</div>
          <h3>Сформировать документ</h3>
          <p>Вердикт, сценарии, допущения, риски, аналоги и источники — в одном файле.</p>
          <ul>
            <li><Check size={13} /> Рекомендация и диапазоны P10–P90</li>
            <li><Check size={13} /> Допущения и реестр рисков</li>
            <li><Check size={13} /> Формулы и источники</li>
            <li><Check size={13} /> Дата, версия и ID оценки</li>
          </ul>
          <Button variant="primary" icon={Printer} onClick={onPrint}>Сформировать PDF</Button>
          <div className="export-row">
            <Button variant="dark-ghost" icon={FileJson} onClick={onExportJSON}>JSON</Button>
            <Button variant="dark-ghost" icon={FileSpreadsheet} onClick={onExportCSV}>CSV</Button>
          </div>
          <div className="export-note">PDF формируется через диалог печати браузера. JSON и CSV скачиваются локально.</div>
        </aside>
      </div>

      <div className="justification-grid">
        <section className="panel confidence-panel">
          <SectionHead
            eyebrow="CONFIDENCE"
            title="Из чего сложилась уверенность"
            description={`${model.confidence.score}% · ${model.confidence.score >= 75 ? 'средне-высокая' : model.confidence.score >= 60 ? 'средняя' : 'требует уточнения'}`}
            actions={<Ring value={model.confidence.score} size={92} label="score" />}
          />
          <div className="confidence-detail-list">
            {model.confidence.components.map((item) => (
              <div key={item.id} className="confidence-detail-row">
                <div>
                  <b>{item.label}</b>
                  <span>вес {Math.round(item.weight * 100)}% · вклад {Math.round(item.value * item.weight)} п.п.</span>
                </div>
                <div className="factor-track"><i style={{ width: `${item.value}%` }} /></div>
                <b>{item.value}%</b>
              </div>
            ))}
          </div>
          <div className="confidence-formula">
            <code>Score = 0,30 × бриф + 0,25 × данные + 0,25 × аналоги + 0,20 × согласие методов</code>
            <span>Confidence — индикатор качества входных данных, а не вероятность точной стоимости.</span>
          </div>
          <div className="confidence-drivers">
            <div className="driver good">
              <CheckCircle2 size={15} />
              <div><b>Что повышает</b><span>{model.confidence.components.slice().sort((a, b) => b.value - a.value)[0].label}: {model.confidence.components.slice().sort((a, b) => b.value - a.value)[0].value}%</span></div>
            </div>
            <div className="driver warn">
              <AlertTriangle size={15} />
              <div><b>Что снижает</b><span>{model.confidence.components.slice().sort((a, b) => a.value - b.value)[0].label}: {model.confidence.components.slice().sort((a, b) => a.value - b.value)[0].value}%</span></div>
            </div>
          </div>
        </section>

        <section className="panel assumptions-panel">
          <SectionHead
            eyebrow="ДОПУЩЕНИЯ"
            title="Что принято на веру"
            description="Значение, диапазон, источник и чувствительность"
          />
          <div className="assumption-list">
            {meta.assumptions.map((item) => (
              <div className="assumption-row" key={item.name}>
                <div className="assumption-main">
                  <b>{item.name}</b>
                  <span>{item.value}</span>
                </div>
                <div className="assumption-meta">
                  <span>Диапазон: {item.range}</span>
                  <span>Источник: {item.source}</span>
                </div>
                <Pill tone={SENSITIVITY_TONE[item.sensitivity] || 'neutral'}>{item.sensitivity}</Pill>
              </div>
            ))}
          </div>
          <div className="panel-foot">
            <span><Info size={14} /> Допущения можно изменить в параметрах и структуре оценки</span>
            <LinkButton onClick={() => goTab('parameters')}>Изменить</LinkButton>
          </div>
        </section>
      </div>

      <section className="panel risks-panel">
        <SectionHead
          eyebrow="РИСКИ"
          title="Реестр рисков"
          description="Вероятность × влияние в деньгах. Сумма ожидаемых потерь входит в резерв."
          actions={<Pill tone="warn">Ожидаемое влияние: {fmtMoney(model.risksTotal)}</Pill>}
        />
        <div className="risk-table">
          <div className="risk-head">
            <span>Риск</span><span>Вероятность</span><span>Влияние</span><span>Ожидаемо</span><span>Уровень</span>
          </div>
          {model.risks.map((risk) => {
            const level = risk.probability * risk.impact;
            const tone = level > 350000 ? 'bad' : level > 180000 ? 'warn' : 'neutral';
            return (
              <div className="risk-row" key={risk.name}>
                <div><b>{risk.name}</b><small>{risk.note}</small></div>
                <span>{Math.round(risk.probability * 100)}%</span>
                <span>{fmtMoney(risk.impact)}</span>
                <b>{fmtMoney(risk.expected)}</b>
                <Pill tone={tone}>{tone === 'bad' ? 'Высокий' : tone === 'warn' ? 'Средний' : 'Низкий'}</Pill>
              </div>
            );
          })}
        </div>
        <div className="panel-foot">
          <span><ShieldCheck size={14} /> Резерв = P80 − P50, а не сумма всех рисков</span>
          <b>Σ ожидаемого влияния: {fmtMoney(model.risksTotal)}</b>
        </div>
      </section>

      <section className="panel analogs-panel">
        <SectionHead
          eyebrow="РЫНОЧНЫЕ АНАЛОГИ"
          title="С чем сравнили"
          description="≥ 3 аналога с источником, датой и коэффициентом приведения к сопоставимому объёму"
          actions={<Pill tone="info">Медиана: {fmtMoney(model.analogMedian)}</Pill>}
        />
        <div className="analog-table">
          <div className="analog-head">
            <span>Проект</span><span>Год</span><span>Исходная цена</span><span>Коэффициент</span><span>Приведено</span><span>Источник</span>
          </div>
          {meta.analogs.map((analog) => (
            <div className="analog-row" key={analog.name}>
              <div><b>{analog.name}</b><small>{analog.date}</small></div>
              <span>{analog.year}</span>
              <span>{fmtMoney(analog.price)}</span>
              <span className={analog.coeff > 1 ? 'up' : 'down'}>{analog.coeff.toFixed(2).replace('.', ',')}</span>
              <b>{fmtMoney(analog.normalized)}</b>
              <span>{analog.source}</span>
            </div>
          ))}
        </div>
        <div className="analog-note">
          <Info size={15} />
          <span>
            Нормализация приводит аналоги по объёму, сложности, региону, давности и составу работ. Расхождение bottom-up и медианы аналогов — {fmtPercent(model.methodDiff * 100, 1)}.
          </span>
        </div>
      </section>

      <div className="justification-bottom">
        <section className="panel sources-panel">
          <SectionHead
            eyebrow="ИСТОЧНИКИ"
            title="Происхождение данных"
            description="Каждый показатель должен иметь версию, дату и метод"
          />
          <div className="source-list">
            <div className="source-row">
              <span className="source-icon"><Database size={15} /></span>
              <div><b>Benchmark dataset v0.3</b><small>Ставки, роли и производительность · 09.11.2026</small></div>
              <Pill tone="warn">Демо</Pill>
            </div>
            <div className="source-row">
              <span className="source-icon"><FileText size={15} /></span>
              <div><b>Корпус закупок ТМК</b><small>Нормализация рыночных цен · 60 контрактов, демо</small></div>
              <Pill tone="warn">Демо</Pill>
            </div>
            <div className="source-row">
              <span className="source-icon"><BookOpen size={15} /></span>
              <div><b>Методика оценки</b><small>PERT, COCOMO-подобная декомпозиция, Putnam</small></div>
              <Pill tone="good">Версия 1.0</Pill>
            </div>
            <div className="source-row">
              <span className="source-icon"><Target size={15} /></span>
              <div><b>Выгрузка HelpDesk</b><small>Схема импорта план/факт · 16 полей</small></div>
              <Pill tone="info">Схема</Pill>
            </div>
          </div>
          <LinkButton onClick={() => goTab('data')}>Открыть реестр данных</LinkButton>
        </section>

        <section className="panel limitation-panel">
          <SectionHead
            eyebrow="ГРАНИЦЫ"
            title="Чего мы не делаем"
            description="Честные ограничения прототипа"
          />
          <ul className="limitation-list">
            <li><AlertTriangle size={14} /> Не заменяет техническое обследование и коммерческое предложение.</li>
            <li><AlertTriangle size={14} /> Ставки и аналоги — демонстрационные, не подтверждённые закупочные цены.</li>
            <li><AlertTriangle size={14} /> Confidence не является вероятностью попадания в факт.</li>
            <li><AlertTriangle size={14} /> Риски и сроки требуют проверки владельцами задачи.</li>
          </ul>
          <div className="limitation-foot">
            <b>Что дальше</b>
            <span>Пилот на 10–15 закрытых проектах: цель MAPE ≤ 30% и покрытие P80 ≥ 80%.</span>
          </div>
          <Button variant="secondary" rightIcon={ArrowRight} onClick={() => goTab('method')}>Открыть методику</Button>
        </section>
      </div>

      <div className="justification-signature">
        <div>
          <span>СФОРМИРОВАНО</span>
          <b>09.11.2026 · Decision Studio v2.0</b>
        </div>
        <div>
          <span>ID ОЦЕНКИ</span>
          <b>{estimateId}</b>
        </div>
        <div>
          <span>СТАТУС</span>
          <b>Демонстрационный расчёт · не коммерческое предложение</b>
        </div>
      </div>
    </div>
  );
}
