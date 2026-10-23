/**
 * Thin REST client for the Whop v1 API — the stable surface documented at
 * docs.whop.com/api-reference/{checkout-configurations,memberships,payments,
 * refunds,disputes} and used by the official Quickstart/Accept
 * Payments/Sandbox guides. WHOP_API_BASE switches between production
 * (https://api.whop.com/api/v1, the default) and sandbox
 * (https://sandbox-api.whop.com/api/v1) without any code change — see the
 * delivery report for the sandbox test procedure.
 */

const DEFAULT_API_BASE = "https://api.whop.com/api/v1";

function apiBase(): string {
  return process.env.WHOP_API_BASE?.trim() || DEFAULT_API_BASE;
}

function apiKey(): string {
  const key = process.env.WHOP_API_KEY?.trim();
  if (!key) {
    throw new Error("WHOP_API_KEY is not set.");
  }
  return key;
}

export class WhopApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Whop API request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** Never logs the API key itself — only the path, method and response
 * status, same discipline as lib/stripe/server.ts's getStripe(). */
export async function whopFetch<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error(`[whop] ${init?.method ?? "GET"} ${path} failed with status ${response.status}`);
    throw new WhopApiError(response.status, json);
  }

  return json as T;
}
