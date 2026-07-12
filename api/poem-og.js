// Vercel serverless function. Only hit via middleware.js, and only for known
// social-media/crawler user agents requesting /poema/:id — real visitors always get
// the normal SPA. Returns static HTML with Open Graph tags so link previews (WhatsApp,
// Twitter/X, Facebook, Slack, etc.) show the poem's own title/excerpt instead of the
// site's generic ones, since those crawlers don't execute JavaScript.

const FIREBASE_PROJECT_ID = 'letras-de-paz';
const SITE_NAME = 'Letras de Paz';
const DEFAULT_DESCRIPTION = 'Un espacio íntimo para la poesía. Descubre versos que conmueven, inspiran y transforman.';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

// The route param is a slug, not the Firestore doc ID, so the poem has to be found by
// listing the (small) poems collection rather than fetched by ID directly.
async function fetchPoemBySlug(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/poems`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  for (const doc of data.documents || []) {
    const title = doc.fields?.title?.stringValue;
    const storedSlug = doc.fields?.slug?.stringValue;
    if (title && (storedSlug === slug || slugify(title) === slug)) {
      return { title, excerpt: doc.fields?.excerpt?.stringValue };
    }
  }
  return null;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const origin = `https://${req.headers.host}`;
  const pageUrl = `${origin}/poema/${encodeURIComponent(id || '')}`;
  const imageUrl = `${origin}/assets/Logo_Letras_de_Paz.png`;

  let poem = null;
  if (id) {
    try {
      poem = await fetchPoemBySlug(id);
    } catch {
      poem = null;
    }
  }

  const title = poem?.title ? `${poem.title} — ${SITE_NAME}` : SITE_NAME;
  const description = poem?.excerpt || DEFAULT_DESCRIPTION;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<a href="${escapeHtml(pageUrl)}">Leer el poema completo</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
