import Dexie, { type EntityTable } from "dexie";
import type { Filon, Source } from "./types";

// ── Local-first store (IndexedDB via Dexie) ───────────────────────────────────
const db = new Dexie("le-filon") as Dexie & {
  filons: EntityTable<Filon, "id">;
  sources: EntityTable<Source, "id">;
};

db.version(1).stores({
  // indexes we query/sort on
  filons: "id, sourceId, box, dueDate, createdAt, mastered, archived",
  sources: "id, createdAt",
});

export { db };

export function newId(prefix = "f"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
