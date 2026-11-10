import type { AnalogueRow } from '@app/data';

export interface DataSource {
  id: string;
  name: string;
  kind: string;
  cadence: string;
  mode: 'parser' | 'manual';
  keywords?: string[];
  okpd2?: string[];
  trust: string;
  enabled: boolean;
  feedUrl?: string;
}

export interface SourcesFile {
  version: number;
  sources: DataSource[];
}

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'published';

export interface Candidate {
  id: string;
  sourceId: string;
  status: CandidateStatus;
  importedAt: string;
  row: AnalogueRow;
  raw?: Record<string, unknown>;
  publishedAt?: string;
  release?: string;
}

export interface ImportIssue {
  row: number;
  reason: string;
}

export interface ImportReport {
  rowsTotal: number;
  added: number;
  duplicates: number;
  invalid: number;
  issues: ImportIssue[];
  candidates: Candidate[];
}

export interface Release {
  version: string;
  datasetVersion: string;
  publishedAt: string;
  approvedBy: string;
  changelog: string;
  rowsAdded: number;
}

export interface ReleasesFile {
  current: string;
  releases: Release[];
}

export interface HubSnapshot {
  sources: DataSource[];
  candidates: Candidate[];
  releases: Release[];
  current: string;
  datasetVersion: string;
}
