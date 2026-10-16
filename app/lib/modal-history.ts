// Give a modal its own history entry so Android Back closes it, even in a PWA.
export function modalHistory(onClose: () => void, target: Window = window) {
  const token = crypto.randomUUID();
  let owned = true;
  const current = () => target.history.state?.soralinkModal === token;
  target.history.pushState(
    { ...target.history.state, soralinkModal: token },
    '',
    target.location.href,
  );
  const pop = () => {
    owned = false;
    onClose();
  };
  target.addEventListener('popstate', pop);
  const release = () => {
    if (owned && current()) target.history.back();
    owned = false;
  };
  return {
    close() {
      release();
      onClose();
    },
    dispose() {
      target.removeEventListener('popstate', pop);
      release();
    },
  };
}
