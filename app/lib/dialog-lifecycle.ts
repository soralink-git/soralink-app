export function openModalDialog(element: HTMLDialogElement) {
  const document = element.ownerDocument;
  const previous = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  element.showModal();
  document.body.style.overflow = 'hidden';
  return () => {
    if (element.open) element.close();
    document.body.style.overflow = overflow;
    if (previous?.isConnected) previous.focus();
  };
}
