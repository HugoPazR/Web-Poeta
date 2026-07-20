// Vercel serverless function. Generates sitemap.xml on the fly from the poems stored in
// Firestore — this is a client-rendered SPA, so there's no build-time list of poem URLs to
// write a static sitemap from. Reachable via the friendly /sitemap.xml path (see vercel.json).

const FIREBASE_PROJECT_ID = 'letras-de-paz';
const SITE_URL = 'https://letrasdepaz.com';

// Keep in sync with src/utils/slug.js — poems published before the slug field existed
// don't have one stored, so their URL slug is derived from the title on the fly.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function fetchPoems() {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/poems`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.documents || []).map((doc) => {
    const fields = doc.fields || {};
    const title = fields.title?.stringValue || '';
    return {
      slug: fields.slug?.stringValue || slugify(title),
      date: fields.date?.stringValue || null,
    };
  });
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export default async function handler(req, res) {
  let poems = [];
  try {
    poems = await fetchPoems();
  } catch {
    /* keep the static pages in the sitemap even if the poems fetch fails */
  }

  const entries = [
    urlEntry(`${SITE_URL}/`, null, 'daily', '1.0'),
    urlEntry(`${SITE_URL}/sobre-mi`, null, 'monthly', '0.5'),
    urlEntry(`${SITE_URL}/contacto`, null, 'monthly', '0.3'),
    ...poems
      .filter((p) => p.slug)
      .map((p) => urlEntry(`${SITE_URL}/poema/${encodeURIComponent(p.slug)}`, p.date, 'monthly', '0.8')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
