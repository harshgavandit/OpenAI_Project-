# MemoryGraph — Production Deploy (Free Tier)

Deploy **frontend on Vercel** + **API on Render** with `/api` proxy (cookies work on one domain).

## 1. Backend — Render

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New Blueprint** → connect repo → select `MemoryGraph/render.yaml`.
3. Set **FRONTEND_URL** to your Vercel URL (e.g. `https://memorygraph.vercel.app`).
4. Deploy. Note the API URL: `https://memorygraph-api.onrender.com`.

Optional PostgreSQL (Neon free):

```env
DATABASE_URL=postgresql+psycopg://user:pass@host/neondb?sslmode=require
```

Run migrations after first deploy:

```bash
cd MemoryGraph/backend && alembic upgrade head
```

## 2. Frontend — Vercel

1. [Vercel](https://vercel.com/new) → Import repo → **Root Directory:** `MemoryGraph/frontend`.
2. Environment variables:

| Variable | Value |
|----------|--------|
| `BACKEND_URL` | `https://memorygraph-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | (optional) |

3. Deploy. Vercel rewrites `/api/*` → Render (see `next.config.ts`).

## 3. Verify

- `https://your-app.vercel.app` — marketing + sign up
- Register → Home auto-loads sample family
- Ask → sources appear
- Stories → build chapter

Health: `https://memorygraph-api.onrender.com/health`

## 4. Local Ollama (optional)

Ollama runs on **your machine**, not Render. For hosted demo, `LLM_PROVIDER=fallback` uses regex enrichment (no GPU needed).

To use Ollama locally:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## 5. Costs

- Vercel Hobby: $0
- Render Free: $0 (cold starts ~30s)
- Neon Postgres: $0 tier optional
- **No Stripe, no paid AI APIs required**
