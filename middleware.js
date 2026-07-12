import { next, rewrite } from '@vercel/edge';

// Known social/link-preview crawlers. Real browsers never match this, so normal
// visitors always get the untouched SPA — only these bots get the static OG HTML.
const BOT_PATTERN = /facebookexternalhit|Facebot|Twitterbot|Slackbot|TelegramBot|WhatsApp|Discordbot|LinkedInBot|Pinterest|redditbot|Googlebot|bingbot|Applebot/i;

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  if (url.pathname.startsWith('/poema/') && BOT_PATTERN.test(userAgent)) {
    const poemId = url.pathname.slice('/poema/'.length);
    const ogUrl = new URL('/api/poem-og', url);
    ogUrl.searchParams.set('id', poemId);
    return rewrite(ogUrl);
  }

  return next();
}

export const config = {
  matcher: '/poema/:path*',
};
