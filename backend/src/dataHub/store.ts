import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  computeManifest,
  loadManifest,
  type AnalogueCorpusFile,
  type AnalogueRow,
} from '@app/data';
import { ApiError } from '../errors.js';
import { reloadDatasets, repoRoot } from '../datasets.js';
import { normaliseRow, parseRows } from './parse.js';
import type {
  Candidate,
  CandidateStatus,
  HubSnapshot,
  ImportReport,
  Release,
  ReleasesFile,
  SourcesFile,
} from './types.js';

const sourcesPath = path.join(repoRoot, 'data', 'sources.json');
const releasesPath = path.join(repoRoot, 'data', 'releases.json');
const corpusPath = path.join(repoRoot, 'data', 'datasets', 'analogue_corpus.json');
const manifestPath = path.join(repoRoot, 'data', 'manifest.json');
const candidatesPath = path.join(repoRoot, '.artifacts', 'data-hub', 'candidates.json');

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function loadSources(): Promise<SourcesFile> {
  return readJson<SourcesFile>(sourcesPath, { version: 1, sources: [] });
}

export async function loadCandidates(): Promise<Candidate[]> {
  return readJson<Candidate[]>(candidatesPath, []);
}

async function saveCandidates(candidates: Candidate[]): Promise<void> {
  await writeJson(candidatesPath, candidates);
}

export async function loadReleases(): Promise<ReleasesFile> {
  return readJson<ReleasesFile>(releasesPath, { current: '2026.11.1', releases: [] });
}

function candidateKey(row: AnalogueRow): string {
  return `${row.source}|${row.title.toLowerCase()}`;
}

export async function importCandidates(rows: Record<string, unknown>[], sourceId: string): Promise<ImportReport> {
  const [corpus, existing] = await Promise.all([
    readJson<AnalogueCorpusFile>(corpusPath, {
      meta: {},
      analogues: [],
      tmk_eis_schema_stub: {},
      tmk_eis_rows: [],
      merge_status: {},
      analogue_count: 0,
    }),
    loadCandidates(),
  ]);
  const active = existing.filter((candidate) => candidate.status !== 'rejected');
  const ids = new Set([
    ...corpus.analogues.map((row) => row.id),
    ...corpus.tmk_eis_rows.map((row) => row.id),
    ...active.map((candidate) => candidate.id),
  ]);
  const keys = new Set(active.map((candidate) => candidateKey(candidate.row)));
  const created: Candidate[] = [];
  const issues: ImportReport['issues'] = [];

  rows.forEach((raw, index) => {
    const normalized = normaliseRow(raw, sourceId, index);
    if (normalized.row === undefined) {
      issues.push({ row: index + 2, reason: normalized.error ?? 'invalid row' });
      return;
    }
    const row = normalized.row;
    if (ids.has(row.id) || keys.has(candidateKey(row))) {
      issues.push({ row: index + 2, reason: `duplicate: ${row.id}` });
      return;
    }
    ids.add(row.id);
    keys.add(candidateKey(row));
    created.push({
      id: row.id,
      sourceId,
      status: 'pending',
      importedAt: new Date().toISOString(),
      row,
      raw,
    });
  });

  if (created.length > 0) {
    await saveCandidates([...existing.filter((candidate) => candidate.status !== 'rejected'), ...created]);
  }

  const duplicates = issues.filter((issue) => issue.reason.startsWith('duplicate')).length;
  return {
    rowsTotal: rows.length,
    added: created.length,
    duplicates,
    invalid: issues.length - duplicates,
    issues,
    candidates: created,
  };
}

export async function setCandidateStatus(id: string, status: CandidateStatus): Promise<Candidate> {
  const candidates = await loadCandidates();
  const index = candidates.findIndex((candidate) => candidate.id === id);
  if (index === -1) throw new ApiError(404, 'not_found', `Candidate ${id} not found`);
  const candidate = candidates[index];
  if (candidate === undefined) throw new ApiError(404, 'not_found', `Candidate ${id} not found`);
  if (candidate.status === 'published') {
    throw new ApiError(409, 'already_published', 'Candidate is already published');
  }
  const updated: Candidate = { ...candidate, status };
  candidates[index] = updated;
  await saveCandidates(candidates);
  return updated;
}

