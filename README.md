# Meta Leads CRM

Next.js (App Router) app with one tab: **Leads**. Leads from Meta (Facebook/Instagram) Lead Ads land here automatically via a webhook; you can also add leads manually.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

## How it works
Meta Lead Ad form submitted → Meta POSTs `leadgen_id` to `/api/webhooks/meta` → signature verified → lead details fetched from Graph API → saved → shown in the table (auto-refreshes every 10s).

| Path | Purpose |
|---|---|
| `src/app/api/webhooks/meta/route.ts` | Webhook verify (GET) + receive leads (POST) |
| `src/lib/meta.ts` | Signature check + Graph API fetch + field mapping |
| `src/lib/store.ts` | Storage (JSON file; replace with a DB for production) |
| `src/app/api/leads/route.ts` | List / create leads |
| `src/components/LeadsView.tsx` | Leads table UI |

## Meta setup (what you need to do)
1. **Facebook Page + Lead Ad form** running on it (Ads Manager → Lead generation objective). Note the form's field names and adjust `fetchMetaLead` in `src/lib/meta.ts` if they differ.
2. **Create a Meta App** at developers.facebook.com (type: Business). Add the **Webhooks** product.
3. Copy **App Secret** (App settings → Basic) → `META_APP_SECRET`.
4. Generate a **long-lived Page Access Token** with `leads_retrieval`, `pages_manage_metadata`, `pages_show_list`, `pages_read_engagement` → `META_PAGE_ACCESS_TOKEN`. (Your user must have access to the page & Lead Access Manager permission.)
5. Deploy this app (or use `ngrok http 3000` for testing) — Meta needs a public **HTTPS** URL.
6. In App Dashboard → Webhooks → **Page** object → Callback URL `https://<your-domain>/api/webhooks/meta`, Verify token = your `META_VERIFY_TOKEN`. Subscribe to the **leadgen** field.
7. Subscribe the app to your page: `POST /{page-id}/subscribed_apps?subscribed_fields=leadgen` with the page token.
8. Test with Meta's **Lead Ads Testing Tool** (developers.facebook.com/tools/lead-ads-testing). For live traffic, the app needs Advanced Access to `leads_retrieval` (App Review) and to be in Live mode.

## Deploying
Vercel's filesystem is read-only, so swap `src/lib/store.ts` for Postgres (Neon/Supabase/Vercel Postgres) before deploying there.
