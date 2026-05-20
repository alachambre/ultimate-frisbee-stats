---
name: database-migration-dev
description: Use when modifying database tables, indexes, SQLAlchemy models, schemas that mirror persistence, Supabase migrations, or SQLite/PostgreSQL compatibility.
---

# Database Migration Dev

## Objective

Make schema changes explicit, reviewable, and compatible with local SQLite and production Supabase/PostgreSQL behavior.

## Preflight

Read `references/links.md`, `AGENTS.md`, and relevant models/schemas before editing.

## Workflow

1. Identify whether the change requires a Supabase SQL migration, SQLAlchemy model update, Pydantic schema update, CRUD update, or all of them.
2. Add migrations under `supabase/migrations/` with timestamped filenames.
3. Keep SQLAlchemy models aligned with the migrated schema.
4. Avoid relying on `create_all()` as the production schema-change mechanism.
5. Consider indexes for new query paths, especially statistics filters and relationship joins.
6. Run focused backend CRUD/API tests.

## Project Rules

- SQLite is the local fallback; do not introduce PostgreSQL-only behavior without guarding or documenting it.
- Supabase migrations are the source for production schema evolution.
- Keep nullable/default behavior explicit in migrations and schemas.
- Statistics query performance changes should be tested with representative filters where possible.

## Stop Conditions

Stop and report a blocker when a destructive migration, data backfill, or production-only operation is needed.
