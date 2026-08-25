import { ProviderNotImplementedError, type RawSignalTrade, type RawSignalWallet, type SignalProvider, type SignalSource } from "./types.ts";

/**
 * Not implemented — same situation as fomo-provider.ts: axiom.trade does
 * not publish a documented public or commercial API for wallet/trade data.
 * No scraping, no bypassing its protections. If Axiom ever publishes an
 * official API, implement it here (key as AXIOM_API_KEY in Edge Function
 * Secrets) and getSignalProvider() picks it up automatically once
 * SIGNAL_DATA_MODE=live is set — see index.ts.
 */
export class AxiomSignalProvider implements SignalProvider {
  readonly mode = "live" as const;

  async fetchWallets(_source: SignalSource): Promise<RawSignalWallet[]> {
    throw new ProviderNotImplementedError(
      "Aucune API publique/officielle Axiom n'est disponible — voir le commentaire de ce fichier."
    );
  }

  async fetchNewTrades(_source: SignalSource, _walletAddresses: string[]): Promise<RawSignalTrade[]> {
    throw new ProviderNotImplementedError(
      "Aucune API publique/officielle Axiom n'est disponible — voir le commentaire de ce fichier."
    );
  }
}
