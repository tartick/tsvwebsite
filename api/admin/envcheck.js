// TEMPORARY diagnostic — reports which env var NAMES the running
// function can see. Never returns values. Admin-gated. Delete after use.

const { isAdmin } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  if (!isAdmin(req.headers['x-admin-pw'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const present = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
  };
  // Names (not values) of any env keys mentioning supabase, to catch typos.
  const supabaseish = Object.keys(process.env).filter(k => /supa/i.test(k));
  // First 12 chars of the URL only, to confirm it's a real project URL.
  const urlPrefix = (process.env.SUPABASE_URL || '').slice(0, 12);
  return res.status(200).json({
    present,
    supabaseKeyNames: supabaseish,
    urlPrefix,
    vercelEnv: process.env.VERCEL_ENV || null,
  });
};
