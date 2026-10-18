/**
 * The 5 "emit_*" tools the Coach may call instead of (or alongside)
 * answering in plain text — each produces one typed artifact, rendered
 * by the frontend's own React components from validated JSON, NEVER as
 * HTML/JS the model wrote. `strict: true` makes the API itself reject a
 * malformed tool call before it ever reaches us, but this file's
 * `validate*` functions re-check every field by hand anyway — the same
 * "never fully trust a single guarantee" posture already used
 * everywhere else in this codebase (e.g. consume_deep_analysis_credit's
 * atomic UPDATE ... WHERE, not just a prior SELECT check).
 *
 * Tool use (not a free-text delimited block) is the deliberate choice
 * here: a tool_use content block is structurally separate from the
 * streamed "text" deltas the client renders live, so the raw JSON can
 * never leak into the visible chat stream even transiently — there is
 * no parsing/stripping step that could get it wrong.
 */

export type ArtifactType =
  | "comparison_table"
  | "report"
  | "checklist"
  | "risk_summary"
  | "surveillance_plan";

export type ComparisonTablePayload = {
  title: string;
  metric_labels: string[];
  rows: { label: string; metric_values: string[]; note: string }[];
  conclusion: string;
};

export type ReportPayload = {
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
};

export type ChecklistPayload = {
  title: string;
  items: string[];
};

export type RiskSummaryPayload = {
  title: string;
  risk_level: "Faible" | "Moyenne" | "Élevée";
  key_risks: string[];
  mitigations: string[];
};

export type SurveillancePlanPayload = {
  title: string;
  watch_items: { label: string; trigger_condition: string }[];
  review_frequency: string;
};

export type ArtifactPayload =
  | ComparisonTablePayload
  | ReportPayload
  | ChecklistPayload
  | RiskSummaryPayload
  | SurveillancePlanPayload;

const ARTIFACT_TOOL_NAME_TO_TYPE: Record<string, ArtifactType> = {
  emit_comparison_table: "comparison_table",
  emit_report: "report",
  emit_checklist: "checklist",
  emit_risk_summary: "risk_summary",
  emit_surveillance_plan: "surveillance_plan",
};

export function artifactTypeForToolName(toolName: string): ArtifactType | null {
  return ARTIFACT_TOOL_NAME_TO_TYPE[toolName] ?? null;
}

/** Anthropic tool definitions — passed in `tools` only on the Sonnet path
 * (see coach-chat/index.ts), never on the cheaper Haiku path. */
export const ARTIFACT_TOOLS = [
  {
    name: "emit_comparison_table",
    description:
      "Produit un tableau comparatif structuré — utilise ce tool quand l'utilisateur demande de comparer plusieurs marchés Polymarket, deux équipes/joueurs, plusieurs actifs/graphiques déjà analysés, ou d'anciennes prédictions face aux résultats réels. N'invente jamais une ligne pour un élément qui n'a pas été fourni dans le contexte.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titre court du comparatif." },
        metric_labels: {
          type: "array",
          items: { type: "string" },
          description: "1 à 3 noms de colonnes de métrique (ex: \"Probabilité IA\", \"Risque\", \"Confiance\").",
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Nom de l'élément comparé (marché, équipe, actif, ...)." },
              metric_values: {
                type: "array",
                items: { type: "string" },
                description: "Une valeur par colonne de metric_labels, dans le même ordre.",
              },
              note: { type: "string", description: "Courte note contextuelle sur cette ligne." },
            },
            required: ["label", "metric_values", "note"],
            additionalProperties: false,
          },
        },
        conclusion: {
          type: "string",
          description: "Conclusion conditionnelle et probabiliste — jamais un résultat garanti.",
        },
      },
      required: ["title", "metric_labels", "rows", "conclusion"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "emit_report",
    description:
      "Produit un rapport d'analyse structuré en sections — utilise ce tool pour une synthèse plus longue que ce qui tient naturellement dans une réponse de chat.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string", description: "Résumé en 2-3 phrases." },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              body: { type: "string" },
            },
            required: ["heading", "body"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "summary", "sections"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "emit_checklist",
    description:
      "Produit une checklist actionnable — utilise ce tool quand l'utilisateur demande une liste de points à vérifier avant de prendre une décision.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["title", "items"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "emit_risk_summary",
    description:
      "Produit un résumé de risque structuré — utilise ce tool quand l'utilisateur demande explicitement une évaluation des risques d'une position, d'un marché ou d'un pari.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        risk_level: { type: "string", enum: ["Faible", "Moyenne", "Élevée"] },
        key_risks: { type: "array", items: { type: "string" } },
        mitigations: { type: "array", items: { type: "string" } },
      },
      required: ["title", "risk_level", "key_risks", "mitigations"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "emit_surveillance_plan",
    description:
      "Produit un plan de surveillance structuré — utilise ce tool quand l'utilisateur demande quoi surveiller après une décision (jamais une exécution automatique, uniquement des points à suivre manuellement).",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        watch_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              trigger_condition: { type: "string" },
            },
            required: ["label", "trigger_condition"],
            additionalProperties: false,
          },
        },
        review_frequency: { type: "string", description: "Ex: \"quotidien\", \"avant chaque échéance\"." },
      },
      required: ["title", "watch_items", "review_frequency"],
      additionalProperties: false,
    },
    strict: true,
  },
] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Defensive re-validation of a tool_use input against its declared
 * shape — returns null (reject the artifact, fall back to plain text)
 * rather than ever persisting or rendering a malformed payload. */
