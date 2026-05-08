// GET  /api/videos        — returns current video config
// POST /api/videos  + {password, videos} — updates config in GitHub

const REPO   = 'tartick/tsvwebsite';
const PATH   = 'data/videos.json';
const BRANCH = 'main';
const API    = 'https://api.github.com';

async function getFile(token) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  return { content, sha: data.sha };
}

async function putFile(token, content, sha) {
  const body = JSON.stringify({
    message: 'Update video config via admin',
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha,
    branch: BRANCH,
  });
  const res = await fetch(`${API}/repos/${REPO}/contents/${PATH}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write failed: ${res.status} — ${err}`);
  }
}

export default async function handler(req, res) {
  // CORS for same-origin (Vercel handles this, but explicit is fine)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });

  // ── GET: return current videos ────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { content } = await getFile(token);
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
      return res.status(200).json(content);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: save videos (password required) ────────────────────
  if (req.method === 'POST') {
    const { password, videos } = req.body || {};

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!videos || typeof videos !== 'object') {
      return res.status(400).json({ error: 'Missing videos payload' });
    }

    try {
      const { sha } = await getFile(token);
      await putFile(token, videos, sha);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
