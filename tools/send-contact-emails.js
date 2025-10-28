/*
  Small worker to process `mail_queue` rows and send emails.
  Usage:
    - Install deps: npm install @supabase/supabase-js nodemailer
    - Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
    - Run: node tools/send-contact-emails.js

  This script polls for unprocessed rows and marks them processed after sending.
*/

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // use service role key on server
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const MAIL_FROM = process.env.MAIL_FROM || process.env.MAIL_USER;

async function processBatch() {
  try {
    const { data: rows, error } = await supabase
      .from('mail_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching mail_queue', error);
      return;
    }

    if (!rows || rows.length === 0) return;

    for (const row of rows) {
      const payload = row.payload || {};
      const to = row.recipient_email;
      const subject = row.subject || 'UDES E-Exchange';
      const text = `Has recibido un nuevo mensaje en tu buzón de UDES E-Exchange.

Remitente: ${payload.sender_name || ''} <${payload.sender_email || ''}>
Universidad: ${payload.university_representing || ''}
Motivo: ${payload.reason || ''}${payload.reason_other ? ` — ${payload.reason_other}` : ''}

Mensaje:\n${payload.message || ''}
`;
      const html = `<p>Has recibido un nuevo mensaje en tu buzón de <strong>UDES E-Exchange</strong>.</p>
        <p><strong>Remitente:</strong> ${payload.sender_name || ''} &lt;${payload.sender_email || ''}&gt;</p>
        <p><strong>Universidad:</strong> ${payload.university_representing || ''}</p>
        <p><strong>Motivo:</strong> ${payload.reason || ''}${payload.reason_other ? ` — ${payload.reason_other}` : ''}</p>
        <hr />
        <p>${(payload.message || '').replace(/\n/g, '<br/>')}</p>
        <p style="font-size:12px;color:#666;margin-top:12px">Este correo fue generado automáticamente por UDES E-Exchange.</p>`;

      try {
        await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
        // mark processed
        await supabase.from('mail_queue').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', row.id);
        console.log('Sent mail for', row.id);
      } catch (sendErr) {
        console.error('Failed sending mail for', row.id, sendErr);
        await supabase.from('mail_queue').update({ error: String(sendErr) }).eq('id', row.id);
      }
    }
  } catch (err) {
    console.error('Worker error', err);
  }
}

async function runLoop() {
  while (true) {
    await processBatch();
    // sleep 10s
    await new Promise((r) => setTimeout(r, 10000));
  }
}

runLoop().catch((e) => {
  console.error(e);
  process.exit(1);
});
