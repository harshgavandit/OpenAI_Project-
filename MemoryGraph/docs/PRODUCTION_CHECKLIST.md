# MemoryGraph Production Checklist

## Required Environment

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_TRANSCRIPTION_MODEL`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `CHROMA_DB_PATH`
- `NEXT_PUBLIC_API_BASE_URL`

## Before Launch

- Run `alembic upgrade head` in `backend`.
- Confirm `/health` returns `ok`.
- Confirm auth, upload, search, chat, Time Machine, and graph routes require JWT.
- Configure Render persistent disk or move Chroma/uploads to managed storage.
- Replace local bearer-token storage with secure cookie auth before handling real private user data at scale.
- Add Stripe keys before enabling billing checkout/portal.
- Install native Tesseract on backend host before relying on image OCR.

## Demo Script

1. Register account.
2. Click `Demo Mode`.
3. Search `grandfather`.
4. Ask `Show memories involving grandfather`.
5. Open `Time Machine`.
6. Query `Show my father's life between age 20-30` with birth year `1978`.
7. Open `Graph`.
