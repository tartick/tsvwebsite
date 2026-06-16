// Thin Supabase (PostgREST) client over fetch — no npm dependency.
// Uses the SECRET key server-side, which bypasses RLS. Never import
// this into anything that ships to the browser.

const URL    = process.env.SUPABASE_URL;          // https://xxxx.supabase.co
const SECRET = process.env.SUPABASE_SECRET_KEY;   // sb_secret_…

function assertEnv() {
  if (!URL || !SECRET) {
    throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY not configured');
  }
}

function headers(extra = {}) {
  return {
    apikey: SECRET,
    Authorization: `Bearer ${SECRET}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// GET rows. `query` is a PostgREST query string, e.g. "select=*&order=sort.asc"
async function select(table, query = 'select=*') {
  assertEnv();
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// INSERT one or many rows; returns the inserted rows.
async function insert(table, rows) {
  assertEnv();
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// PATCH rows matching `filter` (PostgREST string, e.g. "id=eq.<uuid>").
async function update(table, filter, patch) {
  assertEnv();
  const res = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// DELETE rows matching `filter`.
async function remove(table, filter) {
  assertEnv();
  const res = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: headers({ Prefer: 'return=representation' }),
  });
  if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// SHA-256 hex of a string (for proposal password verification).
// Matches the browser's crypto.subtle digest output, so hashes computed
// here verify against the client-side gate and vice versa.
const nodeCrypto = require('crypto');
function sha256(text) {
  return nodeCrypto.createHash('sha256').update(String(text)).digest('hex');
}

// Admin password check, shared by all admin routes.
function isAdmin(password) {
  return password && password === process.env.ADMIN_PASSWORD;
}

module.exports = { select, insert, update, remove, sha256, isAdmin };
