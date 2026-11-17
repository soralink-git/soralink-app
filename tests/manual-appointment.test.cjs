const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const Modal = load(path.resolve('app/manual-appointment-modal.tsx')).default;

for (const ar of [false, true]) {
  test(`manual appointment keeps its required fields and local time (${ar ? 'ar' : 'fr'})`, () => {
    const html = renderToStaticMarkup(
      React.createElement(Modal, {
        data: {
          name: 'Atelier',
          appointmentServices: [{ name: 'Consultation', duration: 45 }],
        },
        ar,
        busy: true,
        serviceIndex: 0,
        setServiceIndex() {},
        onClose() {},
        async onSubmit() {},
      }),
    );
    assert.match(html, ar ? /زيد موعد مؤكد/ : /Ajouter un rendez-vous confirmé/);
    for (const name of ['name', 'phone', 'slot']) {
      const input = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0];
      assert(input?.includes('required'), `${name} must remain required`);
    }
    assert.match(html, /type="datetime-local"/);
    assert.match(html, /Consultation · 45 min/);
    assert.match(html, /<textarea[^>]*maxLength="2000"/);
    assert.match(html, /<button[^>]*class="primary full"[^>]*disabled/);
  });
}
