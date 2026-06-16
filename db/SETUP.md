# Proposal Tool — backend setup (one-time)

The code for the Supabase backend is written and committed. To light it
up, do these steps once. Takes ~10 minutes. You can't be locked out of
anything — if a step fails, the mock pages still work as before.

---

## 1. Create the Supabase project

1. Go to **supabase.com → New project**. Name it `theseason-proposals`.
2. Pick a region close to you (US East). Set a strong database password
   (you won't need it for this — Supabase stores it).
3. Wait ~2 min for it to provision.

## 2. Run the schema + seed

1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of **`db/schema.sql`**, click **Run**.
   Should say "Success. No rows returned."
3. New query again. Paste **`db/seed.sql`**, click **Run**. This loads
   the 13 services, 14 references, and 8 contacts from the mockups.
4. Spot-check: **Table Editor → proposals/services/contacts** — you
   should see the seeded catalog (proposals will be empty; that's right).

## 3. Grab your keys

In Supabase: **Settings → API Keys → "Publishable and secret API keys" tab.**

- Copy the **Project URL** (looks like `https://abcdxyz.supabase.co`)
- Copy the **secret key** (`sb_secret_…`) — server-side only, treat like
  a password. We do **not** use the publishable key here (the browser
  never talks to Supabase directly).

## 4. Add the keys to Vercel

In the Vercel dashboard for `tsvwebsite`: **Settings → Environment
Variables.** Add (Production + Preview):

| Name | Value |
|---|---|
| `SUPABASE_URL` | your Project URL from step 3 |
| `SUPABASE_SECRET_KEY` | your `sb_secret_…` key |
| `ADMIN_PASSWORD` | `tsv2026` *(confirm it's already there from the legacy video admin; add if missing)* |

Then **redeploy** (Deployments → ⋯ → Redeploy) so the new vars load,
or just push any commit.

## 5. Smoke-test the connection

Once redeployed, from your terminal:

```bash
# Should return the seeded services as JSON (needs the admin header)
curl -s 'https://www.theseason.nyc/api/admin/catalog?type=services' \
     -H 'x-admin-pw: tsv2026' | head -c 400 ; echo

# Should return [] (no proposals yet) — proves the DB connection works
curl -s 'https://www.theseason.nyc/api/admin/proposals' \
     -H 'x-admin-pw: tsv2026' ; echo

# Wrong password should return 401
curl -s 'https://www.theseason.nyc/api/admin/proposals' \
     -H 'x-admin-pw: nope' ; echo
```

If the first two return JSON (not an error), the backend is live and I
can wire the admin pages to it. If you see
`SUPABASE_URL / SUPABASE_SECRET_KEY not configured`, the env vars didn't
load — re-check step 4 and that you redeployed.

---

## Still to come (after this works)
- **Email + Sheet notifications** for Accept / Questions — needs a Google
  Sheet + Apps Script (I'll give you that template next, same pattern as
  your other forms).
- Wiring the five admin pages + the public proposal page to these APIs.

## Files
- `db/schema.sql` — tables, indexes, RLS lockdown
- `db/seed.sql` — catalog data from the mockups
- `lib/supabase.js` — server-side REST helper (secret key)
- `api/admin/proposals.js` — proposal CRUD
- `api/admin/catalog.js` — services / references / contacts CRUD
