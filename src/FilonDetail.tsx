import { useState } from "react";
import type { Filon, Source } from "./types";
import { boxLabel, daysUntilDue, MASTERY_BOX } from "./srs";
import { toggleLink, setArchived, deleteFilon } from "./store";
import { CloseIcon, LinkIcon } from "./icons";

interface Props {
  filon: Filon;
  source: Source | undefined;
  allFilons: Filon[];
  onClose: () => void;
  onChanged: () => void;
}

export default function FilonDetail({ filon, source, allFilons, onClose, onChanged }: Props) {
  const [linking, setLinking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const linked = allFilons.filter((f) => filon.links.includes(f.id));
  const linkable = allFilons.filter((f) => f.id !== filon.id && !filon.links.includes(f.id) && !f.archived);

  const due = daysUntilDue(filon.dueDate);
  const dueLabel =
    due < 0 ? `en retard de ${-due} j` : due === 0 ? "dû aujourd'hui" : `dans ${due} j`;

  async function handleToggle(id: string) {
    await toggleLink(filon.id, id);
    onChanged();
  }
  async function handleArchive() {
    await setArchived(filon.id, !filon.archived);
    onChanged();
    onClose();
  }
  async function handleDelete() {
    await deleteFilon(filon.id);
    onChanged();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-rock/80 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg animate-riseIn rounded-2xl border border-gold/25 bg-rock-800 p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-sand/50 transition hover:bg-rock-600 hover:text-sand"
          aria-label="Fermer"
        >
          <CloseIcon className="text-lg" />
        </button>

        <div className="mb-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-gold/70">
          ◆ {filon.sourceLabel}
        </div>
        <h2 className="pr-8 font-display text-2xl font-extrabold leading-tight text-sand">
          {filon.title}
        </h2>

        {/* status chips */}
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[0.6rem] uppercase tracking-wider">
          <span className={`rounded-full border px-2.5 py-0.5 ${filon.mastered ? "border-malachite/50 bg-malachite/10 text-malachite" : "border-gold/40 bg-gold/10 text-gold"}`}>
            {boxLabel(filon.box)} · boîte {filon.box}/{MASTERY_BOX}
          </span>
          {!filon.mastered && (
            <span className={`rounded-full border px-2.5 py-0.5 ${due < 0 ? "border-ember/50 bg-ember/10 text-ember" : "border-sand/25 text-sand/55"}`}>
              {dueLabel}
            </span>
          )}
          <span className="rounded-full border border-sand/20 px-2.5 py-0.5 text-sand/50">
            {filon.recalls}/{filon.reviews} rappels
          </span>
        </div>

        <p className="mt-4 font-body text-[1.05rem] leading-relaxed text-sand">{filon.explanation}</p>
        {filon.whyItMatters && (
          <p className="mt-3 border-l-2 border-copper/60 pl-3 font-body italic leading-relaxed text-copper">
            {filon.whyItMatters}
          </p>
        )}

        {/* origin context */}
        {(filon.sourceSnippet || source) && (
          <div className="mt-5 rounded-xl border border-rock-500/60 bg-rock-700/60 p-4">
            <div className="mb-1.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-sand/45">
              Retour au contexte
            </div>
            {filon.sourceSnippet && (
              <p className="font-body text-sm italic leading-relaxed text-sand/75">
                « {filon.sourceSnippet} »
              </p>
            )}
            {source && source.text && source.text !== filon.sourceSnippet && (
              <details className="mt-2">
                <summary className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-wide text-gold/70 hover:text-gold">
                  Voir la source complète
                </summary>
                <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-body text-[0.82rem] leading-relaxed text-sand/55">
                  {source.text}
                </p>
              </details>
            )}
          </div>
        )}

        {/* links */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-azurite">
              <LinkIcon className="text-sm" /> Filons liés
            </span>
            {linkable.length > 0 && (
              <button
                onClick={() => setLinking((v) => !v)}
                className="font-mono text-[0.6rem] uppercase tracking-wide text-sand/50 underline-offset-2 hover:text-gold hover:underline"
              >
                {linking ? "fermer" : "+ relier"}
              </button>
            )}
          </div>

          {linked.length === 0 && !linking && (
            <p className="font-body text-sm italic text-sand/40">Aucun lien pour l'instant.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {linked.map((f) => (
              <button
                key={f.id}
                onClick={() => handleToggle(f.id)}
                title="Cliquer pour délier"
                className="group rounded-full border border-azurite/45 bg-azurite/10 px-3 py-1 font-body text-[0.8rem] text-azurite transition hover:border-ember/60 hover:bg-ember/10 hover:text-ember"
              >
                {f.title}
                <span className="ml-1 opacity-0 transition group-hover:opacity-100">×</span>
              </button>
            ))}
          </div>

          {linking && (
            <div className="mt-3 max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-rock-500/60 bg-rock-700/50 p-2">
              {linkable.length === 0 ? (
                <p className="px-2 py-1 font-body text-sm italic text-sand/40">Rien d'autre à relier.</p>
              ) : (
                linkable.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleToggle(f.id)}
                    className="block w-full truncate rounded-lg px-3 py-1.5 text-left font-body text-sm text-sand/75 transition hover:bg-azurite/15 hover:text-azurite"
                  >
                    + {f.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-6 flex items-center justify-between border-t border-rock-500/50 pt-4">
          <button
            onClick={handleArchive}
            className="font-mono text-[0.62rem] uppercase tracking-wider text-sand/50 transition hover:text-sand"
          >
            {filon.archived ? "Désarchiver" : "Archiver"}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-ember">Supprimer pour de bon ?</span>
              <button onClick={handleDelete} className="rounded-full bg-ember px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-rock">
                Oui
              </button>
              <button onClick={() => setConfirmDelete(false)} className="font-mono text-[0.6rem] uppercase tracking-wider text-sand/50">
                non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="font-mono text-[0.62rem] uppercase tracking-wider text-oxide/80 transition hover:text-ember"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
