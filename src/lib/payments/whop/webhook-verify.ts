import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Whop webhooks follow the Standard Webhooks spec (confirmed:
 * docs.whop.com/developer/guides/webhooks — "webhook-id", "webhook-
 * timestamp" and "webhook-signature" headers, HMAC-SHA256 over
 * "${id}.${timestamp}.${rawBody}" using the ws_... secret as-is, base64
 * output). Implemented by hand rather than via the @whop/sdk package: the
 * SDK's exact current helper name/behavior could not be confirmed from
 * this environment (docs.whop.com itself is unreachable here — see the
 * delivery report), while the Standard Webhooks spec this follows
 * (https://www.standardwebhooks.com/) is itself stable and public. Swap
 * to the official SDK helper once it's been verified against the
 * installed @whop/sdk version, if preferred.
 *
 * The 5-minute replay tolerance is the one number this file could NOT
 * confirm against Whop's own docs (not found in the pages retrieved) —
 * it's the Standard Webhooks spec's own suggested default, applied here
 * per the task's explicit instruction. Flagged in the delivery report.
 */

const TOLERANCE_SECONDS = 5 * 60;

export type WhopWebhookHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export function extractWhopWebhookHeaders(headers: Headers): WhopWebhookHeaders {
  return {
    id: headers.get("webhook-id"),
    timestamp: headers.get("webhook-timestamp"),
    signature: headers.get("webhook-signature"),
  };
}

/**
 * Verifies a Whop webhook delivery against WHOP_WEBHOOK_SECRET. Returns
 * false for anything that doesn't check out (missing headers, stale
 * timestamp, no matching signature) — the caller must respond 400 and do
 * nothing else. `rawBody` must be the exact, unparsed request bytes: the
 * signature is computed over the raw string, so parsing to JSON first and
 * re-serializing would silently break every delivery.
 */
export function verifyWhopWebhookSignature(
  rawBody: string,
  headers: WhopWebhookHeaders,
  secret: string
): boolean {
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return false;
  }

  const timestampSeconds = Number(headers.timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const nowSeconds = Date.now() / 1000;
  if (Math.abs(nowSeconds - timestampSeconds) > TOLERANCE_SECONDS) {
    return false;
  }

  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret).update(signedContent).digest("base64");
  const expectedBuffer = Buffer.from(expectedSignature);

  // webhook-signature can carry multiple space-separated "v1,<base64>"
  // entries (e.g. during a secret rotation) — any one matching is enough.
  const candidates = headers.signature.split(" ");
  for (const candidate of candidates) {
    const [, value] = candidate.split(",");
    if (!value) continue;
    const candidateBuffer = Buffer.from(value);
    if (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    ) {
      return true;
    }
  }
  return false;
}
