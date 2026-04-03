const express = require('express');
const router = express.Router();
const User = require('../models/User');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';
const FRONTEND = process.env.FRONTEND_URL || API_BASE;

router.get('/sitemap.xml', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('username updatedAt').lean();
    const urls = [
      { loc: `${FRONTEND}/`, changefreq: 'weekly', priority: 1.0 },
      ...users.map(u => ({
        loc: `${FRONTEND}/${encodeURIComponent(u.username)}`,
        lastmod: new Date(u.updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.8
      }))
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      urls.map(u => `\n  <url>` +
        `\n    <loc>${u.loc}</loc>` +
        (u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '') +
        (u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : '') +
        (u.priority ? `\n    <priority>${u.priority}</priority>` : '') +
        `\n  </url>`).join('') +
      `\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.send(body);
  } catch (e) {
    res.status(500).send('Failed to generate sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const sitemapUrl = `${API_BASE}/sitemap.xml`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`);
});

module.exports = router;
