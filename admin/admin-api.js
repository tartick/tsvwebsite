// Shared admin helpers — password gate + API calls.
// Included by every /admin/*.html page.

const ADMIN_HASH = 'a67fd79dd6ca5da8c1587997fd30c4ea1e6e401b76243dc4e41011e76c8c1527'; // sha256("tsv2026")

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Wire the standard gate. Calls onUnlock() once the page is unlocked
// (either from a saved session or a correct password entry).
function initGate(onUnlock) {
  const gate = document.getElementById('gate');
  const form = document.getElementById('gate-form');
  const pw   = document.getElementById('gate-pw');
  const err  = document.getElementById('gate-err');

  function unlock() { gate.classList.add('hidden'); onUnlock && onUnlock(); }

  if (sessionStorage.getItem('tsv_admin') === '1' && sessionStorage.getItem('tsv_admin_pw')) {
    unlock();
  } else {
    setTimeout(() => pw && pw.focus(), 50);
  }

  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    err.textContent = '';
    if (await sha256(pw.value) === ADMIN_HASH) {
      sessionStorage.setItem('tsv_admin', '1');
      sessionStorage.setItem('tsv_admin_pw', pw.value); // needed for API auth
      unlock();
    } else {
      err.textContent = 'Incorrect password.';
      pw.value = ''; pw.focus();
    }
  });
}

function adminPw() { return sessionStorage.getItem('tsv_admin_pw') || ''; }

// GET with the admin password header.
async function apiGet(path) {
  const res = await fetch(path, { headers: { 'x-admin-pw': adminPw() } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// POST / PATCH / DELETE with the admin password in the body.
async function apiSend(path, method, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, adminPw: adminPw() }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// Company display metadata (label + chip class), keyed by company key.
const COMPANY = {
  tsv:      { label: 'The Season',         short: 'TSV',  chip: 'co-tsv',   avatar: 'tsv' },
  '11oc':   { label: "11 O'Clock Studio",  short: '11OC', chip: 'co-11oc',  avatar: 'oc11' },
  relay:    { label: 'Relay',              short: 'RLY',  chip: 'co-relay', avatar: 'relay' },
  flyer:    { label: 'Flyer',              short: 'FLY',  chip: 'co-flyer', avatar: 'flyer' },
  marathon: { label: 'Marathon Digital',   short: 'MAR',  chip: 'co-mar',   avatar: 'marathon' },
  forest:   { label: 'Forest',             short: 'FST',  chip: 'co-forest',avatar: 'forest' },
};

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtRate(amount, unit, note) {
  if (amount == null) return '—';
  const base = '$' + Number(amount).toLocaleString('en-US');
  const suffix = unit === 'monthly' ? '/mo' : '';
  return base + suffix + (note ? ' ' + note : '');
}
