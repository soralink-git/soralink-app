const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const { openModalDialog } = load(path.resolve('app/lib/dialog-lifecycle.ts'));
const { saveFeedback } = load(path.resolve('app/lib/save-feedback.ts'));

test('opening and dismissing a modal restores scrolling and the connected trigger focus', () => {
  let focused = 0;
  const document = {
    body: { style: { overflow: 'auto' } },
    activeElement: {
      isConnected: true,
      focus() {
        focused++;
      },
    },
  };
  const dialog = {
    ownerDocument: document,
    open: false,
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
  };
  const dispose = openModalDialog(dialog);
  assert(dialog.open);
  assert.equal(document.body.style.overflow, 'hidden');
  dispose();
  assert.equal(dialog.open, false);
  assert.equal(document.body.style.overflow, 'auto');
  assert.equal(focused, 1);
  document.activeElement.isConnected = false;
  openModalDialog(dialog)();
  assert.equal(focused, 1, 'a removed trigger must not receive focus');
});

test('a failure to open a dialog never locks page scrolling', () => {
  const document = { body: { style: { overflow: 'auto' } }, activeElement: null };
  assert.throws(() =>
    openModalDialog({
      ownerDocument: document,
      showModal() {
        throw Error('not connected');
      },
    }),
  );
  assert.equal(document.body.style.overflow, 'auto');
});

test('save feedback distinguishes pending, successful, failed and conflicting writes in both languages', () => {
  for (const ar of [false, true]) {
    const messages = [
      'ready',
      'pending',
      'saving',
      'saved',
      'offline',
      'invalid',
      'error',
      'conflict',
    ].map((status) => saveFeedback({ status, dirty: status !== 'saved' }, ar).message);
    assert.equal(new Set(messages).size, messages.length);
    assert.match(
      saveFeedback({ status: 'conflict', dirty: true }, ar).label,
      ar ? /حمّل/ : /Recharger/,
    );
    assert.equal(
      saveFeedback({ status: 'error', dirty: true, error: 'Connection interrupted' }, ar).message,
      'Connection interrupted',
    );
  }
});

test('public demo offers an exit and signup path, a single primary heading and a language choice', () => {
  const PublicCard = load(path.resolve('app/public-card-view.tsx')).default;
  const { demoCard, demoCardArabic } = load(path.resolve('app/lib/demo-card.ts'));
  for (const ar of [false, true]) {
    const html = render(PublicCard, {
      initialData: demoCard,
      demoArabic: demoCardArabic,
      initialAr: ar,
    });
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /id="main-content"/);
    assert.match(html, /class="demo-guidance"/);
    assert.match(html, ar ? /مثال — تجربة تفاعلية/ : /Exemple — Démo interactive/);
    assert.match(
      html,
      ar ? /href="\/\?lang=ar">الرجوع للرئيسية<\/a>/ : /href="\/\?lang=fr">Retour à l’accueil<\/a>/,
    );
    assert.match(html, /href="\/auth\?mode=signup/);
    assert.match(html, ar ? /لا رسالة لا طلب كيتسيفط/ : /aucun message ni commande n’est envoyé/);
    assert.match(html, /class="text-button public-language-toggle"/);
  }
});

test('signup exposes its three steps and keeps the selected pack in both languages', () => {
  const Auth = load(path.resolve('app/auth/ui.tsx')).default;
  for (const ar of [false, true]) {
    const html = render(Auth, {
      initialMode: 'signup',
      initialArabic: ar,
      initialOffer: 'Catalogue',
    });
    assert.match(html, /class="auth-steps"/);
    assert.equal((html.match(/aria-current="step"/g) || []).length, 1);
    assert.match(html, /id="main-content"/);
    assert.match(html, /name="confirm"/);
    assert.match(html, ar ? /أكّد الإيميل/ : /Confirmer l’e-mail/);
    assert.match(html, ar ? /العرض اللي اخترتي/ : /Offre choisie/);
  }
});

test('all request forms use native modal semantics and keep busy submission controls disabled', () => {
  const PublicRequest = load(path.resolve('app/public-request-modal.tsx')).default;
  const { demoCard } = load(path.resolve('app/lib/demo-card.ts'));
  for (const kind of ['contact', 'rdv', 'commande', 'devis']) {
    const html = render(PublicRequest, {
      kind,
      data: demoCard,
      id: 'card',
      selectedItem: null,
      ar: false,
      onClose() {},
      onMessage() {},
    });
    assert.match(html, /<dialog\b[^>]*aria-modal="true"/);
    assert.match(html, /<form[^>]*aria-busy="false"/);
  }
});
