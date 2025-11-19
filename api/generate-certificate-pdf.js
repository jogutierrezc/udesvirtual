// Vercel serverless function (Node)
// POST JSON body: { html: string, format?: { widthMm?: number, heightMm?: number } }
// Returns: application/pdf

const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Only POST supported');
  }

  const { html, format } = req.body || {};
  if (!html) return res.status(400).send('Missing html in body');

  try {
    // Launch puppeteer. For Vercel serverless, run without sandbox flags.
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    // Set content and wait
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // PDF options: letter landscape is default for certificate
    const pdfOptions = {
      printBackground: true,
      landscape: true,
      format: 'letter'
    };

    // Override if custom mm passed
    if (format && (format.widthMm || format.heightMm)) {
      pdfOptions.width = (format.widthMm || 279.4) + 'mm';
      pdfOptions.height = (format.heightMm || 215.9) + 'mm';
    }

    const buffer = await page.pdf(pdfOptions);
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: error.message || String(error) });
  }
};
