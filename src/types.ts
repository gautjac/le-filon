// ── Le Filon — shared domain types ────────────────────────────────────────────

/** A "filon" (vein of ore) = one consolidated concept entered into the ledger. */
export interface Filon {
  id: string;
  title: string;
  /** crisp 1–2 sentence explanation, Québécois French plain language */
  explanation: string;
  /** why it matters / how it connects */
  whyItMatters: string;
  /** the source snippet this was mined from (for jumping back to context) */
  sourceSnippet: string;
  /** label for the source (user-given or auto: "Article collé", a topic, etc.) */
  sourceLabel: string;
  /** id of the ingest batch this filon came from */
  sourceId: string;

  // ── spaced-repetition state (Leitner) ──
  /** 0 = unreviewed/new; 1..N = Leitner box (higher = better mastered) */
  box: number;
  /** ISO date (yyyy-mm-dd) this filon is next due for review */
  dueDate: string;
  /** ISO timestamp it was created */
  createdAt: number;
  /** ISO timestamp of the last review, or null */
  lastReviewedAt: number | null;
  /** number of successful recalls in a row */
  streak: number;
  /** total reviews ever */
  reviews: number;
  /** total successful recalls ever */
  recalls: number;
  /** ids of other filons this one connects to (a small knowledge graph) */
  links: string[];
  /** true once box has reached the mastery box and stays there */
  mastered: boolean;
  /** user can archive a filon to remove it from the debt without deleting */
  archived: boolean;
}

/** A source = one paste/topic that yielded a batch of filons. */
export interface Source {
  id: string;
  label: string;
  /** the full original text (snippet kept on each filon; this keeps the whole thing) */
  text: string;
  /** "paste" (text was pasted) | "topic" (a topic was typed) */
  kind: "paste" | "topic";
  createdAt: number;
  /** number of filons mined from this source */
  filonCount: number;
}

/** What Claude returns for one extracted concept. */
export interface ExtractedConcept {
  title: string;
  explanation: string;
  whyItMatters: string;
  /** a representative ~1 sentence quote/paraphrase from the source */
  sourceSnippet: string;
  /** titles of existing filons this connects to (subset of provided candidates) */
  linkTitles: string[];
}

export interface ExtractResult {
  /** a short label for this source, in French */
  sourceLabel: string;
  /** the kind detected */
  kind: "paste" | "topic";
  concepts: ExtractedConcept[];
}

export type Lang = "fr" | "en";
