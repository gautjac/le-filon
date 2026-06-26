import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Filon } from "./types";
import { boxLabel, daysUntilDue, isDue, MASTERY_BOX } from "./srs";
import { SearchIcon, LinkIcon } from "./icons";
import FilonDetail from "./FilonDetail";

type SortKey = "due" | "recent" | "box" | "title";
type Filter = "all" | "due" | "owed" | "mastered" | "archived";

export default function Library() {
  const filons = useLiveQuery(() => db.filons.toArray(), [], [] as Filon[]);
  const sources = useLiveQuery(() => db.sources.toArray(), [], []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("due");
  const [openId, setOpenId] = useState<string | null>(null);
  const [bump, setBump] = useState(0); // force refresh after detail edits

  const list = filons ?? [];
  const srcList = sources ?? [];
  const srcById = useMemo(() => new Map(srcList.map((s) => [s.id, s])), [srcList]);

  const sourceOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const f of list) if (!seen.has(f.sourceId)) seen.set(f.sourceId, f.sourceLabel);
    return Array.from(seen.entries());
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = list.filter((f) => {
      if (filter === "archived") return f.archived;
      if (f.archived) return false;
      if (filter === "due") return !f.mastered && isDue(f.dueDate);
      if (filter === "owed") return !f.mastered;
      if (filter === "mastered") return f.mastered;
      return true;
    });
    if (sourceFilter) out = out.filter((f) => f.sourceId === sourceFilter);
    if (q) {
      out = out.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.explanation.toLowerCase().includes(q) ||
          f.whyItMatters.toLowerCase().includes(q) ||
          f.sourceLabel.toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    sorted.sort((a, b) => {
      if (sort === "due") return a.dueDate.localeCompare(b.dueDate) || b.createdAt - a.createdAt;
      if (sort === "recent") return b.createdAt - a.createdAt;
      if (sort === "box") return b.box - a.box || a.dueDate.localeCompare(b.dueDate);
      return a.title.localeCompare(b.title, "fr");
    });
    return sorted;
  }, [list, query, filter, sourceFilter, sort, bump]);

  const open = openId ? list.find((f) => f.id === openId) : undefined;

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "due", label: "À réviser" },
    { key: "owed", label: "Dûs" },
    { key: "mastered", label: "Maîtrisés" },
    { key: "archived", label: "Archivés" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 text-center">
        <h1 className="font-display text-3xl font-extrabold text-sand sm:text-4xl">Le registre</h1>
        <p className="mt-2 font-body text-[0.96rem] text-sand/60">
          {list.filter((f) => !f.archived).length} filons minés · cherche, filtre, relie.
        </p>
      </div>

      {/* search */}
      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-sand/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un filon, une explication, une source…"
          className="w-full rounded-full border border-gold/20 bg-rock-800/70 py-3 pl-11 pr-4 font-body text-sand placeholder:text-sand/35 outline-none transition focus:border-gold/50"
        />
      </div>

      {/* filter tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-[0.64rem] uppercase tracking-wider transition ${
              filter === t.key
                ? "border-gold bg-gold/15 text-gold"
                : "border-sand/20 text-sand/55 hover:border-sand/40 hover:text-sand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* source + sort */}
      <div className="mb-5 flex flex-wrap items-center gap-3 font-mono text-[0.64rem] uppercase tracking-wider text-sand/50">
        {sourceOptions.length > 0 && (
          <label className="flex items-center gap-2">
            Source
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-md border border-sand/20 bg-rock-700 px-2 py-1 font-mono text-[0.64rem] text-sand outline-none focus:border-gold/50"
            >
              <option value="">toutes</option>
              {sourceOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2">
          Trier
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-sand/20 bg-rock-700 px-2 py-1 font-mono text-[0.64rem] text-sand outline-none focus:border-gold/50"
          >
            <option value="due">échéance</option>
            <option value="recent">récents</option>
            <option value="box">profondeur</option>
            <option value="title">titre</option>
          </select>
        </label>
        <span className="ml-auto text-sand/40 tnum">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-rock-500/50 bg-rock-800/50 px-6 py-12 text-center font-body italic text-sand/45">
          Rien ici. {filter !== "all" ? "Change de filtre" : "Mine ton premier filon"}.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((f) => {
            const due = daysUntilDue(f.dueDate);
            return (
              <button
                key={f.id}
                onClick={() => setOpenId(f.id)}
                className="block w-full rounded-xl border border-rock-500/50 bg-rock-800/60 p-4 text-left transition hover:border-gold/40 hover:bg-rock-700/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[1.05rem] font-bold text-sand">
                      {f.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 font-body text-sm leading-snug text-sand/60">
                      {f.explanation}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.58rem] uppercase tracking-wider text-sand/40">
                      <span className="text-gold/60">◆ {f.sourceLabel}</span>
                      {f.links.length > 0 && (
                        <span className="flex items-center gap-1 text-azurite/70">
                          <LinkIcon className="text-[0.7rem]" /> {f.links.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-wide ${
                        f.mastered
                          ? "border-malachite/50 bg-malachite/10 text-malachite"
                          : "border-gold/40 bg-gold/10 text-gold"
                      }`}
                    >
                      {boxLabel(f.box)} {f.box}/{MASTERY_BOX}
                    </span>
                    {!f.mastered && !f.archived && (
                      <span
                        className={`font-mono text-[0.56rem] uppercase tracking-wide tnum ${
                          due < 0 ? "text-ember" : due === 0 ? "text-gold/70" : "text-sand/35"
                        }`}
                      >
                        {due < 0 ? `+${-due}j retard` : due === 0 ? "aujourd'hui" : `dans ${due}j`}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <FilonDetail
          filon={open}
          source={srcById.get(open.sourceId)}
          allFilons={list}
          onClose={() => setOpenId(null)}
          onChanged={() => setBump((b) => b + 1)}
        />
      )}
    </div>
  );
}
