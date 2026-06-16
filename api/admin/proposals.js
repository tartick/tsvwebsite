// Admin CRUD for proposals. All methods require the admin password.
//   GET    /api/admin/proposals             → list all (newest first)
//   GET    /api/admin/proposals?slug=x       → one full proposal (edit/duplicate)
//   POST   /api/admin/proposals  {adminPw, proposal}      → create
//   PATCH  /api/admin/proposals  {adminPw, id, patch}     → update
//   DELETE /api/admin/proposals  {adminPw, id}            → delete
//
// GET passes the admin password via the `x-admin-pw` header (keeps it
// out of the URL / logs). Writes pass it in the JSON body.

const { select, insert, update, remove, sha256, isAdmin } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pw');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ── GET: list, or one by slug ──────────────────────────────
    if (req.method === 'GET') {
      if (!isAdmin(req.headers['x-admin-pw'])) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const slug = req.query.slug;
      if (slug) {
        const rows = await select('proposals', `slug=eq.${encodeURIComponent(slug)}&select=*`);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(rows[0]);
      }
      // List view: lightweight columns, newest first
      const rows = await select(
        'proposals',
        'select=id,slug,client_name,show_subtitle,hero_date,status,password_plain,services,' +
        'featured_companies,contract_status,updated_at&order=updated_at.desc'
      );
      return res.status(200).json(rows);
    }

    const body = req.body || {};

    // ── POST: create ───────────────────────────────────────────
    if (req.method === 'POST') {
      if (!isAdmin(body.adminPw)) return res.status(401).json({ error: 'Unauthorized' });
      const p = body.proposal || {};
      if (!p.slug || !p.client_name) {
        return res.status(400).json({ error: 'slug and client_name are required' });
      }
      if (p.password_plain) p.password_hash = await sha256(p.password_plain);
      delete p.adminPw;
      const rows = await insert('proposals', p);
      return res.status(200).json(rows[0]);
    }

    // ── PATCH: update ──────────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!isAdmin(body.adminPw)) return res.status(401).json({ error: 'Unauthorized' });
      const { id, patch } = body;
      if (!id || !patch) return res.status(400).json({ error: 'id and patch are required' });
      // Re-hash if the plaintext password changed
      if (patch.password_plain) patch.password_hash = await sha256(patch.password_plain);
      const rows = await update('proposals', `id=eq.${id}`, patch);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    }

    // ── DELETE ─────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!isAdmin(body.adminPw)) return res.status(401).json({ error: 'Unauthorized' });
      if (!body.id) return res.status(400).json({ error: 'id is required' });
      await remove('proposals', `id=eq.${body.id}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
