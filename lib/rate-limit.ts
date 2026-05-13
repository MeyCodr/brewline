interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();
let lastClean = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastClean < 60_000) return;
  lastClean = now;
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
}

export function rateLimit(
  identifier: string,
  { limit = 30, windowMs = 60_000 } = {}
): { ok: boolean; remaining: number; retryAfterMs: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, retryAfterMs: 0 };
}
