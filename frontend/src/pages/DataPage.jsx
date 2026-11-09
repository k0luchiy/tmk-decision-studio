import React, { useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Database, FileJson, FileSpreadsheet, FileText,
  Info, Search, ShieldCheck, Upload,
} from 'lucide-react';
import { Button, Pill, SectionHead } from '../components/ui.jsx';

const DATASETS = [
  { name: 'benchmark_rates.json', rows: '113', version: 'v0.3 · 9f2a1c', updated: '09.11.2026', status: 'Валидирован', tone: 'good', text: 'Ставки, роли и производительность' },
  { name: 'tmk_it_contracts.json', rows: '60', version: 'v0.2 · 8b17d4', updated: '09.11.2026', status: 'Валидирован', tone: 'good', text: 'Публичные контракты ТМК, НМЦК' },
  { name: 'analogue_corpus.json', rows: '49', version: 'v0.2 · 31ac09', updated: '09.11.2026', status: 'Проверка', tone: 'warn', text: 'Опубликованные рыночные якоря' },
  { name: 'helpdesk_schema.json', rows: '4 поля', version: 'v1.0 · a91d2e', updated: '08.11.2026', status: 'Схема', tone: 'info', text: 'План / факт / заквотированные часы' },
  { name: 'risk_factors.json', rows: '27', version: 'v0.1 · 6c2f10', updated: '08.11.2026', status: 'Проверка', tone: 'warn', text: 'Шаблоны рисков по категориям' },
];

export default function DataPage() {
  const [query, setQuery] = useState('');
  const [imported, setImported] = useState(null);
  const inputRef = useRef(null);
  const filtered = DATASETS.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DATA GOVERNANCE · 03</div>
          <h1>Данные и источники</h1>
          <p>Реестр наборов, импорт HelpDesk и контроль качества. Версии фиксируются для воспроизводимости оценки.</p>
        </div>
        <div className="page-heading-side">
          <Pill tone="good"><ShieldCheck size={12} /> Прослеживаемость</Pill>
          <span className="heading-note">5 активных наборов</span>
        </div>
      </div>

      <div className="data-kpis">
        <div><span>ДАТАСЕТОВ</span><b>05</b><small>активных наборов</small></div>
        <div><span>ЗАПИСЕЙ</span><b>253</b><small>в демонстрационном контуре</small></div>
        <div><span>ВАЛИДАЦИЯ</span><b>09.11</b><small>2026 · 10:42 UTC+5</small></div>
        <div><span>КАЧЕСТВО</span><b>94,2%</b><small>в пределах правил</small></div>
      </div>

      <section className="panel">
        <SectionHead
          eyebrow="РЕЕСТР"
          title="Наборы данных"
          description="Версии, статус валидации и назначение"
          actions={
            <label className="search-field">
              <Search size={14} />
              <input placeholder="Найти набор" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          }
        />
        <div className="dataset-table">
          <div className="dataset-head"><span>НАБОР</span><span>ЗАПИСЕЙ</span><span>ВЕРСИЯ / HASH</span><span>ОБНОВЛЁН</span><span>СТАТУС</span></div>
          {filtered.map((item) => (
            <div className="dataset-row" key={item.name}>
              <div className="dataset-name"><FileJson size={15} /><div><b>{item.name}</b><small>{item.text}</small></div></div>
              <span>{item.rows}</span>
              <span className="mono">{item.version}</span>
              <span>{item.updated}</span>
              <Pill tone={item.tone}>{item.status}</Pill>
            </div>
          ))}
        </div>
      </section>

      <div className="data-two-col">
        <section className="panel import-panel">
          <SectionHead
            eyebrow="ИНТЕГРАЦИЯ"
            title="Импорт план/факт из HelpDesk"
            description="CSV или JSON · проверка структуры, пустых значений, дубликатов и нулевого плана"
          />
          <div
            className="import-dropzone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) setImported(file.name);
            }}
            role="button"
            tabIndex={0}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImported(file.name);
              }}
            />
            <span className="import-icon"><Upload size={20} /></span>
            <b>{imported ? `Файл выбран: ${imported}` : 'Перетащите CSV или JSON'}</b>
            <span>или выберите файл на устройстве</span>
            <small>Файл обрабатывается локально. Не загружайте персональные данные.</small>
          </div>
          <Button
            variant="primary"
            icon={FileSpreadsheet}
            onClick={() => setImported((old) => old || 'helpdesk_export_demo.csv')}
          >
            Проверить демо-выгрузку
          </Button>
          <div className="quality-report">
            <div className="quality-head"><b>Отчёт о качестве</b><Pill tone={imported ? 'good' : 'neutral'}>{imported ? 'Проверено' : 'Ожидает файл'}</Pill></div>
            <div><span>Принято строк</span><strong>{imported ? '4' : '—'}</strong></div>
            <div><span>Отклонено строк</span><strong>{imported ? '1' : '—'}</strong></div>
            <div><span>Причина</span><strong>{imported ? 'Плановые часы = 0' : '—'}</strong></div>
            <div><span>Дубликаты</span><strong>{imported ? '0' : '—'}</strong></div>
          </div>
          <div className="inline-note">
            <Info size={15} />
            <span>В демо импорт не отправляет данные на сервер. В production — валидация, версионирование и запись в контур.</span>
          </div>
        </section>

        <section className="panel">
          <SectionHead
            eyebrow="ПРОИСХОЖДЕНИЕ"
            title="Принцип provenance"
            description="У каждой цифры — источник, дата и метод"
          />
          <div className="provenance-list">
            <div><span className="prov-dot good" /><div><b>Подтверждено</b><small>Есть проверяемый источник и дата</small></div></div>
            <div><span className="prov-dot info" /><div><b>Расчёт</b><small>Получено по формуле из входных данных</small></div></div>
            <div><span className="prov-dot warn" /><div><b>Допущение</b><small>Требует проверки владельцем задачи</small></div></div>
            <div><span className="prov-dot neutral" /><div><b>Демо</b><small>Условное значение для прототипа</small></div></div>
          </div>
          <div className="source-card-mini">
            <Database size={16} />
            <div><b>Версия модели: 2.0</b><span>Датасеты связаны с estimate_id и версией методики</span></div>
          </div>
          <div className="source-card-mini">
            <FileText size={16} />
            <div><b>HelpDesk schema v1.0</b><span>16 полей: номер, тип, специалист, план, факт, заквотировано</span></div>
          </div>
          <div className="source-card-mini">
            <AlertTriangle size={16} />
            <div><b>Ограничение демо</b><span>Аналоги и ставки не являются подтверждёнными закупочными ценами</span></div>
          </div>
        </section>
      </div>

      <div className="data-footer-note">
        <CheckCircle2 size={16} />
        <div>
          <b>Единая модель данных</b>
          <span>Task → WorkItem → Estimate → CostLine → Risk/Source: импорт источника, валидация и отчёт о качестве связаны одним estimate_id.</span>
        </div>
      </div>
    </div>
  );
}
