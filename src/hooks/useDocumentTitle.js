import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Letras de Paz';
const SITE_URL = 'https://letrasdepaz.com';
const DEFAULT_DESCRIPTION = 'Un espacio íntimo para la poesía. Descubre versos que conmueven, inspiran y transforman.';
const DEFAULT_IMAGE = `${SITE_URL}/assets/Logo_Letras_de_Paz.png`;

function setMetaContent(selector, content) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

// Sets the document title plus the meta description, canonical link, and Open Graph/Twitter
// tags that index.html declares as defaults — so each page (and each poem) is described
// accurately to search engines and link previews, not just shown the homepage's generic copy.
export function useDocumentTitle(title, options = {}) {
  const { description = DEFAULT_DESCRIPTION, image = DEFAULT_IMAGE, noindex = false } = options;
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    const url = `${SITE_URL}${location.pathname}`;

    document.title = fullTitle;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', url);
    setMetaContent('meta[property="og:image"]', image);
    setMetaContent('meta[name="twitter:title"]', fullTitle);
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[name="twitter:image"]', image);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);

    // Utility/account pages (login, admin, profile...) have no SEO value and shouldn't
    // compete with the poems for crawl budget or show up in search results.
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.remove();
    }
  }, [title, description, image, noindex, location.pathname]);
}
