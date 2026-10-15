import { appManifest } from '../../lib/pwa-manifest';

export function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get('lang') || 'fr';
  if (lang !== 'fr' && lang !== 'ar')
    return Response.json({ error: 'Langue invalide.' }, { status: 400 });
  return new Response(JSON.stringify(appManifest(lang === 'ar')), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
