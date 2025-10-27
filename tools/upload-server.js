import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const upload = multer({ dest: 'tmp/' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_SIG_BUCKET || 'certificate-signatures';
const ADMIN_TOKEN = process.env.UPLOAD_ADMIN_TOKEN || null;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. See .env.example');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

app.post('/upload-signature', upload.single('file'), async (req, res) => {
  try {
    if (ADMIN_TOKEN) {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const file = req.file;
    const name = req.body.name || null;
    const created_by = req.body.created_by || null;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const buffer = await fs.readFile(file.path);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.originalname.replace(/\s+/g, '_')}`;

    // upload to storage
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filename, buffer, { cacheControl: '3600', upsert: false });

    // cleanup temp
    await fs.unlink(file.path).catch(() => {});

    if (uploadError) {
      console.error('Storage upload error', uploadError);
      return res.status(500).json({ error: uploadError });
    }

    // Create signature profile directly (RPCs/secret generation removed)
    let profile = null;
    try {
      const { data: insData, error: insErr } = await supabase.from('signature_profiles').insert({ name: name || filename, filename, created_by }).select().limit(1).maybeSingle();
      if (insErr) {
        console.warn('Could not create signature profile via insert', insErr);
      } else {
        profile = insData;
      }
    } catch (e) {
      console.warn('Error creating profile via insert', e);
    }

    return res.json({ ok: true, filename, profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Upload server listening on ${PORT}`));
