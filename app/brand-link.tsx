export default function BrandLink({ ar = false }: { ar?: boolean }) {
  return (
    <a
      className="brand"
      dir="ltr"
      href={'/?lang=' + (ar ? 'ar' : 'fr')}
      aria-label={ar ? 'SoraLink — الرئيسية' : 'SoraLink — Accueil'}
    >
      <span className="brand-icon">
        <svg width="25" height="25" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path
            d="M23 17h-5a10 10 0 0 0-10 10v10a10 10 0 0 0 10 10h11M41 17h5a10 10 0 0 1 10 10v10a10 10 0 0 1-10 10H35M24 38l16-12"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      Sora<span>Link</span>
    </a>
  );
}
