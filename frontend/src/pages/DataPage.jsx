import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Database, FileJson, FileText, Info, Search,
  ShieldCheck, Upload,
} from 'lucide-react';
import { Button, Pill, SectionHead } from '../components/ui.jsx';
import { mapManifest } from '../core/datasets.js';
import { fetchDatasets, importHelpdesk } from '../core/api.js';

const reasonsText = (report) => {
  const dropped = report?.rowsDropped ?? [];
  if (!dropped.length) return '—';
  return dropped.slice(0, 3).map((item) => item.reason ?? item.row ?? 'ошибка').join(', ');
};

export default function DataPage() {
  const [query, setQuery] = useState('');
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchDatasets()
      .then((data) => {
        if (!alive) return;
        setManifest(mapManifest(data));
        setError('');
      })
      .catch((err) => {
        if (alive) setError(err.message ?? 'API недоступен');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportError('');
    setReport(null);
    try {
      const data = await importHelpdesk(file);
      setReport(data.report ?? null);
    } catch (err) {
      setImportError(err.message ?? 'Не удалось импортировать файл');
    } finally {
      setImporting(false);
    }
  };

  const files = manifest?.files ?? [];
  const filtered = files.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const count = manifest?.datasetCount ?? 0;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TMK DECISION STUDIO · DATA GOVERNANCE</div>
          <h1>Данные и источники</h1>
          <p>Реестр наборов, импорт HelpDesk и контроль качества. Версии фиксируются для воспроизводимости оценки.</p>
        </div>
        <div className="page-heading-side">
          <Pill tone="good"><ShieldCheck size={12} /> Прослеживаемость</Pill>
          <span className="heading-note">
            {loading ? 'Загрузка манифеста…' : error ? 'API недоступен' : `${count} активных наборов`}
          </span>
        </div>
      </div>

      {error && (
        <div className="inline-hint warn">
          <AlertTriangle size={14} /> Манифест недоступен: {error}. Значения не подставлены.
        </div>
      )}

      <div className="data-kpis">
        <div><span>ДАТАСЕТОВ</span><b>{String(count).padStart(2, '0')}</b><small>активных наборов</small></div>
        <div><span>ЗАПИСЕЙ</span><b>{manifest?.totalRows ?? '—'}</b><small>в рабочем контуре</small></div>
        <div><span>ВЕРСИЯ</span><b className="mono">{manifest?.versionShort ?? '—'}</b><small>TMK Decision Studio · datasetVersion</small></div>
        <div><span>ОБНОВЛЕНО</span><b>{manifest?.date ?? '—'}</b><small>дата манифеста</small></div>
      </div>

      <section className="panel">
        <SectionHead
          eyebrow="РЕЕСТР"
          title="Наборы данных"
          description="Версии, хеши, статус валидации и назначение"
          actions={
            <label className="search-field">
              <Search size={14} />
              <input placeholder="Найти набор" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
          }
        />
        <div className="dataset-table">
          <div className="dataset-head"><span>НАБОР</span><span>ЗАПИСЕЙ</span><span>SHA256</span><span>ОБНОВЛЁН</span><span>СТАТУС</span></div>
          {filtered.map((item) => (
            <div className="dataset-row" key={item.path || item.name}>
              <div className="dataset-name"><FileJson size={15} /><div><b>{item.name}</b><small>{item.source}</small></div></div>
              <span>{item.rows}</span>
              <span className="mono">{item.sha256}</span>
              <span>{item.date}</span>
              <Pill tone="good">{item.status}</Pill>
            </div>
          ))}
        </div>
      </section>

      <div className="data-two-col">
        <section className="panel import-panel">
          <SectionHead
            eyebrow="ИНТЕГРАЦИЯ"
            title="Импорт план/факт из HelpDesk"
            description="XLSX или CSV · проверка структуры, пустых значений, дубликатов и нулевого плана"
          />
          <div
            className="import-dropzone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              upload(event.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter') inputRef.current?.click();
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={(event) => upload(event.target.files?.[0])}
            />
            <span className="import-icon"><Upload size={20} /></span>
            <b>{importing ? 'Отправляем на сервер…' : 'Перетащите XLSX или CSV'}</b>
            <span>или выберите файл на устройстве</span>
            <small>Файл уходит на POST /api/import/helpdesk. Не загружайте персональные данные.</small>
          </div>
          <Button variant="primary" disabled={importing} onClick={() => inputRef.current?.click()}>
            Выбрать файл HelpDesk
          </Button>
          {importError && (
            <div className="inline-hint warn">
              <AlertTriangle size={14} /> Импорт не выполнен: {importError}
            </div>
          )}
          <div className="quality-report">
            <div className="quality-head">
              <b>Отчёт о качестве</b>
              <Pill tone={report ? 'good' : importing ? 'info' : 'neutral'}>
                {report ? 'Проверено' : importing ? 'Загрузка' : 'Ожидает файл'}
              </Pill>
            </div>
            <div><span>Всего строк</span><strong>{report?.rowsTotal ?? '—'}</strong></div>
            <div><span>Принято строк</span><strong>{report?.rowsOk ?? '—'}</strong></div>
            <div><span>Отклонено строк</span><strong>{report ? (report.rowsDropped?.length ?? 0) : '—'}</strong></div>
            <div><span>Предупреждений</span><strong>{report ? (report.warnings?.length ?? 0) : '—'}</strong></div>
            <div><span>Причины</span><strong>{reasonsText(report)}</strong></div>
          </div>
          <div className="inline-note">
            <Info size={15} />
            <span>Отчёт формирует backend: структура, дубликаты, пустые значения и нулевой план.</span>
          </div>
        </section>

        <section className="panel">
          <SectionHead
            eyebrow="ПРОИСХОЖДЕНИЕ"
            title="Принцип provenance"
            description="У каждой цифры — источник, дата и метод"
          />
          <div className="provenance-list">
            <div><span className="prov-dot good" /><div><b>Подтверждено</b><small>Источник и дата указаны</small></div></div>
            <div><span className="prov-dot info" /><div><b>Расчёт</b><small>Получено по формуле из входных данных</small></div></div>
            <div><span className="prov-dot warn" /><div><b>Допущение</b><small>Требует проверки владельцем задачи</small></div></div>
            <div><span className="prov-dot neutral" /><div><b>Демо</b><small>Условное значение для прототипа</small></div></div>
          </div>
          <div className="source-card-mini">
            <Database size={16} />
            <div><b>Версия датасетов: {manifest?.versionShort ?? '—'}</b><span>GET /api/datasets · data/manifest.json</span></div>
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
          <span>Task → WorkItem → Estimate → CostLine → Assumption/Risk/Source: импорт источника, валидация и отчёт о качестве связаны одним estimate_id.</span>
        </div>
      </div>
    </div>
  );
}
