import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, FileUp, RefreshCw, Send, X } from 'lucide-react';
import { Button, Pill, SectionHead } from './ui.jsx';
import { fmtMoney } from '../core/format.js';
import {
  approveDataCandidate,
  fetchDataHub,
  importAnalogueFile,
  publishData,
  refreshDataSource,
  rejectDataCandidate,
} from '../core/api.js';

const fmtDate = (value) => String(value ?? '').slice(0, 10);

export default function DataHub({ onPublished }) {
  const [hub, setHub] = useState(null);
  const [sourceId, setSourceId] = useState('manual');
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [changelog, setChangelog] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    try {
      setHub(await fetchDataHub());
      setError('');
    } catch (err) {
      setError(err.message ?? 'Data Hub недоступен');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (key, action) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message ?? 'Операция не выполнена');
    } finally {
      setBusy('');
    }
  };

  const upload = () => run('import', async () => {
    if (!file) throw new Error('Выберите CSV, XLSX или JSON');
    const result = await importAnalogueFile(file, sourceId);
    setReport(result);
    setMessage(`Загружено: ${result.added} новых, ${result.duplicates} дубликатов, ${result.invalid} ошибок`);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  });

  const approve = (id) => run(`approve:${id}`, () => approveDataCandidate(id));
  const reject = (id) => run(`reject:${id}`, () => rejectDataCandidate(id));

  const publish = () => run('publish', async () => {
    if (!changelog.trim()) throw new Error('Укажите changelog публикации');
    const result = await publishData(changelog.trim());
    setChangelog('');
    setMessage(`Опубликована версия ${result.version}, datasetVersion ${result.datasetVersion.slice(0, 12)}…, добавлено ${result.rowsAdded}`);
    if (onPublished) onPublished();
  });

  const candidates = hub?.candidates ?? [];
  const approved = candidates.filter((item) => item.status === 'approved').length;
  const sources = hub?.sources ?? [];
  const releases = hub?.releases ?? [];

  return (
    <section className="panel datahub-panel">
      <SectionHead
        eyebrow="DATA HUB"
        title="Обновление данных"
        description="Загрузка, проверка и публикация новой версии аналогов"
        actions={<Pill tone="info">Версия {hub?.current ?? '—'}</Pill>}
      />
      {error && <div className="inline-hint warn"><AlertTriangle size={14} /> {error}</div>}
      {message && <div className="inline-hint good"><Check size={14} /> {message}</div>}

      <div className="datahub-sources">
        {sources.map((source) => (
          <div className="datahub-source" key={source.id}>
            <div>
              <b>{source.name}</b>
              <span>{source.cadence} · {source.trust}</span>
            </div>
            <Pill tone={source.mode === 'manual' ? 'neutral' : 'info'}>{source.mode}</Pill>
          </div>
        ))}
      </div>

      <div className="datahub-import">
        <div className="datahub-import-controls">
          <label>
            <span>Источник</span>
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
            </select>
          </label>
          <label className="datahub-file">
            <span>Файл аналогов</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <b>{file ? file.name : 'CSV, XLSX или JSON'}</b>
          </label>
          <Button variant="primary" icon={FileUp} disabled={busy === 'import'} onClick={upload}>
            Загрузить в очередь
          </Button>
          <Button
            variant="secondary"
            icon={RefreshCw}
            disabled={busy === `refresh:${sourceId}` || !sources.find((item) => item.id === sourceId)?.feedUrl}
            onClick={() => run(`refresh:${sourceId}`, () => refreshDataSource(sourceId))}
          >
            Live refresh
          </Button>
        </div>
        {report && (
          <div className="datahub-report">
            <span>Строк: <b>{report.rowsTotal}</b></span>
            <span>Новых: <b>{report.added}</b></span>
            <span>Дубликатов: <b>{report.duplicates}</b></span>
            <span>Ошибок: <b>{report.invalid}</b></span>
          </div>
        )}
      </div>

      <div className="datahub-candidates">
        <div className="datahub-subhead">
          <b>Очередь ревью</b>
          <span>{candidates.length} на проверке · {approved} одобрено</span>
        </div>
        {candidates.length === 0 ? (
          <div className="recent-empty"><FileUp size={18} /><span>Очередь пуста. Загрузите файл или обновите источник.</span></div>
        ) : (
          candidates.map((candidate) => (
            <div className={`datahub-candidate ${candidate.status}`} key={candidate.id}>
              <div className="datahub-candidate-main">
                <b>{candidate.row.title}</b>
                <span>{candidate.row.project_type} · {candidate.row.year} · {fmtMoney(candidate.row.price_mid)}</span>
                <small>{candidate.row.source}</small>
              </div>
              <Pill tone={candidate.status === 'approved' ? 'good' : 'warn'}>{candidate.status}</Pill>
              {candidate.status !== 'approved' && (
                <button type="button" className="icon-button subtle" title="Одобрить" onClick={() => approve(candidate.id)}>
                  <Check size={14} />
                </button>
              )}
              <button type="button" className="icon-button subtle" title="Отклонить" onClick={() => reject(candidate.id)}>
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="datahub-publish">
        <label>
          <span>Changelog публикации</span>
          <input
            value={changelog}
            onChange={(event) => setChangelog(event.target.value)}
            placeholder="Например: 3 новых аналога MES/ERP"
          />
        </label>
        <Button variant="primary" icon={Send} disabled={busy === 'publish' || approved === 0} onClick={publish}>
          Опубликовать версию
        </Button>
        <span>Публикация пересоберёт manifest и datasetVersion</span>
      </div>

      <div className="datahub-releases">
        <b>История версий</b>
        {releases.slice(0, 3).map((release) => (
          <div key={release.version}>
            <span className="mono">{release.version}</span>
            <span>{fmtDate(release.publishedAt)}</span>
            <span>{release.changelog}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
