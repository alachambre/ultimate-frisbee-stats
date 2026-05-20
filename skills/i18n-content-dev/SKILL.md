---
name: i18n-content-dev
description: Use when adding, changing, or reviewing frontend i18n keys, English/French copy, namespace structure, locale parity, or ultimate frisbee terminology.
---

# I18n Content Dev

## Objective

Keep English and French UI copy complete, consistent, and aligned with ultimate frisbee terminology.

## Preflight

Read `references/links.md` and `GLOSSARY.md` before editing user-facing copy.

## Workflow

1. Locate the owning namespace under `frontend/src/locales/en/` and `frontend/src/locales/fr/`.
2. Add or update keys in both languages.
3. Preserve sport terms that should remain in English.
4. Prefer existing key naming patterns and avoid duplicating near-identical copy.
5. Run locale parity tests and the affected UI tests.

## Project Rules

- Sport terms such as Pull, Turnover, Turn, Break, Hold, Handler, Cutter, and Call stay in English.
- User-facing text should go through i18n unless the surrounding component already has a deliberate exception.
- Keep namespace ownership clear: statistics copy belongs in `statistics.json`, game copy in `games.json`, and so on.

## Stop Conditions

Stop and ask for product wording when the French copy would require a domain decision rather than a direct translation.
