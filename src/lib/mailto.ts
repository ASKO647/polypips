/** No contact-form backend exists yet, so every "contact us" style form in
 * the marketing pages opens the visitor's own mail client with the fields
 * pre-filled, instead of faking a submission that goes nowhere. */
export function buildMailto(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to}?${params.toString().replace(/\+/g, "%20")}`;
}

/** Provisional contact address — swap for the real domain's mailbox once
 * the company/domain is finalized (see the [À COMPLÉTER] markers in the
 * legal pages for the same open item). */
export const CONTACT_EMAIL = "contact@polypips.app";
