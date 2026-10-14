# AI Content Studio on Payload: demo video prototype

Throwaway prototype for the ~4.5 minute demo video (Halden Health, demo design only). One codebase, run twice:

| Port | Copy | Env | Contents |
| --- | --- | --- | --- |
| 3000 | before build | `.env.before` | Studio (`/studio`) + empty CMS |
| 3001 | after build | `.env.after` | Generated model, seed pages, AI panels, review queue |

## Setup
```bash
npm install --legacy-peer-deps
cp .env.example .env.before && cp .env.example .env.after   # then edit: DEMO_STAGE=after, DATABASE_URI=file:./after.db in .env.after
# add ANTHROPIC_API_KEY to both
npm run seed:after          # claims, brand rules, 3 pages, demo@halden.test / demo1234
npm run reset               # restore clean DBs from demo/*.seed.db before every take
npm run dev:before          # :3000
npm run dev:after           # :3001
```
Without `ANTHROPIC_API_KEY` (or if a call fails or takes over 20 s) every AI route falls back to `demo/stored/backups/*`.

## Scenes ↔ code
| Scene | Where |
| --- | --- |
| 1, 9 | `src/app/(frontend)/studio/page.tsx` (stored results from `demo/stored`) |
| 2 | `studio/review/page.tsx`, `api/ai/model-fix` (live) |
| 3 | `studio/build/page.tsx` (Apply goes to the after copy) |
| 4 | `src/app/(frontend)/[slug]`, `src/components/blocks` (designer polishes) |
| 5 | `src/admin/AssistantPanel.tsx`, `api/ai/brief-to-draft` (use `demo/Summer pollen brief.docx`) |
| 6 | `AssistantPanel.tsx`, `api/ai/edit-everywhere` |
| 7 | `src/admin/PreflightPanel.tsx`, `api/ai/preflight`, `src/lib/preflightRules.ts` |
| 8 | `src/admin/ReviewQueue.tsx` (`/admin/review`), `api/ai/change-summary`, `api/ai/approve` |

## Still to do
- Real `.fig`, thumbnails (placeholder SVGs now) and polished block components (designer)
- Hand-clean `demo/stored/model.json` from a real Opus run; the current one is hand-authored
- 10-run checks per live scene with the real API key; tighten prompts
- Real `ANTHROPIC_API_KEY`; nothing was tested against the live API
