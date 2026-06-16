// Client action on a proposal: Accept, or submit Questions.
//   POST /api/proposal-action  { slug, password, type, message? }
//     type = 'accept' | 'questions'
//
// Verifies the password, records the event, advances the proposal
// status, then fires the Apps Script webhook which emails the team and
// appends a row to the Google Sheet log. Notification failure does NOT
// fail the client's action — the event is already recorded in the DB.

const { select, insert, update, sha256 } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { slug, password, type, message } = req.body || {};
    if (!slug || !type) return res.status(400).json({ error: 'slug and type are required' });
    if (type !== 'accept' && type !== 'questions') {
      return res.status(400).json({ error: 'type must be accept or questions' });
    }

    const rows = await select('prop_proposals', `slug=eq.${encodeURIComponent(slug)}&select=id,slug,client_name,status,password_hash`);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const p = rows[0];

    const ok = p.password_hash && sha256(password || '') === p.password_hash;
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    // Record the event
    await insert('prop_events', {
      proposal_id: p.id,
      type,
      message: type === 'questions' ? (message || '').slice(0, 4000) : null,
    });

    // Advance status. Accept always moves to 'accepted'. Questions only
    // flags 'questions' if the proposal hasn't already progressed past it.
    if (type === 'accept') {
      await update('prop_proposals', `id=eq.${p.id}`, { status: 'accepted' });
    } else if (['draft', 'sent'].includes(p.status)) {
      await update('prop_proposals', `id=eq.${p.id}`, { status: 'questions' });
    }

    // Fire-and-await notification (email + Sheet) — best effort
    const webhook = process.env.SHEETS_WEBHOOK;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'manual',
          body: JSON.stringify({
            type,
            client: p.client_name,
            slug: p.slug,
            url: `https://www.theseason.nyc/p/${p.slug}`,
            message: message || '',
            notifyEmail: process.env.NOTIFY_EMAIL || '',
          }),
        });
      } catch (_) { /* notification is best-effort; event already saved */ }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
