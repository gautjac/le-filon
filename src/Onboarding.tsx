import { useState } from "react";
import { PickaxeIcon, LedgerIcon, VeinIcon, ArrowIcon } from "./icons";

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    icon: <PickaxeIcon className="text-3xl text-gold" />,
    title: "Mine ce que tu lis",
    body: "Colle un article, un passage, des notes — ou écris juste un sujet. Le mineur (Opus) en dégage les 3 concepts qui forment vraiment la charpente, ceux que tu n'as probablement pas encore.",
  },
  {
    icon: <LedgerIcon className="text-3xl text-gold" />,
    title: "Une dette de savoir",
    body: "Chaque concept entre au registre comme une dette. Le Filon te le ressort juste avant que tu l'oublies (1 j, 3 j, 7 j, 16 j…). Tu te le rappelles, ou pas — la dette monte ou redescend.",
  },
  {
    icon: <VeinIcon className="text-3xl text-gold" />,
    title: "La veine s'épaissit",
    body: "Plus tu rembourses, plus ta veine d'or grandit. Relie les filons entre eux, retrouve toujours le contexte d'origine, et regarde ton savoir s'ancrer pour de vrai.",
  },
];

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-rock/90 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-riseIn rounded-3xl border border-gold/25 bg-rock-800 p-7 shadow-lift sm:p-9">
        <div className="mb-1 text-center">
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-gold/70">Le Filon</div>
        </div>

        <div className="mt-6 grid h-16 place-items-center">{s.icon}</div>
        <h2 className="mt-3 text-center font-display text-2xl font-extrabold text-sand">{s.title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-center font-body leading-relaxed text-sand/70">
          {s.body}
        </p>

        {/* dots */}
        <div className="mt-7 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-gold" : "w-1.5 bg-sand/25"
              }`}
            />
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={onDone}
            className="font-mono text-[0.64rem] uppercase tracking-wider text-sand/45 transition hover:text-sand"
          >
            Passer
          </button>
          <button
            onClick={() => (last ? onDone() : setStep((n) => n + 1))}
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 font-display text-sm font-bold text-rock shadow-lift transition hover:bg-gold-bright active:translate-y-px"
          >
            {last ? "Commencer à miner" : "Suivant"}
            <ArrowIcon className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}