export function validateArtifactPayload(type: ArtifactType, input: unknown): ArtifactPayload | null {
  if (typeof input !== "object" || input === null) return null;
  const obj = input as Record<string, unknown>;

  switch (type) {
    case "comparison_table": {
      if (typeof obj.title !== "string" || typeof obj.conclusion !== "string") return null;
      if (!isStringArray(obj.metric_labels) || obj.metric_labels.length === 0) return null;
      if (!Array.isArray(obj.rows)) return null;
      const rows = obj.rows.map((r): ComparisonTablePayload["rows"][number] | null => {
        if (typeof r !== "object" || r === null) return null;
        const row = r as Record<string, unknown>;
        if (typeof row.label !== "string" || typeof row.note !== "string") return null;
        if (!isStringArray(row.metric_values)) return null;
        return { label: row.label, metric_values: row.metric_values, note: row.note };
      });
      if (rows.some((r) => r === null)) return null;
      return {
        title: obj.title,
        metric_labels: obj.metric_labels,
        rows: rows as ComparisonTablePayload["rows"],
        conclusion: obj.conclusion,
      };
    }
    case "report": {
      if (typeof obj.title !== "string" || typeof obj.summary !== "string") return null;
      if (!Array.isArray(obj.sections)) return null;
      const sections = obj.sections.map((s): ReportPayload["sections"][number] | null => {
        if (typeof s !== "object" || s === null) return null;
        const section = s as Record<string, unknown>;
        if (typeof section.heading !== "string" || typeof section.body !== "string") return null;
        return { heading: section.heading, body: section.body };
      });
      if (sections.some((s) => s === null)) return null;
      return { title: obj.title, summary: obj.summary, sections: sections as ReportPayload["sections"] };
    }
    case "checklist": {
      if (typeof obj.title !== "string" || !isStringArray(obj.items)) return null;
      return { title: obj.title, items: obj.items };
    }
    case "risk_summary": {
      if (typeof obj.title !== "string") return null;
      if (obj.risk_level !== "Faible" && obj.risk_level !== "Moyenne" && obj.risk_level !== "Élevée") return null;
      if (!isStringArray(obj.key_risks) || !isStringArray(obj.mitigations)) return null;
      return {
        title: obj.title,
        risk_level: obj.risk_level,
        key_risks: obj.key_risks,
        mitigations: obj.mitigations,
      };
    }
    case "surveillance_plan": {
      if (typeof obj.title !== "string" || typeof obj.review_frequency !== "string") return null;
      if (!Array.isArray(obj.watch_items)) return null;
      const items = obj.watch_items.map((w): SurveillancePlanPayload["watch_items"][number] | null => {
        if (typeof w !== "object" || w === null) return null;
        const item = w as Record<string, unknown>;
        if (typeof item.label !== "string" || typeof item.trigger_condition !== "string") return null;
        return { label: item.label, trigger_condition: item.trigger_condition };
      });
      if (items.some((i) => i === null)) return null;
      return {
        title: obj.title,
        watch_items: items as SurveillancePlanPayload["watch_items"],
        review_frequency: obj.review_frequency,
      };
    }
    default:
      return null;
  }
}
