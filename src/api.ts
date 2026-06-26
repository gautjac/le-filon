import type { ExtractResult, Lang } from "./types";

/**
 * The mineur streams NDJSON: keepalive heartbeats (bare newlines) keep the
 * connection alive during the ~25–55s Opus call, then a final JSON line carries
 * { result } or { error }. We read the stream to its end and parse the last
 * non-empty line.
 */
export async function mineFilons(
  input: string,
  existingTitles: string[],
  lang: Lang,
): Promise<ExtractResult> {
  const en = lang === "en";
  const res = await fetch("/api/filon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, existingTitles, lang }),
  });

  const raw = await res.text();
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const last = lines[lines.length - 1] ?? "";

  let parsed: { result?: ExtractResult; error?: string } | null = null;
  try {
    parsed = last ? JSON.parse(last) : null;
  } catch {
    parsed = null;
  }

  const invalid = en ? "Invalid response from the server." : "Réponse invalide du serveur.";

  if (!res.ok) {
    const fallback = en ? `Error ${res.status}` : `Erreur ${res.status}`;
    const msg = parsed && parsed.error ? parsed.error : fallback;
    throw new Error(msg);
  }
  if (!parsed) throw new Error(invalid);
  if (parsed.error) throw new Error(parsed.error);
  if (parsed.result) return parsed.result;
  throw new Error(invalid);
}
