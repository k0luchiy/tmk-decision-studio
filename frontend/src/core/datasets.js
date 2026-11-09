/** Pure helpers for the `GET /api/datasets` manifest used by the Data screen. */

const baseName = (path) => String(path ?? '').split('/').pop() ?? '';

const shortHash = (sha256) => String(sha256 ?? '').slice(0, 8);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ru-RU');
};

/**
 * Maps the backend manifest into table rows plus KPI aggregates.
 * The backend already validated every dataset, so any manifest row is
 * rendered as `Валидирован`; hashes and dates stay traceable.
 */
export function mapManifest(manifest = {}) {
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const rows = files.map((file) => ({
    name: baseName(file.path),
    path: file.path ?? '',
    rows: Number(file.rows) || 0,
    sha256: shortHash(file.sha256),
    generatedAt: file.generatedAt ?? null,
    date: formatDate(file.generatedAt),
    status: 'Валидирован',
    ok: true,
    source: file.source ?? '',
  }));
  const totalRows = rows.reduce((acc, row) => acc + row.rows, 0);
  const datasetVersion = String(manifest.datasetVersion ?? '');
  return {
    files: rows,
    datasetVersion,
    versionShort: datasetVersion ? `${datasetVersion.slice(0, 8)}…` : '—',
    generatedAt: manifest.generatedAt ?? null,
    date: formatDate(manifest.generatedAt),
    datasetCount: rows.length,
    totalRows,
  };
}
