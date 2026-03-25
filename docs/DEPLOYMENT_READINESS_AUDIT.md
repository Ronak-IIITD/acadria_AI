# Deployment Readiness Audit (March 25, 2026)

This audit summarizes the current blockers and pre-launch tasks for deploying Acadira AI.

## Current verdict

**Status:** Not deploy-ready yet.

You should deploy **after** the P0 blockers are fixed and the verification commands in this document pass.

---

## Quick architecture clarification (because this repo mixes storage patterns)

You currently have **two different data/storage roles** in the codebase:

1. **Convex** is used for app data like highlights/metadata (user-linked records in `highlights` table).
2. **RAG document chunks/embeddings** are currently persisted in local JSON-backed storage files and in-memory service state (not a managed vector DB yet).

### What this means in practice

- Convex is **not** your vector database in the current implementation.
- The RAG pipeline is currently app-managed and file-based, which is okay for MVP/small traffic but not ideal for 1000+ active users.
- If your goal is production reliability at scale, move RAG indexing/retrieval to a managed vector database and shared object storage.

---

## P0 blockers (must fix before deployment)

1. **Frontend production build currently fails**
   - `npm run build` fails because `convex/_generated/api` is missing.
   - Root cause: generated Convex client code is not present in the repo/build environment.
   - Fix:
     - Run `npx convex dev` (or `npx convex codegen`) in CI and locally before build.
     - Ensure build pipeline generates Convex artifacts before running `vite build`.

2. **Backend has Python syntax errors in two AI services**
   - `python -m compileall backend/app` fails due to `SyntaxError: f-string expression part cannot include a backslash` in:
     - `backend/app/services/grok_service.py`
     - `backend/app/services/rag_service.py`
   - Fix:
     - Refactor the failing f-strings (typically by moving large conditional strings to variables instead of nesting escaped multiline f-strings inside `{...}`).
     - Re-run compile + startup checks.

3. **Admin session verification appears broken for upload progress endpoint**
   - In upload progress retrieval, the ownership check relies on `progress.get("user_id", "")`, but `user_id` is not stored in `upload_progress` entries.
   - Effect: progress polling may fail to return expected data for authenticated users.
   - Fix:
     - Store `user_id` in each progress payload or derive ownership safely from `batch_id` consistently.

---

## P1 security/reliability tasks (strongly recommended before public launch)

1. **Remove server startup logs that reveal whether secret keys exist**
   - `backend/app/main.py` currently prints whether key env vars are present on startup.
   - While it does not print full secrets, production logs should avoid this signal.

2. **Avoid exposing Gemini key in frontend unless intentionally BYOK**
   - Frontend initializes Google GenAI directly from `VITE_API_KEY`, which is publicly visible in browser bundles.
   - If this is not a user-provided BYOK model, move inference behind backend APIs.

3. **Harden admin auth for production**
   - Admin credentials come from env vars and sessions are in-memory only (lost on restart, single-instance only).
   - If multi-instance deployment is planned, move sessions to persistent shared storage (Redis/DB), add rate limits to admin login, and consider MFA.

4. **Fix documentation drift**
   - Some docs mention Supabase/Firebase even though the current app architecture uses Clerk + Convex + FastAPI.
   - Unify docs to avoid deployment misconfiguration.

5. **Avoid local-disk-only RAG persistence in production**
   - Local JSON/in-memory RAG state can reset on deploy/restart and does not scale well across multiple backend instances.
   - Move document blobs/chunks to object storage + managed vector DB.

---

## Where to get credentials + MVP-friendly free-tier notes

Below are the main credentials used by this project and where to get them.

### Clerk (Authentication)
- What to create:
  - `VITE_CLERK_PUBLISHABLE_KEY` (frontend)
  - `CLERK_JWT_ISSUER`, `CLERK_JWT_AUDIENCE`, `CLERK_JWT_SECRET` (backend)
- Where:
  - Clerk Dashboard → API Keys (publishable key)
  - Clerk Dashboard → JWT Templates (create template named `convex`)
- Free-tier note:
  - Clerk has a free tier suitable for MVPs; verify current limits in dashboard/pricing before launch.

### Convex (App database for highlights/metadata)
- What to create:
  - `VITE_CONVEX_URL`
