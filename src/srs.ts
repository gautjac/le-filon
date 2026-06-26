// ── Spaced repetition — Leitner boxes ─────────────────────────────────────────
// Each filon lives in a "box". Higher box = longer interval before it resurfaces.
// A successful recall promotes it one box; a miss resets it to box 1.
// Intervals (days) are tuned so a concept resurfaces *right before* you'd forget it.

/** Interval, in days, for each box. Index 0 = box 1. */
export const BOX_INTERVALS = [1, 3, 7, 16, 35, 75, 150];

/** The box index at which a filon counts as "mastered". */
export const MASTERY_BOX = BOX_INTERVALS.length; // box 7

export function todayISO(now: number = Date.now()): string {
  const d = new Date(now);
  // local-date string yyyy-mm-dd
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date string for `days` from `now` (local). */
export function isoInDays(days: number, now: number = Date.now()): string {
  return todayISO(now + days * 86_400_000);
}

/** Interval in days for a given box (box is 1-based). */
export function intervalForBox(box: number): number {
  const idx = Math.min(Math.max(box, 1), BOX_INTERVALS.length) - 1;
  return BOX_INTERVALS[idx];
}

/** Is this filon due today or overdue? (unreviewed/new filons are always due) */
export function isDue(dueDate: string, now: number = Date.now()): boolean {
  return dueDate <= todayISO(now);
}

/** Days until due (negative = overdue, 0 = today). */
export function daysUntilDue(dueDate: string, now: number = Date.now()): number {
  const today = new Date(todayISO(now) + "T00:00:00").getTime();
  const due = new Date(dueDate + "T00:00:00").getTime();
  return Math.round((due - today) / 86_400_000);
}

export interface SrsState {
  box: number;
  dueDate: string;
  lastReviewedAt: number;
  streak: number;
  reviews: number;
  recalls: number;
  mastered: boolean;
}

export interface SrsInput {
  box: number;
  streak: number;
  reviews: number;
  recalls: number;
}

/**
 * Apply a review result.
 * remembered=true  → promote one box, schedule at its interval.
 * remembered=false → reset to box 1, due tomorrow.
 */
export function review(prev: SrsInput, remembered: boolean, now: number = Date.now()): SrsState {
  const reviews = prev.reviews + 1;
  if (remembered) {
    const box = Math.min(prev.box + 1, MASTERY_BOX);
    return {
      box,
      dueDate: isoInDays(intervalForBox(box), now),
      lastReviewedAt: now,
      streak: prev.streak + 1,
      reviews,
      recalls: prev.recalls + 1,
      mastered: box >= MASTERY_BOX,
    };
  }
  return {
    box: 1,
    dueDate: isoInDays(1, now),
    lastReviewedAt: now,
    streak: 0,
    reviews,
    recalls: prev.recalls,
    mastered: false,
  };
}

/** Initial schedule for a freshly mined filon: box 1, due today (recall it now-ish). */
export function freshSchedule(now: number = Date.now()): { box: number; dueDate: string } {
  return { box: 1, dueDate: todayISO(now) };
}

/** A friendly French label for when a box is next due. */
export function boxLabel(box: number): string {
  const labels = ["Nouveau", "Frais", "Tendre", "Solide", "Ancré", "Profond", "Maîtrisé", "Maîtrisé"];
  return labels[Math.min(box, labels.length - 1)];
}
