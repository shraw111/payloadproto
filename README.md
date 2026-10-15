# AI Content Studio on Payload: demo video prototype

Throwaway prototype for the ~4.5 minute demo video. The demo brand is a **Nissan Ariya** landing page. Claim wording is adapted from figures Nissan UK publishes for the Ariya (checked Oct 2026 on nissan.co.uk: the Ariya, range-charging and price-specifications pages, plus Nissan UK's EV warranty wording for the 8-year / 100,000-mile battery guarantee), but **the claims library is a prototype fixture, not Nissan's approved claims**; the offer (£1,500 / £2,500 charging credit) and testimonials are invented. No Nissan logos or assets are used. One codebase, run twice:

| Port | Copy | Env | Contents |
| --- | --- | --- | --- |
| 3000 | before build | `.env.before` | Studio (`/studio`) + empty CMS |
| 3001 | after build | `.env.after` | Generated model, seed pages, AI panels, review queue |

## Setup
```bash
npm install --legacy-peer-deps
cp .env.example .env.before && cp .env.example .env.after   # then edit: DEMO_STAGE=after, DATABASE_URI=file:./after.db in .env.after
# add ANTHROPIC_API_KEY to both
npm run seed:after          # claims, brand rules, 3 pages, demo@studio.test / demo1234
npm run reset               # restore clean DBs from demo/*.seed.db before every take
npm run dev:before          # :3000
npm run dev:after           # :3001
```
### AI mode
`DEMO_AI=live` (default when a key exists) calls Claude and falls back to stored output on failure or after 20 s.
`DEMO_AI=stored` (or no key) skips the API entirely. Stored mode is **not** canned: `src/lib/offlineAi.ts` builds the answer from the real input
(the instruction, the brief text, the page diff), so a changed instruction or brief changes the result. `demo/stored/backups/*` is the last resort.

**Run `npm run reset` only with both dev servers stopped**, or SQLite reports a read-only database.

## The use case: dealers publish offers in one click

HQ sets the rules once (approved claims, a £2,000 dealer discount limit, standard terms). A dealer says their offer in plain words, picks one of three
template previews, and clicks **Publish**. Pre-flight is the gate: clean pages go live on the dealer's own address, a critical finding blocks the click,
and an over-limit discount or finance wording goes to HQ. HQ only looks at exceptions. Offers end themselves.

Logins (password `demo1234`): `demo@studio.test` (HQ), `dealer@studio.test` (Northgate Nissan).

| Piece | Where |
| --- | --- |
| Dealer start screen: sentence → 3 template previews → fill gaps; HQ campaign kit | `src/admin/DealerStart.tsx`, `src/lib/dealerSuggest.ts`, `src/lib/templates.ts` |
| One-click publish, gated by pre-flight | `src/admin/PublishPanel.tsx`, `src/app/api/dealer/publish`, `src/lib/gate.ts` |
| Offer rules: end date, £ cap, finance → HQ, standard terms | `src/lib/preflightRules.ts` (`runOfferRules`) |
| HQ exceptions (approve / send back) | `src/admin/ReviewQueue.tsx`, `src/app/api/ai/approve` |
| Dealer isolation (a dealer only sees and edits their own pages) | `src/lib/access.ts`, `src/collections/Pages.ts` |
| Public offer pages with countdown and enquiry form | `src/app/(frontend)/[dealer]/[slug]`, `src/components/blocks` |
| Offers end themselves | page checks its dates on every request; `POST /api/jobs/expire` takes it offline (run on a schedule) |
| Leads (with consent) | `src/app/api/lead`, `leads` collection |

The prototype measures three real numbers: time from creating a page to live, how many pages needed HQ, and enquiries per dealer.
Not in the prototype: CRM/DMS integration, stock and price feeds, ad platforms, SSO, a claims-library editor beyond Payload's own admin.

## Deploy to Railway

One container: Next.js with Payload inside, SQLite on a Railway **Volume**. The `Dockerfile` and `railway.json` are in the repo.

1. New Railway project, deploy from this GitHub repo and branch.
2. Add a **Volume** mounted at `/data`.
3. Set variables:

| Variable | Value |
| --- | --- |
| `DEMO_STAGE` | `after` |
| `DATABASE_URI` | `file:/data/app.db` |
| `MEDIA_DIR` | `/data/media` |
| `PAYLOAD_SECRET` | a long random string |
| `SEED_PASSWORD` | password for the two seeded logins (`demo@studio.test` HQ, `dealer@studio.test` dealer) |
| `ANTHROPIC_API_KEY`, `DEMO_AI` | optional. Without a key the AI steps run in the rule-based stored mode |
| `APP_URL` | optional. Railway's public domain is used if unset |

4. Generate a public domain. Health check: `/api/hq/summary`.

On start the container applies the migrations in `src/migrations`, seeds the demo content **once** (a `.seeded` marker lives on the volume, so restarts never overwrite changes made in the admin), then serves on `$PORT`.

After changing a collection or field: `npm run migrate:create -- <name>` and commit the new migration. Production never pushes schema changes by itself.

## Scenes ↔ code
| Scene | Where |
| --- | --- |
| 1, 9 | `src/app/(frontend)/studio/page.tsx` (stored results from `demo/stored`) |
| 2 | `studio/review/page.tsx`, `api/ai/model-fix` (live) |
| 3 | `studio/build/page.tsx` (Apply goes to the after copy) |
| 4 | `src/app/(frontend)/[slug]`, `src/components/blocks` (designer polishes) |
| 5 | `src/admin/AssistantPanel.tsx`, `api/ai/brief-to-draft` (use `demo/Summer electric brief.docx`) |
| 6 | `AssistantPanel.tsx`, `api/ai/edit-everywhere` |
| 7 | `src/admin/PreflightPanel.tsx`, `api/ai/preflight`, `src/lib/preflightRules.ts` |
| 8 | `src/admin/ReviewQueue.tsx` (`/admin/review`), `api/ai/change-summary`, `api/ai/approve` |

## Still to do
- Real `.fig`, thumbnails (placeholder SVGs now) and polished block components (designer)
- Hand-clean `demo/stored/model.json` from a real Opus run; the current one is hand-authored
- 10-run checks per live scene with the real API key; tighten prompts
- Real `ANTHROPIC_API_KEY`; nothing was tested against the live API
