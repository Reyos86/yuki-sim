/**
 * Seedable PRNG used by every part of the market simulation that needs randomness.
 *
 * Important: this is a single shared module-level instance. Every consumer that
 * imports `random()` from here advances the same stream. This is exactly what we
 * need so that two viewers running the same seed + same number of tick calls
 * stay perfectly in sync.
 *
 * User actions (triggering an event, drawing IDs, etc.) must NOT use this PRNG —
 * they have their own non-deterministic Math.random() calls so that user input
 * never desyncs the shared market stream.
 */

let state = 1337 >>> 0

export function setSeed(seed: number): void {
  state = ((seed >>> 0) || 1) >>> 0
}

export function getSeedState(): number {
  return state
}

/** Mulberry32 — fast, tiny, good distribution. Period ≈ 2^32. */
export function random(): number {
  state = (state + 0x6d2b79f5) >>> 0
  let t = state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
}

/** Box–Muller standard normal using the shared PRNG. */
export function gaussian(): number {
  const u = 1 - random()
  const v = random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** FNV-1a 32-bit hash so string seeds map deterministically to a number. */
export function hashStringSeed(s: string): number {
  let h = 2_166_136_261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16_777_619)
  }
  return h >>> 0
}

export function coerceSeed(raw: string | null | undefined, fallback: number): number {
  if (raw === null || raw === undefined || raw === '') return fallback
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric > 0) return numeric >>> 0
  return hashStringSeed(raw)
}
