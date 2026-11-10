import React, { useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Check, Database, FileText, Layers3,
  ShieldCheck, Upload, X,
} from 'lucide-react';
import { Button, Pill } from './ui.jsx';
import { CASE_LIST } from '../data/cases.js';
import { fmtMoney } from '../core/format.js';

export default function StartScreen({ onStart, onLoadCase, onOpenSaved, saved }) {
  const [brief, setBrief] = useState('');
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const names = Array.from(fileList || []).map((file) => file.name);
    if (names.length) setFiles((old) => [...new Set([...old, ...names])]);
  };

  return (
    <main className="start-page">
      <section className="start-hero">
        <div className="start-hero-copy">
          <div className="eyebrow light">TMK DECISION STUDIO · РАДИОХАК 4.0</div>
          <h1>
            СДЕЛАТЬ
            <br />
            <span>ИЛИ ЗАКАЗАТЬ?</span>
          </h1>
          <p className="start-lede">
            Опишите ИТ-задачу и получите оценку срока, стоимости и сравнение трёх моделей реализации.
          </p>
          <div className="hero-stats">
            <div><b>3</b><span>сценария</span><small>команда · подрядчик · гибрид</small></div>
            <div><b>P10–P90</b><span>диапазон</span><small>оценка с интервалом</small></div>
            <div><b>100%</b><span>расчёт</span><small>формулы и допущения</small></div>
          </div>
          <div className="hero-trust">
            <ShieldCheck size={15} /> Демонстрационные данные
            <span>·</span>
            <span>расчёт воспроизводим</span>
          </div>
        </div>
      </section>

      <section className="start-grid">
        <div className="new-assessment">
          <div className="new-assessment-head">
            <div>
              <div className="eyebrow">НОВАЯ ОЦЕНКА</div>
              <h2>Опишите задачу</h2>
              <p>Вставьте бриф, приложите ТЗ или выберите демо-кейс.</p>
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
              Рассчитать три сценария
            </Button>
          </div>
        </div>

        <aside className="start-side">
          <div className="start-side-head">
            <div className="eyebrow">РЕЗУЛЬТАТ</div>
            <h3>Состав отчёта</h3>
          </div>
          <div className="start-benefits">
            <div><span><Layers3 size={16} /></span><div><b>Три сценария</b><small>Команда, подрядчик и гибрид.</small></div></div>
            <div><span><ShieldCheck size={16} /></span><div><b>Срок и стоимость</b><small>P10–P90, TCO и break-even.</small></div></div>
            <div><span><Database size={16} /></span><div><b>Источники</b><small>Аналоги, ставки и допущения с датой.</small></div></div>
            <div><span><FileText size={16} /></span><div><b>Экспорт</b><small>PDF, XLSX и JSON.</small></div></div>
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
            <div><span>01</span><b>Бриф</b><p>Текст, файлы и параметры.</p></div>
            <div><span>02</span><b>Расчёт</b><p>Три сценария, срок и стоимость.</p></div>
            <div><span>03</span><b>Экспорт</b><p>PDF, XLSX или JSON.</p></div>
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
