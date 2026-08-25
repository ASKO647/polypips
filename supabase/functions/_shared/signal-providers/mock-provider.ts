import type { RawSignalTrade, RawSignalWallet, SignalProvider, SignalSource } from "./types.ts";

/**
 * The ONLY provider actually used until a real Fomo/Axiom/on-chain
 * integration exists (see fomo-provider.ts / axiom-provider.ts /
 * blockchain-provider.ts for why: no documented public/commercial API for
 * either terminal today). Every wallet and trade this produces is clearly
 * demonstration data — the caller (sync-signal-wallets) always persists it
 * with data_source_mode='mock', and the frontend always shows a "données
 * de démonstration" banner for it. This must never be used to backfill
 * anything presented as real trading history.
 *
 * Deterministic per address (mulberry32 seeded from a hash of the
 * address) so re-running a sync doesn't reshuffle a wallet's fundamentals
 * every time — only fetchNewTrades() advances state (one new trade per
 * call per wallet, most of the time), simulating "a wallet just traded"
 * for the Copy Trading pipeline to react to.
 */

const MOCK_LABELS = [
  "DegenWhale.sol",
  "SolSniper42",
  "MemeAlpha",
  "PumpHunter",
  "EarlyBuyerX",
  "TokenScout",
  "ChainSurfer",
  "RugRadar",
  "MoonChaser",
  "AlphaLeak",
];

const MOCK_TOKENS = ["$WOJAK", "$PEPE2", "$BONK", "$FLOKI3", "$SOLDOG", "$NYAN", "$TURBO", "$GIGA"];

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return h;
}

function mockAddress(source: SignalSource, index: number): string {
  const base58 =
    "1qXn3v9jK7mP5tR8yZbGhCwLdFsAeUoVnMkQpXrYzWbTcNjHgFdSaLpMxKvBnRmQ";
  const chars: string[] = [];
  const rand = mulberry32(hashSeed(`${source}-${index}`));
  for (let i = 0; i < 40; i++) {
    chars.push(base58[Math.floor(rand() * base58.length)]);
  }
  return chars.join("");
}

function buildWallet(source: SignalSource, index: number): RawSignalWallet {
  const address = mockAddress(source, index);
  const rand = mulberry32(hashSeed(address));
  const winRate = Math.round((35 + rand() * 60) * 10) / 10;
  const tradesCount = Math.floor(20 + rand() * 480);
  const risk: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

  return {
    address,
    chain: "solana",
    source,
    label: `${MOCK_LABELS[index % MOCK_LABELS.length]}${index >= MOCK_LABELS.length ? index : ""}`,
    winRate,
    pnl24h: Math.round((rand() - 0.4) * 8000 * 100) / 100,
    pnl7d: Math.round((rand() - 0.35) * 30000 * 100) / 100,
    pnl30d: Math.round((rand() - 0.3) * 90000 * 100) / 100,
    tradesCount,
    riskLevel: risk[Math.floor(rand() * risk.length)],
    avgHoldTimeMinutes: Math.floor(10 + rand() * 600),
    drawdownPercent: Math.round(rand() * 45 * 10) / 10,
    tags: winRate >= 70 ? ["Régulier"] : winRate < 45 ? ["Volatil"] : [],
    positions: rand() > 0.5
      ? [
          {
            tokenSymbol: MOCK_TOKENS[Math.floor(rand() * MOCK_TOKENS.length)],
            side: "BUY",
            amountUsd: Math.round(rand() * 4000),
            pnl: Math.round((rand() - 0.4) * 1500),
          },
        ]
      : [],
  };
}

export class MockSignalProvider implements SignalProvider {
  readonly mode = "mock" as const;

  async fetchWallets(source: SignalSource): Promise<RawSignalWallet[]> {
    const count = 14;
    return Array.from({ length: count }, (_, i) => buildWallet(source, i));
  }

  async fetchNewTrades(source: SignalSource, walletAddresses: string[]): Promise<RawSignalTrade[]> {
    // Simulates "a followed wallet just traded" — one pseudo-random trade
    // per wallet, time-boxed so re-running the sync a minute later doesn't
    // replay the exact same tx_hash (the caller's (wallet_id, tx_hash)
    // unique constraint would silently drop it if it did).
    const nowBucket = Math.floor(Date.now() / (60 * 1000));
    const trades: RawSignalTrade[] = [];

    for (const address of walletAddresses) {
      const rand = mulberry32(hashSeed(`${address}-${nowBucket}`));
      if (rand() > 0.6) continue; // not every wallet trades every sync tick

      const side: "BUY" | "SELL" = rand() > 0.5 ? "BUY" : "SELL";
      const amountUsd = Math.round((200 + rand() * 40000) * 100) / 100;
      trades.push({
        walletAddress: address,
        tokenSymbol: MOCK_TOKENS[Math.floor(rand() * MOCK_TOKENS.length)],
        tokenAddress: null,
        side,
        amountUsd,
        price: Math.round(rand() * 0.05 * 1_000_000) / 1_000_000,
        marketCap: Math.round(rand() * 8_000_000),
        liquidity: Math.round(rand() * 900_000),
        volume24h: Math.round(rand() * 2_500_000),
        pnl: side === "SELL" ? Math.round((rand() - 0.4) * amountUsd) : null,
        txHash: `mock_${source}_${address.slice(0, 8)}_${nowBucket}`,
        tradedAt: new Date().toISOString(),
      });
    }

    return trades;
  }
}
