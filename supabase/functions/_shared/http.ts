/** Returns a JSON error response with the given status code. */
export function httpError(status: number, code: string, details?: unknown): Response {
  const body = JSON.stringify({ error: code, ...(details ? { details } : {}) });
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Returns a JSON success response. */
export function httpOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
