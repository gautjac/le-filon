import { db, newId } from "./db";
import { freshSchedule, review as srsReview, isDue, isoInDays, MASTERY_BOX } from "./srs";
import type { ExtractResult, Filon, Source } from "./types";

// ── Add a mined batch to the ledger ───────────────────────────────────────────
export interface AddResult {
  source: Source;
  filons: Filon[];
}

export async function addMinedBatch(rawInput: string, result: ExtractResult): Promise<AddResult> {
  const now = Date.now();
  const sourceId = newId("s");
  const source: Source = {
    id: sourceId,
    label: result.sourceLabel || "Source",
    text: rawInput,
    kind: result.kind,
    createdAt: now,
    filonCount: result.concepts.length,
  };

  // Resolve link titles → existing filon ids (links are bidirectional).
  const all = await db.filons.toArray();
  const titleToId = new Map<string, string>();
  for (const f of all) titleToId.set(f.title, f.id);

  const created: Filon[] = result.concepts.map((c, idx) => {
    const sched = freshSchedule(now + idx); // tiny offset to keep stable ordering
    const linkIds = c.linkTitles
      .map((t) => titleToId.get(t))
      .filter((x): x is string => Boolean(x));
    return {
      id: newId("f"),
      title: c.title,
      explanation: c.explanation,
      whyItMatters: c.whyItMatters,
      sourceSnippet: c.sourceSnippet,
      sourceLabel: source.label,
      sourceId,
      box: sched.box,
      dueDate: sched.dueDate,
      createdAt: now + idx,
      lastReviewedAt: null,
      streak: 0,
      reviews: 0,
      recalls: 0,
      links: linkIds,
      mastered: false,
      archived: false,
    };
  });

  await db.transaction("rw", db.sources, db.filons, async () => {
    await db.sources.add(source);
    await db.filons.bulkAdd(created);
    // wire the reverse links on the existing filons
    for (const nf of created) {
      for (const targetId of nf.links) {
        const target = await db.filons.get(targetId);
        if (target && !target.links.includes(nf.id)) {
          await db.filons.update(targetId, { links: [...target.links, nf.id] });
        }
      }
    }
  });

  return { source, filons: created };
}

// ── Review a filon ────────────────────────────────────────────────────────────
export async function reviewFilon(id: string, remembered: boolean): Promise<void> {
  const f = await db.filons.get(id);
  if (!f) return;
  const next = srsReview(
    { box: f.box, streak: f.streak, reviews: f.reviews, recalls: f.recalls },
    remembered,
  );
  await db.filons.update(id, {
    box: next.box,
    dueDate: next.dueDate,
    lastReviewedAt: next.lastReviewedAt,
    streak: next.streak,
    reviews: next.reviews,
    recalls: next.recalls,
    mastered: next.mastered,
  });
}

// ── Manual link / unlink (knowledge graph editing) ────────────────────────────
export async function toggleLink(aId: string, bId: string): Promise<void> {
  if (aId === bId) return;
  await db.transaction("rw", db.filons, async () => {
    const a = await db.filons.get(aId);
    const b = await db.filons.get(bId);
    if (!a || !b) return;
    const linked = a.links.includes(bId);
    if (linked) {
      await db.filons.update(aId, { links: a.links.filter((x) => x !== bId) });
      await db.filons.update(bId, { links: b.links.filter((x) => x !== aId) });
    } else {
      await db.filons.update(aId, { links: [...a.links, bId] });
      await db.filons.update(bId, { links: [...b.links, aId] });
    }
  });
}

// ── Archive / restore / delete ────────────────────────────────────────────────
export async function setArchived(id: string, archived: boolean): Promise<void> {
  await db.filons.update(id, { archived });
}

export async function deleteFilon(id: string): Promise<void> {
  await db.transaction("rw", db.filons, async () => {
    const f = await db.filons.get(id);
    if (!f) return;
    // unwire reverse links
    for (const otherId of f.links) {
      const other = await db.filons.get(otherId);
      if (other) {
        await db.filons.update(otherId, { links: other.links.filter((x) => x !== id) });
      }
    }
    await db.filons.delete(id);
  });
}

// ── Bury / postpone a due filon by N days ─────────────────────────────────────
export async function snoozeFilon(id: string, days: number): Promise<void> {
  const f = await db.filons.get(id);
  if (!f) return;
  await db.filons.update(id, { dueDate: isoInDays(days) });
}

// ── Derived stats ─────────────────────────────────────────────────────────────
export interface DebtStats {
  total: number;
  mastered: number;
  owed: number; // active, not yet mastered
  dueToday: number;
  /** count by box, index 0 = box 1 .. MASTERY_BOX */
  byBox: number[];
  /** overall recall accuracy 0..1, or null if no reviews yet */
  accuracy: number | null;
  /** longest current streak across all filons */
  bestStreak: number;
}

export function computeStats(filons: Filon[]): DebtStats {
  const active = filons.filter((f) => !f.archived);
  const total = active.length;
  const mastered = active.filter((f) => f.mastered).length;
  const owed = total - mastered;
  const dueToday = active.filter((f) => !f.mastered && isDue(f.dueDate)).length;
  const byBox = Array.from({ length: MASTERY_BOX }, () => 0);
  let reviews = 0;
  let recalls = 0;
  let bestStreak = 0;
  for (const f of active) {
    const idx = Math.min(Math.max(f.box, 1), MASTERY_BOX) - 1;
    byBox[idx] += 1;
    reviews += f.reviews;
    recalls += f.recalls;
    if (f.streak > bestStreak) bestStreak = f.streak;
  }
  return {
    total,
    mastered,
    owed,
    dueToday,
    byBox,
    accuracy: reviews > 0 ? recalls / reviews : null,
    bestStreak,
  };
}
