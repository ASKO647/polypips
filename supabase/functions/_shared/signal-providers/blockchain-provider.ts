import { ProviderNotImplementedError, type RawSignalTrade, type RawSignalWallet, type SignalProvider, type SignalSource } from "./types.ts";

/**
 * Not implemented — the fallback path when Fomo/Axiom themselves stay
 * unavailable: read wallet activity directly from an authorized Solana
 * data source instead (e.g. a paid indexer API like Helius or Birdeye,
 * or a self-hosted RPC + program-log parser for known DEX programs).
 * Fomo/Axiom would then be used only as the *discovery* signal (which
 * addresses to watch), with actual trade data read from this officially
 * licensed source — exactly the "Fomo et Axiom doivent être considérés
 * comme des sources de données/signaux, pas comme des dépendances
 * absolues" requirement from the brief.
 *
 * Needs an indexer API key (e.g. HELIUS_API_KEY) in Edge Function
 * Secrets before this can be implemented — not available today.
 */
export class BlockchainSignalProvider implements SignalProvider {
  readonly mode = "live" as const;

  async fetchWallets(_source: SignalSource): Promise<RawSignalWallet[]> {
    throw new ProviderNotImplementedError(
      "Aucune source blockchain/indexeur autorisée n'est configurée — voir le commentaire de ce fichier."
    );
  }

  async fetchNewTrades(_source: SignalSource, _walletAddresses: string[]): Promise<RawSignalTrade[]> {
    throw new ProviderNotImplementedError(
      "Aucune source blockchain/indexeur autorisée n'est configurée — voir le commentaire de ce fichier."
    );
  }
}
