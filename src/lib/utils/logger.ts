export function logInfo(message: string, meta?: Record<string, unknown>) {
  console.info(`[info] ${message}`, meta ?? {});
}

export function logError(message: string, meta?: Record<string, unknown>) {
  console.error(`[error] ${message}`, meta ?? {});
}
