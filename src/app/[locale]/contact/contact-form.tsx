"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { CONTACT_EMAIL, buildMailto } from "@/lib/mailto";

/** No contact-form backend exists yet — submitting opens the visitor's own
 * mail client with everything pre-filled, rather than faking a submission
 * that would silently go nowhere. */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = name.trim() && email.trim() && subject.trim() && message.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const body = `${message}\n\n—\n${name}\n${email}`;
    window.location.href = buildMailto(CONTACT_EMAIL, subject, body);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-[24px] border border-border bg-surface p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-name" className="text-sm font-semibold text-ink">
            Nom
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-body-soft focus:border-brand-400 focus:outline-none"
            placeholder="Votre nom"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-body-soft focus:border-brand-400 focus:outline-none"
            placeholder="vous@exemple.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-subject" className="text-sm font-semibold text-ink">
          Sujet
        </label>
        <input
          id="contact-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-body-soft focus:border-brand-400 focus:outline-none"
          placeholder="Objet de votre message"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-sm font-semibold text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-body-soft focus:border-brand-400 focus:outline-none"
          placeholder="Votre message"
        />
      </div>

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full sm:w-auto">
        Envoyer <ButtonIcon><Send className="h-4 w-4" /></ButtonIcon>
      </Button>

      <p className="flex items-center gap-1.5 text-xs text-body-soft">
        <Mail className="h-3.5 w-3.5" /> Ouvre votre client email avec le message pré-rempli, à
        destination de {CONTACT_EMAIL}.
      </p>
    </form>
  );
}
