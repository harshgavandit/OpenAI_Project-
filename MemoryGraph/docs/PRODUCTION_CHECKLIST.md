# MemoryGraph Production Checklist

## Required Environment

### Backend (`MemoryGraph/backend/.env`)

- `DATABASE_URL` — PostgreSQL in production
- `JWT_SECRET_KEY` — long random secret
- `CHROMA_DB_PATH` — persistent volume path
- `OPENAI_API_KEY` and/or `OLLAMA_BASE_URL` for AI
- `FRONTEND_URL` — production site origin (CORS + cookies)
- `COOKIE_SECURE=true` behind HTTPS

### Frontend (`MemoryGraph/frontend/.env`)

- `NEXT_PUBLIC_API_URL=/api` — same-origin proxy to backend
- `BACKEND_URL` — internal API URL used by `next.config.ts` rewrites
- `NEXT_PUBLIC_SITE_URL` — public site URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — register `http://localhost:3000` and production URL in Google Cloud Console
- `SESSION_COOKIE_SECURE=true` — enforce secure cookies in production

## Before Launch

- Run `alembic upgrade head` in `backend`
- Confirm `GET /health` returns OK via `/api/health` through the frontend proxy
- Confirm auth, upload, search, chat, bootstrap, password reset, and invite accept flows
- Configure SMTP and set `DEV_LOG_OTP=false` for real email
- Add Stripe keys before enabling checkout (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_FAMILY`)
- Install Tesseract on the API host if image OCR is required
- Run CI: `.github/workflows/ci.yml`

## Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → OAuth client:

- **Authorized JavaScript origins:** `http://localhost:3000`, `http://localhost:3001`, production URL
- **Authorized redirect URIs:** match your auth callback if using redirect flow

## Contributor archives

1. Owner creates invite from Studio → Settings
2. Contributor opens `/invite/{token}`, signs in, accepts
3. Contributor selects shared archive in the sidebar switcher
4. Uploads and search apply to the owner archive

## Demo Script (local)

1. Register account
2. Load sample family from Studio
3. Search `grandfather` at `/search`
4. Ask on `/ask` with source proofs
5. Open Library `/memories` and Processing `/processing`

> Note: Updated by GitHub contribution automation.
