'use client';
import { useEffect, useId, useState } from 'react';
import { Download } from 'lucide-react';
import { manifestPath } from './lib/pwa-manifest';
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function Pwa({ ar = false }: { ar?: boolean }) {
  const helpId = useId();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false),
    [help, setHelp] = useState(false),
    [ios, setIos] = useState(false);
  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifest) manifest.setAttribute('href', manifestPath(ar));
    try {
      localStorage.setItem('soralink_language', ar ? 'ar' : 'fr');
    } catch {}
  }, [ar]);
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const check = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    check();
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
    const offer = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
      setHelp(false);
    };
    window.addEventListener('beforeinstallprompt', offer);
    window.addEventListener('appinstalled', done);
    media.addEventListener('change', check);
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', offer);
      window.removeEventListener('appinstalled', done);
      media.removeEventListener('change', check);
    };
  }, []);
  if (installed) return null;
  const t = (fr: string, darija: string) => (ar ? darija : fr);
  return (
    <div className="pwa-install">
      <button
        type="button"
        className="secondary small"
        aria-expanded={help}
        aria-controls={help ? helpId : undefined}
        onClick={async () => {
          if (!prompt) {
            setHelp(!help);
            return;
          }
          try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            setPrompt(null);
            if (choice.outcome === 'accepted') setHelp(false);
          } catch {
            setPrompt(null);
            setHelp(true);
          }
        }}
      >
        <Download size={18} />
        {t('Installer SoraLink', 'ثبّت SoraLink')}
      </button>
      {help && (
        <p role="status" id={helpId}>
          {ios
            ? t(
                'Sur iPhone : ouvrez ce site dans Safari, touchez Partager, puis « Sur l’écran d’accueil » et Ajouter.',
                'فالآيفون: حل هاد الموقع فـ Safari، ضغط على مشاركة، ومن بعد «إضافة إلى الشاشة الرئيسية».',
              )
            : t(
                'Sur PC : ouvrez ce site dans Chrome ou Edge, puis utilisez l’icône d’installation dans la barre d’adresse ou le menu « Installer cette application ». Sur Android : menu Chrome → « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option manque, actualisez la page.',
                'فالكمبيوتر: حل الموقع فـ Chrome أو Edge وضغط على أيقونة التثبيت فشريط العنوان أو الاختيار ديال تثبيت التطبيق فالقائمة. فأندرويد: قائمة Chrome ثم تثبيت التطبيق أو إضافة للشاشة الرئيسية. إلا ما بانش الاختيار، حدّث الصفحة.',
              )}
        </p>
      )}
    </div>
  );
}
