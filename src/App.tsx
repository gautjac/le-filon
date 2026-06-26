import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Filon, Lang } from "./types";
import { isDue } from "./srs";
import Ledger from "./Ledger";
import Mine from "./Mine";
import Library from "./Library";
import Onboarding from "./Onboarding";
import { PickaxeIcon, LedgerIcon, SearchIcon, LampIcon } from "./icons";

type View = "ledger" | "mine" | "library";

const ONBOARD_KEY = "le-filon:onboarded";
const LANG_KEY = "le-filon:lang";

export default function App() {
  const [view, setView] = useState<View>("ledger");
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARD_KEY) === "1");
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || "fr");
  const [toast, setToast] = useState<string | null>(null);

  const filons = useLiveQuery(() => db.filons.toArray(), [], [] as Filon[]);
  const dueCount = useMemo(
    () => (filons ?? []).filter((f) => !f.archived && !f.mastered && isDue(f.dueDate)).length,
    [filons],
  );

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function finishOnboarding() {
    localStorage.setItem(ONBOARD_KEY, "1");
    setOnboarded(true);
  }

  function handleMined(count: number) {
    setToast(`${count} filon${count > 1 ? "s entrés" : " entré"} au registre.`);
    setView("ledger");
  }

  const nav: { key: View; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "ledger", label: "Registre", icon: <LedgerIcon />, badge: dueCount },
    { key: "mine", label: "Miner", icon: <PickaxeIcon /> },
    { key: "library", label: "Tous les filons", icon: <SearchIcon /> },
  ];

  return (
    <div className="flex min-h-full flex-col">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-rock/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setView("ledger")}
            className="group flex items-center gap-2.5"
            aria-label="Le Filon — accueil"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-gold-deep to-copper text-rock shadow-vein">
              <LampIcon className="text-lg" />
            </span>
            <span className="text-left leading-none">
              <span className="block font-display text-lg font-extrabold tracking-tight text-sand">
                Le Filon
              </span>
              <span className="block font-mono text-[0.54rem] uppercase tracking-[0.22em] text-gold/60">
                registre des dettes de savoir
              </span>
            </span>
          </button>

          <button
            onClick={() => setLang((l) => (l === "fr" ? "en" : "fr"))}
            className="rounded-full border border-sand/20 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider text-sand/55 transition hover:border-gold/40 hover:text-gold"
            title="Langue des explications générées"
          >
            {lang === "fr" ? "FR" : "EN"}
          </button>
        </div>
      </header>

      {/* main */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-7 sm:pt-10">
        {view === "ledger" && <Ledger onGoMine={() => setView("mine")} />}
        {view === "mine" && <Mine lang={lang} onMined={handleMined} />}
        {view === "library" && <Library />}
      </main>

      {/* bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/15 bg-rock/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-1.5">
          {nav.map((n) => {
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition ${
                  active ? "text-gold" : "text-sand/55 hover:text-sand"
                }`}
              >
                <span className="relative text-xl">
                  {n.icon}
                  {!!n.badge && n.badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-ember px-1 font-mono text-[0.55rem] font-bold text-rock tnum">
                      {n.badge}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[0.56rem] uppercase tracking-wider">{n.label}</span>
                {active && (
                  <span className="absolute -top-px h-0.5 w-8 rounded-full bg-gold" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-riseIn rounded-full border border-malachite/40 bg-rock-800 px-5 py-2.5 font-body text-sm text-malachite shadow-lift">
          {toast}
        </div>
      )}

      {!onboarded && <Onboarding onDone={finishOnboarding} />}
    </div>
  );
}
