/**
 * Shared "Analyse Approfondie" depth toggle for the frontend — mirrors the
 * AnalysisDepth type declared independently in each of the 3 analyze-*
 * Edge Functions (Deno can't import from src/, so those stay their own
 * copies; this is the one Next.js–side definition, imported by every
 * universe's input/flow components instead of each redeclaring it).
 */
export type AnalysisDepth = "standard" | "deep";
