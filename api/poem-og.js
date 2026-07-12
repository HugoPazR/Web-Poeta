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

async function fetchPoem(poemId) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/poems/${encodeURIComponent(poemId)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return {
    title: data.fields?.title?.stringValue,
    excerpt: data.fields?.excerpt?.stringValue,
  };
}

export default async function handler(req, res) {
  const { id } = req.query;
  const origin = `https://${req.headers.host}`;
  const pageUrl = `${origin}/poema/${encodeURIComponent(id || '')}`;
  const imageUrl = `${origin}/assets/Logo_Letras_de_Paz.png`;

  let poem = null;
  if (id) {
    try {
      poem = await fetchPoem(id);
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
