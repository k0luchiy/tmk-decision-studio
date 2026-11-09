import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Check, Clock3, Database, FileText, FileUp, GitMerge,
  Layers3, Plus, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import { Button, Pill } from './ui.jsx';
import { CASE_LIST, SCENARIO_META } from '../data/cases.js';
import { computeModel, createCaseState, recommendedRationale } from '../core/calc.js';
import { fmtMoney, fmtWeeks } from '../core/format.js';

const SCENARIO_ICON = { internal: ShieldCheck, vendor: GitMerge, hybrid: Sparkles };

export default function StartScreen({ onStart, onLoadCase, onOpenSaved, saved }) {
  const [brief, setBrief] = useState('');
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);
  const preview = useMemo(() => computeModel(createCaseState('D1')), []);
  const previewRec = preview.scenarios[preview.recommended];

  const addFiles = (fileList) => {
    const names = Array.from(fileList || []).map((file) => file.name);
    if (names.length) setFiles((old) => [...new Set([...old, ...names])]);
  };

  return (
    <main className="start-page">
      <section className="start-hero">
        <div className="start-hero-copy">
          <div className="eyebrow light">TMK DECISION STUDIO · РАДИОХАК 4.0 · ТРЕК ТМК++</div>
          <h1>
            СДЕЛАТЬ
            <br />
            <span>ИЛИ ЗАКАЗАТЬ?</span>
          </h1>
          <p className="start-lede">
            Введите описание ИТ-задачи и получите проверяемую оценку трудоёмкости, срока и стоимости.
            Сравните собственную команду, подрядчика и гибрид — на одной декомпозиции работ.
          </p>
          <div className="hero-stats">
            <div><b>3</b><span>сценария</span><small>команда · подрядчик · гибрид</small></div>
            <div><b>P10–P90</b><span>диапазон</span><small>не одна «магическая» цифра</small></div>
            <div><b>100%</b><span>проверяемость</span><small>формулы, источники, допущения</small></div>
          </div>
          <div className="hero-trust">
            <ShieldCheck size={15} /> Расчёт с объяснением каждого показателя
            <span>·</span>
            <span>демонстрационные данные</span>
          </div>
        </div>

        <aside className="hero-preview">
          <div className="preview-top">
            <span>ПРИМЕР РЕШЕНИЯ · D1</span>
            <span>P50 / P90</span>
          </div>
          <div className="preview-title">
            <div className="eyebrow light">РЕКОМЕНДУЕМ</div>
            <h3>{SCENARIO_META[preview.recommended].name}</h3>
            <p>{previewRec.weeks} нед. · {fmtMoney(previewRec.p50)}</p>
          </div>
          <div className="preview-scenarios">
            {['internal', 'vendor', 'hybrid'].map((id) => {
              const item = preview.scenarios[id];
              const max = Math.max(...Object.values(preview.scenarios).map((s) => s.p50));
              return (
                <div key={id} className={`preview-scenario ${preview.recommended === id ? 'best' : ''}`}>
                  <div>
                    <span>{SCENARIO_META[id].shortName}</span>
                    <b>{fmtMoney(item.p50)}</b>
                  </div>
                  <div className="preview-track"><i className={id} style={{ width: `${(item.p50 / max) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="preview-foot">
            <span><Sparkles size={13} /> Уверенность {preview.confidence.score}%</span>
            <span>Единая модель · 6 этапов + сопровождение</span>
          </div>
        </aside>
      </section>

      <section className="start-grid">
        <div className="new-assessment">
          <div className="new-assessment-head">
            <div>
              <div className="eyebrow">НОВАЯ ОЦЕНКА</div>
              <h2>Опишите задачу — остальное соберём</h2>
              <p>Можно вставить текст брифа, приложить ТЗ или выбрать готовый демо-кейс.</p>
            </div>
            <Pill tone="info">ШАГ 1 ИЗ 3</Pill>
          </div>

          <label className="brief-field">
            <span className="field-label">ОПИСАНИЕ ИТ-ЗАДАЧИ</span>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={6}
              placeholder="Например: нужна интеграция 1С:ERP с WMS, обмен в обе стороны, 3 контура, журнал ошибок и мониторинг. Целевой срок — 16 недель, поддержка остаётся внутри."
            />
          </label>

          <div
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addFiles(event.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') inputRef.current?.click();
            }}
          >
            <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.json,.txt" onChange={(event) => addFiles(event.target.files)} />
            <span className="dropzone-icon"><Upload size={21} /></span>
            <div>
              <b>Перетащите ТЗ, смету или выгрузку</b>
              <span>PDF, DOCX, XLSX, CSV, JSON · файлы остаются локально</span>
            </div>
            <span className="dropzone-action">Выбрать файл</span>
          </div>

          {files.length > 0 && (
            <div className="file-chips">
              {files.map((name) => (
                <span key={name} className="file-chip">
                  <FileText size={13} />
                  {name}
                  <button type="button" onClick={() => setFiles((old) => old.filter((f) => f !== name))} aria-label={`Удалить ${name}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="start-demo-row">
            <span>Или готовый кейс:</span>
            {CASE_LIST.map((item) => (
              <button key={item.id} type="button" onClick={() => onLoadCase(item.id)}>
                {item.id} · {item.name}
              </button>
            ))}
          </div>

          <div className="start-actions">
            <Button variant="primary" size="lg" rightIcon={ArrowRight} onClick={() => onStart({ brief, files })}>
              Сформировать оценку и сравнить сценарии
            </Button>
            <span className="start-note"><Clock3 size={14} /> Оценка занимает меньше минуты</span>
          </div>
        </div>

        <aside className="start-side">
          <div className="start-side-head">
            <div className="eyebrow">ЧТО БУДЕТ В РЕЗУЛЬТАТЕ</div>
            <h3>Не дашборд ради дашборда</h3>
          </div>
          <div className="start-benefits">
            <div><span><Layers3 size={16} /></span><div><b>Одна декомпозиция</b><small>6 этапов + сопровождение, две базы затрат — сравнение честное</small></div></div>
            <div><span><ShieldCheck size={16} /></span><div><b>Уверенность и риски</b><small>4 фактора confidence, реестр рисков, P10–P90</small></div></div>
            <div><span><Database size={16} /></span><div><b>Источники и аналоги</b><small>≥ 3 аналога с нормализацией и датой</small></div></div>
            <div><span><FileText size={16} /></span><div><b>Экспорт для согласования</b><small>JSON, CSV и PDF с формулами и допущениями</small></div></div>
          </div>
          <div className="start-side-foot">
            <span className="eyebrow">ДЕМО-КЕЙСЫ</span>
            <div className="start-case-list">
              {CASE_LIST.map((item) => (
                <button key={item.id} type="button" onClick={() => onLoadCase(item.id)}>
                  <span className="case-id">{item.id}</span>
                  <span><b>{item.name}</b><small>{item.type} · {item.integrations} интеграции</small></span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="start-lower">
        <div className="start-steps">
          <div className="eyebrow">КАК ЭТО РАБОТАЕТ</div>
          <div className="step-row">
            <div><span>01</span><b>Бриф и параметры</b><p>Текст, файлы и подтверждение извлечённых параметров.</p></div>
            <div><span>02</span><b>Расчёт и сценарии</b><p>Трудоёмкость, срок, стоимость, диапазоны и риски.</p></div>
            <div><span>03</span><b>Обоснование и экспорт</b><p>Формулы, источники, confidence и документ для согласования.</p></div>
          </div>
        </div>
        <div className="start-recent">
          <div className="eyebrow">ПОСЛЕДНИЕ ОЦЕНКИ</div>
          {saved.length === 0 ? (
            <div className="recent-empty">
              <FileText size={18} />
              <span>Пока нет сохранённых оценок.</span>
              <button type="button" onClick={() => onLoadCase('D1')}>Открыть демо D1 <ArrowRight size={13} /></button>
            </div>
          ) : (
            saved.map((item) => (
              <button key={`${item.id}-${item.date}`} type="button" className="recent-row" onClick={() => onOpenSaved(item.id)}>
                <FileText size={15} />
                <span><b>{item.name}</b><small>{item.date} · {fmtMoney(item.cost)}</small></span>
                <Pill tone="good"><Check size={11} /> Сохранено</Pill>
                <ArrowRight size={14} />
              </button>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
