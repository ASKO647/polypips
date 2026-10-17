export type Scenario = { stake: number; opportunities: number; yieldRate: number };
export type Parameter = keyof Scenario;
export const DEFAULT_SCENARIO: Scenario = { stake: 50, opportunities: 80, yieldRate: 5 };
export const LIMITS = {
  stake: { min: 10, max: 500, step: 0.01 },
  opportunities: { min: 10, max: 500, step: 1 },
  yieldRate: { min: -20, max: 20, step: 0.1 },
} as const;

export function parseNumericInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function normalizeParameter(parameter: Parameter, value: number): number {
  const { min, max, step } = LIMITS[parameter];
  if (!Number.isFinite(value)) return DEFAULT_SCENARIO[parameter];
  return Number((Math.round(Math.min(max, Math.max(min, value)) / step) * step).toFixed(2));
}

export function calculateScenario(scenario: Scenario) {
  const total = Math.round(scenario.stake * scenario.opportunities * 100) / 100;
  const profit = Math.round(total * scenario.yieldRate) / 100;
  return { total, profit: Object.is(profit, -0) ? 0 : profit };
}

function niceCeiling(value: number) {
  const power = 10 ** Math.floor(Math.log10(value));
  const scaled = value / power;
  return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10) * power;
}

/** Includes zero for both gains and losses. Empty scenarios retain a readable axis. */
export function chartBounds(profit: number): [number, number] {
  if (profit === 0) return [-10, 10];
  const extent = niceCeiling(Math.abs(profit) * 1.2);
  return profit > 0 ? [0, extent] : [-extent, 0];
}

export function chartGeometry(profit: number, min: number, max: number) {
  const x = [58, 226, 394, 562];
  const y = (value: number) => 178 - (value - min) / (max - min) * 148;
  const points = x.map((left, index) => [left, y(profit * index / 3)] as const);
  const line = points.map(([left, top], index) => `${index ? "L" : "M"}${left.toFixed(3)},${top.toFixed(3)}`).join(" ");
  const zero = y(0);
  return { points, line, area: `${line} L562,${zero.toFixed(3)} L58,${zero.toFixed(3)} Z`, zero, ticks: [max, max * 0.75 + min * 0.25, (max + min) / 2, max * 0.25 + min * 0.75, min] };
}
