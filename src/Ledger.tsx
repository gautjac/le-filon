import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Filon } from "./types";
import { isDue, daysUntilDue } from "./srs";
import { computeStats, reviewFilon, snoozeFilon } from "./store";
import DebtMeter from "./DebtMeter";
import ReviewCard from "./ReviewCard";
import FilonDetail from "./FilonDetail";
import { PickaxeIcon, CheckIcon, ArrowIcon } from "./icons";

interface Props {
  onGoMine: () => void;
}

export default function Ledger({ onGoMine }: Props) {
  const filons = useLiveQuery(() => db.filons.toArray(), [], [] as Filon[]);
  const sources = useLiveQuery(() => db.sources.toArray(), [], []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [justReviewed, setJustReviewed] = useState(0);

  const list = filons ?? [];
  const srcList = sources ?? [];
  const stats = useMemo(() => computeStats(list), [list, bump]);

  // the review queue: due, not mastered, not archived — overdue first
  const queue = useMemo(
    () =>
      list
        .filter((f) => !f.archived && !f.mastered && isDue(f.dueDate))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.box - b.box),
    [list],
  );

  const current = queue[0];
  const srcById = useMemo(() => new Map(srcList.map((s) => [s.id, s])), [srcList]);
  const titleById = useMemo(() => new Map(list.map((f) => [f.id, f.title])), [list]);
  const open = openId ? list.find((f) => f.id === openId) : undefined;

  async function answer(remembered: boolean) {
    if (!current) return;
    await reviewFilon(current.id, remembered);
    setJustReviewed((n) => n + 1);
    setBump((b) => b + 1);
  }

  async function snooze() {
    if (!current) return;
    await snoozeFilon(current.id, 1);
    setBump((b) => b + 1);
  }

  const empty = list.filter((f) => !f.archived).length === 0;

  return (
    <div className="mx-auto max-w-2xl">
      {/* debt meter */}
      <DebtMeter stats={stats} />

      {/* review zone */}
      <div className="mt-7">
        {empty ? (
          <div className="rounded-2xl border border-dashed border-gold/30 bg-rock-800/40 px-6 py-12 text-center">
            <PickaxeIcon className="mx-auto text-3xl text-gold/70" />
            <h2 className="mt-3 font-display text-xl font-bold text-sand">Le registre est vide</h2>
            <p className="mx-auto mt-1.5 max-w-sm font-body text-sm leading-relaxed text-sand/55">
              Colle un texte que tu lis, ou écris un sujet. Le mineur en tire 3 concepts
              et les inscrit ici comme une dette à rembourser — un rappel à la fois.
            </p>
            <button
              onClick={onGoMine}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-rock shadow-lift transition hover:bg-gold-bright active:translate-y-px"
            >
              <PickaxeIcon className="text-base" /> Miner un premier filon
            </button>
          </div>
        ) : current ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-sand">
                À réviser aujourd'hui
              </h2>
              <span className="font-mono text-[0.66rem] uppercase tracking-wider text-gold/70 tnum">
                {queue.length} en file
              </span>
            </div>
            <ReviewCard
              key={current.id}
              filon={current}
              linkedTitles={current.links
                .map((id) => titleById.get(id))
                .filter((t): t is string => Boolean(t))}
              onAnswer={answer}
              onOpenSource={() => setOpenId(current.id)}
            />
            <div className="mt-3 text-center">
              <button
                onClick={snooze}
                className="font-mono text-[0.62rem] uppercase tracking-wider text-sand/40 transition hover:text-sand/70"
              >
                Reporter à demain →
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-malachite/30 bg-malachite/5 px-6 py-10 text-center animate-riseIn">
            <span className="grid mx-auto h-12 w-12 place-items-center rounded-full bg-malachite/15 text-2xl text-malachite">
              <CheckIcon />
            </span>
            <h2 className="mt-3 font-display text-xl font-bold text-sand">
              File vidée pour aujourd'hui
            </h2>
            <p className="mt-1.5 font-body text-sm text-sand/55">
              {justReviewed > 0
                ? `${justReviewed} filon${justReviewed > 1 ? "s révisés" : " révisé"}. La veine s'épaissit.`
                : "Rien de dû aujourd'hui. Reviens demain — ou mine du neuf."}
            </p>
            <button
              onClick={onGoMine}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 font-display text-sm font-bold text-gold transition hover:bg-gold/20"
            >
              Miner du neuf <ArrowIcon className="text-base" />
            </button>
          </div>
        )}
      </div>

      {/* upcoming peek */}
      {!empty && <Upcoming list={list} onOpen={setOpenId} />}

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

function Upcoming({ list, onOpen }: { list: Filon[]; onOpen: (id: string) => void }) {
  const soon = useMemo(
    () =>
      list
        .filter((f) => !f.archived && !f.mastered && !isDue(f.dueDate))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
    [list],
  );
  if (soon.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="mb-2.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-sand/45">
        Bientôt à la surface
      </h3>
      <div className="space-y-1.5">
        {soon.map((f) => {
          const due = daysUntilDue(f.dueDate);
          return (
            <button
              key={f.id}
              onClick={() => onOpen(f.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-rock-500/40 bg-rock-800/40 px-3.5 py-2 text-left transition hover:border-gold/30"
            >
              <span className="truncate font-body text-sm text-sand/75">{f.title}</span>
              <span className="shrink-0 font-mono text-[0.58rem] uppercase tracking-wider text-sand/40 tnum">
                dans {due}j
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
