import type { Context } from "@netlify/functions";
import { extractFilons, type Lang } from "./lib/mineur.ts";

interface Body {
  input?: string;
  existingTitles?: string[];
  lang?: Lang;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const lang: Lang = body.lang === "en" ? "en" : "fr";
  const input = (body.input ?? "").trim();
  const existingTitles = Array.isArray(body.existingTitles)
    ? body.existingTitles.map((t) => String(t)).slice(0, 120)
    : [];

  if (input.length < 12) {
    return json(
      {
        error:
          lang === "en"
            ? "Paste a passage or type a topic (a few words at least)."
            : "Collez un passage ou écrivez un sujet (au moins quelques mots).",
      },
      400,
    );
  }

  // Cap the input so a giant paste doesn't blow the context / latency.
  const capped = input.length > 14000 ? input.slice(0, 14000) : input;

  // The Opus extraction can run ~25–55s, beyond Netlify's sync idle timeout.
  // Stream NDJSON: a bare-newline heartbeat every 3s keeps the connection alive,
  // then a final {result|error} line carries the payload. The client reads to
  // end-of-stream and parses the last non-empty JSON line.
  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let done = false;
      const beat = setInterval(() => {
        if (!done) {
          try {
            controller.enqueue(enc.encode("\n"));
          } catch {
            /* closed */
          }
        }
      }, 3000);

      try {
        const result = await extractFilons(capped, existingTitles, lang);
        done = true;
        clearInterval(beat);
        controller.enqueue(enc.encode(JSON.stringify({ result }) + "\n"));
      } catch (err) {
        done = true;
        clearInterval(beat);
        const message =
          err instanceof Error ? err.message : lang === "en" ? "Unknown error" : "Erreur inconnue";
        controller.enqueue(enc.encode(JSON.stringify({ error: message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
};
