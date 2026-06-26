import { useMemo } from "react";
import type { DebtStats } from "./store";
import { MASTERY_BOX, boxLabel } from "./srs";

interface Props {
  stats: DebtStats;
  compact?: boolean;
}

/**
 * The "dette de savoir" meter: total owed vs mastered, plus a growing gold-vein
 * visualization. Each mastered filon lights a branch of the vein; owed ones are
 * dim rock waiting to be struck.
 */
export default function DebtMeter({ stats, compact }: Props) {
  const { total, mastered, owed, byBox } = stats;
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  // deterministic vein branches (so it doesn't reshuffle every render)
  const branches = useMemo(() => buildVein(Math.min(total, 60)), [total]);

  return (
    <div className={compact ? "" : "rounded-2xl border border-gold/15 bg-rock-800/60 p-5 shadow-seam"}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-gold/70">
            Dette de savoir
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold leading-none text-sand tnum">
              {owed}
            </span>
            <span className="font-body text-sm text-sand/55">
              {owed === 1 ? "filon dû" : "filons dûs"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-malachite/80">
            Maîtrisés
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-malachite tnum">
            {mastered}
            <span className="ml-1 text-base font-normal text-sand/40">/ {total}</span>
          </div>
        </div>
      </div>

      {/* the vein */}
      <div className="relative mt-4 h-28 w-full overflow-hidden rounded-xl border border-rock-500/50 bg-gradient-to-b from-rock-700/70 to-rock/80">
        <svg viewBox="0 0 320 112" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {branches.map((b, i) => {
            const lit = i < Math.round((mastered / Math.max(total, 1)) * branches.length);
            return (
              <path
                key={i}
                d={b.d}
                fill="none"
                stroke={lit ? "url(#goldgrad)" : "rgba(120,96,70,0.35)"}
                strokeWidth={lit ? b.w : Math.max(b.w - 0.6, 0.7)}
                strokeLinecap="round"
                opacity={lit ? 1 : 0.7}
              />
            );
          })}
          <defs>
            <linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c98f2c" />
              <stop offset="55%" stopColor="#e8b04b" />
              <stop offset="100%" stopColor="#f2d27a" />
            </linearGradient>
          </defs>
        </svg>
        {total === 0 && (
          <div className="absolute inset-0 grid place-items-center px-4 text-center font-body text-sm italic text-sand/45">
            La roche est encore nue. Minez votre premier filon.
          </div>
        )}
      </div>

      {/* mastery progress bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.16em] text-sand/50">
          <span>Veine d'or</span>
          <span className="text-gold/80 tnum">{masteredPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-rock-600">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-bright transition-[width] duration-700"
            style={{ width: `${masteredPct}%` }}
          />
        </div>
      </div>

      {/* box distribution */}
      {!compact && total > 0 && (
        <div className="mt-5">
          <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-sand/50">
            Répartition par profondeur
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 56 }}>
            {byBox.map((count, idx) => {
              const max = Math.max(...byBox, 1);
              const h = count === 0 ? 4 : 8 + (count / max) * 44;
              const isMastery = idx + 1 === MASTERY_BOX;
              return (
                <div key={idx} className="flex flex-1 flex-col items-center gap-1" title={`${boxLabel(idx + 1)} — ${count}`}>
                  <span className="font-mono text-[0.6rem] text-sand/55 tnum">{count || ""}</span>
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      isMastery
                        ? "bg-gradient-to-t from-malachite/70 to-malachite"
                        : "bg-gradient-to-t from-copper/45 to-gold/70"
                    }`}
                    style={{ height: h }}
                  />
                  <span className="font-mono text-[0.52rem] uppercase tracking-wide text-sand/35">
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Builds a tree of vein branches across the panel (deterministic).
function buildVein(n: number): { d: string; w: number }[] {
  const branches: { d: string; w: number }[] = [];
  if (n === 0) return branches;
  // a main diagonal spine
  branches.push({ d: "M8 100 C 70 86, 120 72, 170 52 S 280 22, 314 10", w: 3.4 });
  // ribs hanging off the spine, seeded deterministically
  const count = Math.min(n, 26);
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const sx = 8 + t * 306;
    const sy = 100 - t * 90;
    const dir = i % 2 === 0 ? 1 : -1;
    const len = 14 + ((i * 37) % 26);
    const ex = sx + dir * (8 + ((i * 13) % 16));
    const ey = sy + dir * len * 0.4 + ((i % 3) - 1) * 6;
    const cx = sx + dir * 6;
    const cy = sy + dir * len * 0.2;
    branches.push({ d: `M${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, w: 1 + ((i * 7) % 10) / 10 });
  }
  return branches;
}
