export default function RouteLoading({ overlay = false }: { overlay?: boolean }) {
  return (
    <main
      className={'route-loading' + (overlay ? ' route-loading-overlay' : '')}
      role="status"
      aria-label="SoraLink"
    >
      <span className="route-loading-spinner" aria-hidden="true" />
      <span dir="ltr">SoraLink</span>
    </main>
  );
}
