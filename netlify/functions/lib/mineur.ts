import Anthropic from "@anthropic-ai/sdk";

export type Lang = "fr" | "en";

const MODEL = "claude-opus-4-8";

function client(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

export interface ExtractedConcept {
  title: string;
  explanation: string;
  whyItMatters: string;
  sourceSnippet: string;
  linkTitles: string[];
}

export interface ExtractResult {
  sourceLabel: string;
  kind: "paste" | "topic";
  concepts: ExtractedConcept[];
}

const VOICE = `Tu es le mineur du Filon — un outil qui aide une personne à VRAIMENT retenir ce qu'elle lit ou explore. Ton métier : lire un texte (ou un sujet) et en dégager les quelques concepts qui comptent vraiment, ceux qui forment la « charpente » de la compréhension. Tu écris dans un français québécois clair, vivant et précis — jamais ampoulé, jamais traduit de l'anglais. Tu expliques comme un bon prof : une idée à la fois, concrète, sans jargon inutile, mais sans simplifier au point de fausser. Tu détestes le remplissage et l'évidence. Tu ne flattes pas.`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "deposer_filons",
  description:
    "Déposer dans le registre les concepts essentiels extraits de la source : un court label de source, et exactement 3 concepts (les plus importants que la personne ne maîtrise probablement PAS encore).",
  input_schema: {
    type: "object",
    required: ["sourceLabel", "kind", "concepts"],
    properties: {
      sourceLabel: {
        type: "string",
        description:
          "Un titre court (2 à 6 mots) en français qui nomme la source ou le sujet. Ex. « Article sur les marées », « La fermentation lactique ».",
      },
      kind: {
        type: "string",
        enum: ["paste", "topic"],
        description:
          "« paste » si l'entrée est un texte/passage à lire ; « topic » si c'est un simple sujet ou une question à explorer.",
      },
      concepts: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        description:
          "EXACTEMENT 3 concepts. Choisis les plus importants ET les plus probablement nouveaux pour la personne — pas l'évidence, pas le détail anecdotique. Le cœur de ce qu'il faut retenir.",
        items: {
          type: "object",
          required: ["title", "explanation", "whyItMatters", "sourceSnippet", "linkTitles"],
          properties: {
            title: {
              type: "string",
              description: "Le nom du concept, court et net (2 à 6 mots). C'est ce que la personne tentera de se rappeler.",
            },
            explanation: {
              type: "string",
              description:
                "Explication claire en 1 à 2 phrases, en français québécois simple. Assez précise pour être utile, assez courte pour tenir en tête.",
            },
            whyItMatters: {
              type: "string",
              description:
                "Pourquoi ça compte / à quoi ça se rattache : 1 phrase qui ancre le concept dans un usage, une conséquence ou un lien plus large.",
            },
            sourceSnippet: {
              type: "string",
              description:
                "Une phrase (≤ 200 caractères) tirée ou paraphrasée de la source qui illustre ce concept, pour pouvoir y revenir. Si la source est un simple sujet, écris une phrase d'ancrage représentative.",
            },
            linkTitles: {
              type: "array",
              items: { type: "string" },
              description:
                "Parmi les FILONS EXISTANTS fournis (s'il y en a), les titres EXACTS de ceux auxquels ce concept se rattache vraiment. Tableau vide si aucun lien franc. N'invente jamais de titre.",
            },
          },
        },
      },
    },
  },
};

export async function extractFilons(
  input: string,
  existingTitles: string[],
  lang: Lang,
): Promise<ExtractResult> {
  const langLine =
    lang === "en"
      ? "Write the labels, explanations and rationale in clear English (the user prefers English)."
      : "Écris les labels, explications et raisons en français québécois clair.";

  const existingBlock =
    existingTitles.length > 0
      ? `FILONS DÉJÀ DANS LE REGISTRE (pour proposer des liens — n'utilise QUE ces titres exacts dans linkTitles) :\n${existingTitles
          .map((t) => `- ${t}`)
          .join("\n")}`
      : "FILONS DÉJÀ DANS LE REGISTRE : (aucun pour l'instant — laisse linkTitles vide.)";

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 2200,
    system: VOICE,
    messages: [
      {
        role: "user",
        content: [
          "Voici ce que la personne vient de lire ou de te soumettre. Dégage-en EXACTEMENT 3 concepts essentiels — ceux qui forment la charpente, ceux qu'elle ne maîtrise probablement pas encore. Évite l'évidence et l'anecdote.",
          langLine,
          "",
          existingBlock,
          "",
          "─── SOURCE ───",
          input,
          "─── FIN ───",
          "",
          "Réponds uniquement en appelant deposer_filons.",
        ].join("\n"),
      },
    ],
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "deposer_filons" },
  });

  const tool = res.content.find((b) => b.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("Aucun filon extrait");
  const i = tool.input as Record<string, unknown>;

  const rawConcepts = Array.isArray(i.concepts) ? (i.concepts as Record<string, unknown>[]) : [];
  const validTitleSet = new Set(existingTitles);
  const concepts: ExtractedConcept[] = rawConcepts.slice(0, 3).map((c) => {
    const links = Array.isArray(c.linkTitles) ? (c.linkTitles as unknown[]) : [];
    return {
      title: String(c.title ?? "Sans titre").trim(),
      explanation: String(c.explanation ?? "").trim(),
      whyItMatters: String(c.whyItMatters ?? "").trim(),
      sourceSnippet: String(c.sourceSnippet ?? "").trim(),
      // keep only links that actually match an existing filon title
      linkTitles: links.map((x) => String(x).trim()).filter((t) => validTitleSet.has(t)),
    };
  });

  return {
    sourceLabel: String(i.sourceLabel ?? (lang === "en" ? "Source" : "Source")).trim(),
    kind: i.kind === "topic" ? "topic" : "paste",
    concepts,
  };
}