- Where:
  - Convex Dashboard → Project Settings / Deployments URL
- Free-tier note:
  - Convex offers a free tier for early-stage apps; verify current function/database limits for expected usage.

### Google Gemini API (AI responses)
- What to create:
  - `GEMINI_API_KEY` (backend)
  - `VITE_API_KEY` is currently used in frontend but should be avoided in production unless intentional BYOK.
- Where:
  - Google AI Studio / Gemini API console
- Free-tier note:
  - Free quota exists for some models/regions, but production traffic often exceeds it quickly.

### Grok / Groq (optional models)
- What to create:
  - `GROK_API_KEY` (optional)
  - `GROQ_API_KEY` (optional)
- Where:
  - xAI Console (Grok)
  - Groq Console (Groq)
- Free-tier note:
  - Treat as optional for MVP. Start with one primary model provider to reduce complexity and cost risk.

---

## Production readiness plan for ~1000+ users (without Stripe for now)

You can postpone billing integration. Focus on reliability and guardrails first.

### Phase 1 — Must-do before launch
- Fix all P0 blockers in this doc.
- Enforce strict CORS + auth checks.
- Add per-IP and per-user rate limiting for expensive AI endpoints.
- Add structured logging and error tracking.
- Ensure secrets are only in deployment env vars (never in git).

### Phase 2 — Scale foundation (important for 1000+ users)
- Run backend with multiple workers/instances behind a load balancer.
- Move uploaded documents/chunks to object storage (e.g., S3/R2/GCS).
- Move retrieval to managed vector DB (e.g., Pinecone/Qdrant/Weaviate/pgvector-based service).
- Add background queue for document ingestion/chunking to avoid request timeouts.
- Add caching for repeated queries and model metadata.

### Phase 3 — Reliability and operations
- Add uptime/health monitoring + alerting.
- Add dashboards for latency, error rate, and token usage.
- Define backup/restore + retention policy.
- Run load tests before launch target.

### Capacity expectation note
- With current local JSON + in-memory RAG approach, expecting smooth 1000+ concurrent users is risky.
- With managed storage/vector DB + horizontally scaled API, 1000+ becomes realistic.

---

## Infrastructure readiness checklist

### Auth
- [ ] Clerk production instance created.
- [ ] JWT template named `convex` configured in Clerk.
- [ ] Backend env set: `CLERK_JWT_ISSUER`, `CLERK_JWT_AUDIENCE`, `CLERK_JWT_SECRET`.
- [ ] Clerk allowed origins + redirect URLs include production frontend domain(s).

### Database / state
- [ ] Convex project deployed.
- [ ] Convex URL set in frontend (`VITE_CONVEX_URL`).
- [ ] Convex-generated files produced in CI before frontend build.
- [ ] Decide and document what Convex stores (highlights/metadata) vs what RAG store handles (chunks/embeddings).
- [ ] Replace local JSON RAG persistence with object storage + managed vector DB for scale.

### API keys
- [ ] `GEMINI_API_KEY` set on backend.
- [ ] Optional keys only if used: `GROK_API_KEY`, `GROQ_API_KEY`.
- [ ] Rotate keys if they were ever committed/exposed.

### Backend
- [ ] Syntax errors resolved in AI service modules.
- [ ] CORS narrowed to exact production domains (`ALLOWED_ORIGINS`).
- [ ] Admin credentials set (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and protected.
- [ ] Health endpoint monitored.

### Frontend
- [ ] `VITE_BACKEND_URL` points to production backend.
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` set to production key.
- [ ] Build passes in clean environment.

### Operations
- [ ] Error tracking configured (Sentry or equivalent).
- [ ] Request logging enabled with PII-safe formatting.
- [ ] Basic backup/retention strategy defined for user document data.
- [ ] Load test target concurrency and set autoscaling thresholds.
- [ ] Add AI cost controls (rate limits, model fallback rules, usage ceilings).

---

## Verification commands (must pass)

```bash
# Frontend
npx convex codegen
npm run build

# Backend
python -m compileall backend/app
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Deploy when all four commands pass and env variables are configured for production.

---

## Estimated deployment timeline

- **Best case (focused fix session):** same day.
- **Typical case:** 1–2 days (including auth/infra configuration and smoke testing).
- **If adding security hardening + observability:** 2–4 days.
