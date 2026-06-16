// Admin CRUD for the three catalog tables + companies (read-only).
//   GET    /api/admin/catalog?type=services|references|contacts|companies
//   POST   /api/admin/catalog  {adminPw, type, row}        → create
//   PATCH  /api/admin/catalog  {adminPw, type, id, patch}  → update
//   DELETE /api/admin/catalog  {adminPw, type, id}         → delete
//
// GET passes admin password via the `x-admin-pw` header.

const { select, insert, update, remove, isAdmin } = require('../../lib/supabase');

const TABLES = {
  services:   'services',
  references: 'reference_items',
  contacts:   'contacts',
  companies:  'companies',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pw');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      if (!isAdmin(req.headers['x-admin-pw'])) return res.status(401).json({ error: 'Unauthorized' });
      const table = TABLES[req.query.type];
      if (!table) return res.status(400).json({ error: 'Unknown type' });
      const rows = await select(table, 'select=*&order=sort.asc');
      return res.status(200).json(rows);
    }

    const body = req.body || {};
    if (!isAdmin(body.adminPw)) return res.status(401).json({ error: 'Unauthorized' });
    const table = TABLES[body.type];
    if (!table || table === 'companies') {
      return res.status(400).json({ error: 'Unknown or read-only type' });
    }

    if (req.method === 'POST') {
      if (!body.row) return res.status(400).json({ error: 'row is required' });
      const rows = await insert(table, body.row);
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'PATCH') {
      if (!body.id || !body.patch) return res.status(400).json({ error: 'id and patch are required' });
      const rows = await update(table, `id=eq.${body.id}`, body.patch);
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      if (!body.id) return res.status(400).json({ error: 'id is required' });
      await remove(table, `id=eq.${body.id}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
