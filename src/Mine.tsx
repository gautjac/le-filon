import { useState } from "react";
import { mineFilons } from "./api";
import { addMinedBatch } from "./store";
import { db } from "./db";
import type { ExtractResult, Lang } from "./types";
import { PickaxeIcon, LinkIcon, ArrowIcon } from "./icons";

interface Props {
  lang: Lang;
  onMined: (count: number) => void;
}

type Phase = "input" | "mining" | "review";

const MINING_MSGS = [
  "Le mineur descend dans la roche…",
  "Repérage des veines porteuses…",
  "Dégagement des concepts…",
  "Pesée de l'or…",
];

export default function Mine({ lang, onMined }: Props) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mine() {
    const input = text.trim();
    if (input.length < 12) {
      setError("Colle un passage ou écris un sujet — au moins quelques mots.");
      return;
    }
    setError(null);
    setPhase("mining");
    // rotate the loading messages
    const rot = setInterval(() => setMsgIdx((i) => (i + 1) % MINING_MSGS.length), 2400);
    try {
      const existing = await db.filons.toArray();
      const existingTitles = existing.filter((f) => !f.archived).map((f) => f.title);
      const res = await mineFilons(input, existingTitles, lang);
      setResult(res);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setPhase("input");
    } finally {
      clearInterval(rot);
    }
  }

  async function keep() {
    if (!result) return;
    await addMinedBatch(text.trim(), result);
    onMined(result.concepts.length);
    setText("");
    setResult(null);
    setPhase("input");
  }

  function discard() {
    setResult(null);
    setPhase("input");
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {phase !== "review" && (
        <>
          <div className="mb-5 text-center">
            <h1 className="font-display text-3xl font-extrabold text-sand sm:text-4xl">
              Mine un filon
            </h1>
            <p className="mx-auto mt-2 max-w-md font-body text-[0.98rem] leading-relaxed text-sand/60">
              Colle ce que tu viens de lire — un article, un passage, des notes, une
              transcription — ou écris simplement un sujet. Le mineur en dégage les{" "}
              <span className="text-gold">3 concepts</span> qui comptent vraiment.
            </p>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={phase === "mining"}
              placeholder="Colle ton texte ici, ou écris un sujet à explorer (ex. « la théorie des jeux », « comment fonctionne un transformateur électrique »)…"
              rows={9}
              className="w-full resize-y rounded-2xl border border-gold/20 bg-rock-800/70 p-5 font-body text-[1.02rem] leading-relaxed text-sand placeholder:text-sand/35 shadow-seam outline-none transition focus:border-gold/50 disabled:opacity-60"
            />
            <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-[0.62rem] text-sand/35 tnum">
              {wordCount} mots
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 font-body text-sm text-ember">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-center">
            {phase === "mining" ? (
              <div className="flex items-center gap-3 font-body text-sand/70">
                <PickaxeIcon className="animate-glint text-xl text-gold" />
                <span className="text-sm italic">{MINING_MSGS[msgIdx]}</span>
              </div>
            ) : (
              <button
                onClick={mine}
                className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-3.5 font-display text-base font-bold text-rock shadow-lift transition hover:bg-gold-bright active:translate-y-px"
              >
                <PickaxeIcon className="text-lg" />
                Extraire les filons
              </button>
            )}
          </div>
        </>
      )}

      {phase === "review" && result && (
        <div className="animate-riseIn">
          <div className="mb-5 text-center">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-gold/70">
              {result.kind === "topic" ? "Sujet exploré" : "Source minée"}
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-sand sm:text-3xl">
              {result.sourceLabel}
            </h1>
            <p className="mt-2 font-body text-sm text-sand/55">
              Voici les 3 filons dégagés. Garde-les pour les entrer dans ton registre.
            </p>
          </div>

          <div className="space-y-4">
            {result.concepts.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gold/20 bg-rock-800/70 p-5 shadow-seam"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 font-mono text-sm font-bold text-gold tnum">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold text-sand">{c.title}</h3>
                    <p className="mt-1.5 font-body leading-relaxed text-sand/85">{c.explanation}</p>
                    <p className="mt-2 border-l-2 border-copper/60 pl-3 font-body text-sm italic text-copper">
                      {c.whyItMatters}
                    </p>
                    {c.linkTitles.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <LinkIcon className="text-sm text-azurite" />
                        {c.linkTitles.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-azurite/40 bg-azurite/10 px-2.5 py-0.5 font-mono text-[0.6rem] text-azurite"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={discard}
              className="rounded-full border border-sand/25 px-5 py-2.5 font-display text-sm font-semibold text-sand/70 transition hover:border-sand/50 hover:text-sand"
            >
              Jeter
            </button>
            <button
              onClick={keep}
              className="inline-flex items-center gap-2 rounded-full bg-malachite px-7 py-3 font-display text-sm font-bold text-rock shadow-lift transition hover:brightness-110 active:translate-y-px"
            >
              Entrer au registre
              <ArrowIcon className="text-base" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
