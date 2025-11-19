const { createClient } = require('@supabase/supabase-js');

// Serverless endpoint to return profile display names for a list of ids.
// Expects POST JSON body: { ids: ["id1","id2", ...] }
// Requires env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { ids } = req.body || {};
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Missing ids array in body' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase service env vars' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', ids);

    if (error) throw error;

    // return map of id -> profile
    const map = {};
    (data || []).forEach((p) => { map[p.id] = p; });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ profiles: map });
  } catch (err) {
    console.error('get-creators error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
