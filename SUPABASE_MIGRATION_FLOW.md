# Supabase Migration Flow (Recommended)

This file explains the complete migration workflow for this project (Supabase DB + Render/Vercel deploys).

## Why this is needed

This backend currently uses SQLAlchemy `create_all()` on startup, which **does not alter existing tables**.
For production schema changes, use real SQL migrations via Supabase CLI.

---

## 1) First-time setup (once per repo)

Run these commands from the repository root:

```bash
cd <PATH-TO>/ultimate-frisbee-stats
supabase init
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db pull
```

What this does:
- `supabase init`: creates local `supabase/` folder
- `supabase link`: connects local repo to your remote Supabase project
- `supabase db pull`: creates a baseline migration from current remote schema

How to find `<YOUR_PROJECT_REF>`:
- Supabase dashboard URL usually contains it:
  - `https://supabase.com/dashboard/project/<project-ref>/...`

---

## 2) For each new DB feature

### Step A — Create migration file

```bash
supabase migration new <short_descriptive_name>
```

Example:

```bash
supabase migration new add_call_type_and_game_events
```

Then edit the generated SQL file in `supabase/migrations/`.

### Step B — Implement backend code

Implement/update:
- SQLAlchemy models
- Pydantic schemas
- CRUD functions
- Routers
- Tests

### Step C — Validate locally

Run backend tests:

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## 3) Apply migration to remote Supabase

From repo root:

```bash
supabase db push --linked
```

This applies pending migration files to the linked Supabase project.

---

## 4) Deploy order (important)

Recommended order:
1. Merge code + migration file to main
2. Run `supabase db push --linked` (CI or manually)
3. Deploy backend (Render)
4. Deploy frontend (Vercel)

Reason: backend must run against the updated schema.

---

## 5) CI automation (recommended)

Automate migration apply before backend deploy in GitHub Actions:

```bash
supabase db push --linked
```

Use repository secrets for Supabase access (token/project ref as required by your CI setup).

---

## 6) Notes for this project

- Render free plan does not provide a robust pre-deploy migration hook for this workflow.
- Prefer explicit migration execution via CI/manual command.
- Keep migrations additive and backward-compatible when possible:
  - Add nullable column or add default first
  - Backfill existing rows
  - Then enforce `NOT NULL`/constraints

