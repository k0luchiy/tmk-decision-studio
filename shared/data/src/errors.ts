/** Raised when a dataset file cannot be read or parsed. Carries the file path and the cause. */
export class DataLoadError extends Error {
  readonly path: string;

  constructor(filePath: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to load dataset "${filePath}": ${reason}`, { cause });
    this.name = 'DataLoadError';
    this.path = filePath;
  }
}