function nextVersion(releases: ReleasesFile): string {
  const now = new Date();
  const prefix = `${now.getUTCFullYear()}.${String(now.getUTCMonth() + 1).padStart(2, '0')}.`;
  const sequence = releases.releases.filter((release) => release.version.startsWith(prefix)).length + 1;
  return `${prefix}${sequence}`;
}

export async function publishApproved(
  changelog: string,
  approvedBy: string,
): Promise<{ version: string; datasetVersion: string; rowsAdded: number; release: Release }> {
  const [candidates, corpus, releases] = await Promise.all([
    loadCandidates(),
    readJson<AnalogueCorpusFile>(corpusPath, {
      meta: {},
      analogues: [],
      tmk_eis_schema_stub: {},
      tmk_eis_rows: [],
      merge_status: {},
      analogue_count: 0,
    }),
    loadReleases(),
  ]);
  const approved = candidates.filter((candidate) => candidate.status === 'approved');
  if (approved.length === 0) {
    throw new ApiError(422, 'nothing_to_publish', 'Approve at least one candidate first');
  }

  const known = new Set(corpus.analogues.map((row) => row.id));
  const fresh = approved.filter((candidate) => !known.has(candidate.id));
  corpus.analogues.push(...fresh.map((candidate) => candidate.row));
  corpus.analogue_count = corpus.analogues.length;
  corpus.meta = {
    ...corpus.meta,
    generated: new Date().toISOString().slice(0, 10),
    last_data_hub_release: changelog,
  };
  await writeJson(corpusPath, corpus);

  const manifest = await computeManifest(repoRoot);
  await writeJson(manifestPath, manifest);
  reloadDatasets();

  const version = nextVersion(releases);
  const release: Release = {
    version,
    datasetVersion: manifest.datasetVersion,
    publishedAt: new Date().toISOString().slice(0, 10),
    approvedBy,
    changelog,
    rowsAdded: fresh.length,
  };
  releases.current = version;
  releases.releases.push(release);
  await writeJson(releasesPath, releases);

  const publishedIds = new Set(approved.map((candidate) => candidate.id));
  await saveCandidates(
    candidates.map((candidate) => (
      publishedIds.has(candidate.id)
        ? { ...candidate, status: 'published' as const, publishedAt: release.publishedAt, release: version }
        : candidate
    )),
  );

  return { version, datasetVersion: manifest.datasetVersion, rowsAdded: fresh.length, release };
}

export async function refreshSource(
  sourceId: string,
): Promise<ImportReport | { skipped: true; reason: string }> {
  const sources = await loadSources();
  const source = sources.sources.find((item) => item.id === sourceId);
  if (source === undefined) throw new ApiError(404, 'not_found', `Source ${sourceId} not found`);
  if (source.feedUrl === undefined || source.feedUrl.trim() === '') {
    return { skipped: true, reason: 'manual_source' };
  }
  const url = source.feedUrl;
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(502, 'source_unavailable', `Source responded with ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = new URL(url).pathname;
  return importCandidates(parseRows(buffer, filename), sourceId);
}

export async function loadHub(): Promise<HubSnapshot> {
  const [sources, candidates, releases, manifest] = await Promise.all([
    loadSources(),
    loadCandidates(),
    loadReleases(),
    loadManifest(repoRoot),
  ]);
  return {
    sources: sources.sources,
    candidates: candidates.filter((candidate) => candidate.status === 'pending' || candidate.status === 'approved'),
    releases: releases.releases.slice().reverse(),
    current: releases.current,
    datasetVersion: manifest?.datasetVersion ?? '',
  };
}
