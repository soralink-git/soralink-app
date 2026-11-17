export default function RouteLoading({ overlay = false }: { overlay?: boolean }) {
  const Container = overlay ? 'div' : 'main';
  return (
    <Container
      id={overlay ? undefined : 'main-content'}
      tabIndex={-1}
      className={'route-loading' + (overlay ? ' route-loading-overlay' : '')}
      role="status"
      aria-label="SoraLink"
    >
      <span className="route-loading-spinner" aria-hidden="true" />
      <span dir="ltr">SoraLink</span>
      <span className="sr-only" lang="fr">
        Chargement de la page…
      </span>
      <span className="sr-only" lang="ar">
        كنحمّلو الصفحة…
      </span>
    </Container>
  );
}
