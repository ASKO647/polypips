import { AxiomSignalProvider } from "./axiom-provider.ts";
import { FomoSignalProvider } from "./fomo-provider.ts";
import { MockSignalProvider } from "./mock-provider.ts";
import type { SignalProvider, SignalSource } from "./types.ts";

/**
 * Single selection point for which Smart Wallets data source actually
 * runs. Defaults to the Mock provider for every source — set
 * SIGNAL_DATA_MODE=live (Edge Function Secrets) to switch, but note that
 * doing so today just swaps in FomoSignalProvider/AxiomSignalProvider,
 * which both throw ProviderNotImplementedError until one of them is
 * actually wired to a real API. Nothing else in this codebase should
 * import MockSignalProvider/FomoSignalProvider/AxiomSignalProvider
 * directly — always go through this function so the "which source is
 * live" decision stays in one place.
 */
export function getSignalProvider(source: SignalSource): SignalProvider {
  const mode = Deno.env.get("SIGNAL_DATA_MODE") === "live" ? "live" : "mock";
  if (mode === "mock") return new MockSignalProvider();
  return source === "fomo" ? new FomoSignalProvider() : new AxiomSignalProvider();
}

export { ProviderNotImplementedError } from "./types.ts";
export type { RawSignalTrade, RawSignalWallet, SignalProvider, SignalSource } from "./types.ts";
