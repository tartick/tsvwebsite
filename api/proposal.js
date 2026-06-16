// Public, password-gated read of ONE proposal.
//   POST /api/proposal  { slug, password }
//
// Verifies the password against the stored hash server-side and returns
// the full proposal ONLY on a match — so no client-side key can pull
// another client's proposal. Also resolves the proposal's referenced
// contacts + reference items so the viewer has everything it needs.
//
// POST (not GET) so the password never lands in a URL / server log.

const { select, sha256 } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { slug, password } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const rows = await select('prop_proposals', `slug=eq.${encodeURIComponent(slug)}&select=*`);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const p = rows[0];

    // Password check (constant-ish: always hash before comparing)
    const ok = p.password_hash && sha256(password || '') === p.password_hash;
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    // Strip admin-only fields before returning to the client
    delete p.password_hash;
    delete p.password_plain;
    delete p.internal_tag;

    // Resolve referenced contacts (for the Questions modal)
    let contacts = [];
    if (Array.isArray(p.contact_ids) && p.contact_ids.length) {
      const ids = p.contact_ids.map(id => `"${id}"`).join(',');
      contacts = await select('prop_contacts', `id=in.(${ids})&select=id,name,title,company_key,email,phone,specialty`);
    }

    // Resolve referenced companies (for the collective block)
    let companies = [];
    if (Array.isArray(p.featured_companies) && p.featured_companies.length) {
      const keys = p.featured_companies.map(k => `"${k}"`).join(',');
      companies = await select('prop_companies', `key=in.(${keys})&select=*&order=sort.asc`);
    }

    // Resolve reference items used across the proposal's services
    const refIds = [...new Set(
      (Array.isArray(p.services) ? p.services : [])
        .flatMap(s => Array.isArray(s.reference_ids) ? s.reference_ids : [])
    )];
    let references = [];
    if (refIds.length) {
      const ids = refIds.map(id => `"${id}"`).join(',');
      references = await select('prop_references', `id=in.(${ids})&select=*`);
    }

    return res.status(200).json({ proposal: p, contacts, companies, references });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
