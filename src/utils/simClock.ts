/**
 * Wall-clock-derived tick counter so every browser on the same URL converges
 * to the same `tickCount` at the same real-world moment.
 *
 * The session is anchored to a periodic boundary so replay work on page load
 * is bounded. We pick 4h: at most 7,200 ticks (≈4h × 1,800 ticks/h) to replay,
 * which is fast (<300ms in practice). Every 4h the simulation "resets" — but
 * since the anchor is computed from the absolute wall clock, every viewer agrees
 * on when those resets happen.
 */

export const TICK_MS = 2_000

/** 4 hours — controls how much history a fresh page load has to replay. */
const SESSION_BOUNDARY_MS = 4 * 60 * 60 * 1_000

export function getSessionStart(now: number = Date.now()): number {
  return Math.floor(now / SESSION_BOUNDARY_MS) * SESSION_BOUNDARY_MS
}

export function tickFromWallClock(
  sessionStart: number,
  now: number = Date.now(),
): number {
  return Math.max(0, Math.floor((now - sessionStart) / TICK_MS))
}

/** Milliseconds until the given tick boundary lands. Never negative. */
export function msUntilTick(
  sessionStart: number,
  tick: number,
  now: number = Date.now(),
): number {
  return Math.max(0, sessionStart + tick * TICK_MS - now)
}
