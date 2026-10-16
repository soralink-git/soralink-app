'use client';
import { recordedVideoUrl } from './lib/content-media';
export function catalogVideoSources(d: any) {
  let youtubeId = '';
  try {
    const u = new URL(d.video);
    youtubeId =
      (u.hostname === 'youtu.be'
        ? u.pathname.slice(1)
        : ['youtube.com', 'www.youtube.com'].includes(u.hostname)
          ? u.searchParams.get('v')
          : null) || '';
  } catch {}
  return {
    localVideo: recordedVideoUrl(d.recordedVideo),
    youtubeId: /^[\w-]{11}$/.test(youtubeId) ? youtubeId : '',
  };
}
export default function CatalogVideos({
  data: d,
  ar,
  title,
}: {
  data: any;
  ar: boolean;
  title?: string;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr);
  const { localVideo, youtubeId } = catalogVideoSources(d);
  if (!localVideo && !youtubeId) return null;
  return (
    <section className="catalogue-videos-integrated">
      <h3>{title || t('En vidéo', 'بالفيديو')}</h3>
      {localVideo && (
        <video
          className="content-video"
          src={localVideo}
          controls
          playsInline
          preload="metadata"
          aria-label={t('Vidéo de présentation', 'فيديو للتقديم')}
        >
          {t(
            'Votre navigateur ne prend pas en charge cette vidéo.',
            'المتصفح ديالك ما كيدعمش هاد الفيديو.',
          )}
          <a href={localVideo}>{t('Ouvrir la vidéo', 'حل الفيديو')}</a>
        </video>
      )}
      {/^[\w-]{11}$/.test(youtubeId) && (
        <iframe
          className="video"
          title={t('Vidéo YouTube', 'فيديو يوتيوب')}
          loading="lazy"
          src={'https://www.youtube-nocookie.com/embed/' + youtubeId}
          allowFullScreen
        />
      )}
    </section>
  );
}
