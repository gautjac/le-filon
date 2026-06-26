import { useEffect, useState } from "react";
import type { Filon } from "./types";
import { boxLabel, daysUntilDue } from "./srs";
import { CheckIcon, RotateIcon, LinkIcon } from "./icons";

interface Props {
  filon: Filon;
  linkedTitles: string[];
  onAnswer: (remembered: boolean) => void;
  onOpenSource: () => void;
}

/**
 * One self-check card. The title shows; the user tries to recall, reveals the
 * explanation, then taps "Je m'en souviens" or "Pas encore".
 */
export default function ReviewCard({ filon, linkedTitles, onAnswer, onOpenSource }: Props) {
  const [revealed, setRevealed] = useState(false);

  // reset reveal when the filon changes
  useEffect(() => setRevealed(false), [filon.id]);

  // keyboard: space/enter to reveal, then 1 = remembered, 2 = not
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        if (e.key === "1") onAnswer(true);
        if (e.key === "2") onAnswer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, onAnswer]);

  const overdue = daysUntilDue(filon.dueDate) < 0;

  return (
    <div className="animate-riseIn">
      <div className="mb-3 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.18em]">
        <button
          onClick={onOpenSource}
          className="max-w-[60%] truncate text-left text-gold/70 underline-offset-2 hover:text-gold hover:underline"
          title={`Source : ${filon.sourceLabel}`}
        >
          ◆ {filon.sourceLabel}
        </button>
        <span className={overdue ? "text-ember" : "text-sand/45"}>
          {boxLabel(filon.box)} · {overdue ? "en retard" : "à réviser"}
        </span>
      </div>

      <div className="relative rounded-2xl border border-gold/20 bg-gradient-to-b from-rock-700/80 to-rock-800/90 p-6 shadow-vein sm:p-8">
        {/* Prompt */}
        <div className="text-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-sand/45">
            Te souviens-tu de ce concept ?
          </div>
          <h2 className="mt-3 font-display text-[1.7rem] font-extrabold leading-tight text-sand sm:text-[2.1rem]">
            {filon.title}
          </h2>
        </div>

        {/* Reveal */}
        {!revealed ? (
          <div className="mt-7 text-center">
            <p className="mb-5 font-body text-sm italic text-sand/50">
              Essaie de te le rappeler dans ta tête… puis dévoile.
            </p>
            <button
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-display text-sm font-bold text-rock shadow-lift transition hover:bg-gold-bright active:translate-y-px"
            >
              <RotateIcon className="text-base" />
              Dévoiler
            </button>
          </div>
        ) : (
          <div className="mt-6 animate-riseIn">
            <hr className="hairline mb-5" />
            <p className="font-body text-lg leading-relaxed text-sand">{filon.explanation}</p>
            {filon.whyItMatters && (
              <p className="mt-3 border-l-2 border-copper/60 pl-3 font-body text-[0.95rem] italic leading-relaxed text-copper">
                {filon.whyItMatters}
              </p>
            )}

            {linkedTitles.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <LinkIcon className="text-sm text-azurite" />
                {linkedTitles.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-azurite/40 bg-azurite/10 px-2.5 py-0.5 font-mono text-[0.62rem] text-azurite"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                onClick={() => onAnswer(false)}
                className="group flex flex-col items-center gap-1 rounded-xl border border-oxide/50 bg-oxide/10 px-4 py-3 transition hover:border-oxide hover:bg-oxide/20 active:translate-y-px"
              >
                <span className="font-display text-base font-bold text-oxide">Pas encore</span>
                <span className="font-mono text-[0.58rem] uppercase tracking-wider text-sand/40">
                  retour à la boîte 1 · (2)
                </span>
              </button>
              <button
                onClick={() => onAnswer(true)}
                className="group flex flex-col items-center gap-1 rounded-xl border border-malachite/50 bg-malachite/10 px-4 py-3 transition hover:border-malachite hover:bg-malachite/20 active:translate-y-px"
              >
                <span className="flex items-center gap-1.5 font-display text-base font-bold text-malachite">
                  <CheckIcon className="text-sm" /> Je m'en souviens
                </span>
                <span className="font-mono text-[0.58rem] uppercase tracking-wider text-sand/40">
                  monte d'un cran · (1)
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
