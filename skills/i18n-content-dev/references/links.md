# I18n Content Dev Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `GLOSSARY.md`
- `frontend/README.md`
- `AGENTS.md`

## Source

- Locales index: `frontend/src/locales/index.ts`
- English namespaces: `frontend/src/locales/en/`
- French namespaces: `frontend/src/locales/fr/`
- Locale parity test: `frontend/src/locales/__tests__/localeParity.test.ts`

## Commands

```bash
cd frontend && npm test -- localeParity
cd frontend && npm test
```
