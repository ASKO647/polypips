# Polypips

Plateforme d'intelligence et d'analyse pour les prediction markets (V1 orientée Polymarket).

**Phase 1 (en cours) :** landing page + page de création de compte uniquement. Le dashboard, le
backend, les intégrations Polymarket et les paiements arrivent dans les phases suivantes.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- next-themes (light/dark)
- Radix UI (accordion), lucide-react (icônes), framer-motion

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

- `npm run build` — build de production
- `npm run lint` — ESLint

## Architecture

```
src/
  app/                landing (/) et création de compte (/signup)
  components/
    ui/               primitives réutilisables (Button, Badge, Countdown, Accordion, ...)
    layout/           header, footer, announcement bar, chat button
    marketing/         sections de la landing page
    auth/               composants de la page signup
  lib/
    data/             contenu structuré (features, pricing, faq, testimonials, ...)
    hooks/            hooks client (countdown, ...)
```

## Identité visuelle

Fond blanc, rouge en accent (CTA, titres clés, éléments actifs). Pas de dashboard sombre en
phase 1. Design tokens (couleurs, typographies) définis dans `src/app/globals.css`.
