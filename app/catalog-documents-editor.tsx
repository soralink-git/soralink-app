'use client';
import type { Dispatch, JSX, SetStateAction } from 'react';
import { catalogDocuments, catalogText } from './lib/catalog-menu';
import PdfCatalogue from './pdf-catalogue';

import type { catalogRights } from './lib/catalog-menu';
export default function CatalogDocumentsEditor({
  locked,
  rights,
  t,
  docs,
  expandedDoc,
  setExpandedDoc,
  ar,
  moves,
  input,
  language,
  updateDoc,
  media,
  toggle,
  run,
  send,
  setPreview,
  preview,
  setData,
}: {
  locked: boolean;
  rights: ReturnType<typeof catalogRights>;
  t: (fr: string, arabic: string) => string;
  docs: ReturnType<typeof catalogDocuments>;
  expandedDoc: string;
  setExpandedDoc: Dispatch<SetStateAction<string>>;
  ar: boolean;
  moves: (key: string, i: number, count: number) => JSX.Element;
  input: (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options?: any,
  ) => JSX.Element;
  language: 'Fr' | 'Ar';
  updateDoc: (id: string, key: string, value: any) => void;
  media: (
    src: string,
    set: (v: string) => void,
    disabled?: boolean,
    thumbnail?: ((v: string) => void) | undefined,
    purpose?: string,
  ) => JSX.Element;
  toggle: (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    disabled?: boolean,
  ) => JSX.Element;
  run: (fn: () => Promise<void>) => Promise<void>;
  send: (file: File, purpose?: string) => Promise<string>;
  setPreview: Dispatch<SetStateAction<string>>;
  preview: string;
  setData: Dispatch<any>;
}) {
  return (
    <fieldset disabled={locked || !rights.enabled || !rights.pdf}>
      <legend>{t('Documents PDF', 'الوثائق')}</legend>
      <p className="hint">
        {t(
          `${docs.length}/${rights.maxDocuments} documents · ${rights.pdfMB} Mo et ${rights.pdfPages} pages par document`,
          `${docs.length}/${rights.maxDocuments} وثائق · ${rights.pdfMB} ميغابايت و${rights.pdfPages} صفحة لكل وثيقة`,
        )}
      </p>
      {docs.map((doc, i) => (
        <details
          className="catalogue-editor"
          key={doc.id}
          open={expandedDoc === doc.id}
          onToggle={(e) => {
            const open = e.currentTarget.open;
            setExpandedDoc((current) => (open ? doc.id : current === doc.id ? '' : current));
          }}
        >
          <summary>
            {catalogText(doc.titleFr, doc.titleAr, ar, true) ||
              t('Nouveau document', 'وثيقة جديدة')}
          </summary>
          <div className="panel-title">
            <h3>
              {t('Document', 'وثيقة')} {i + 1}
            </h3>
            {moves('catalogDocuments', i, docs.length)}
          </div>
          {input(
            t('Titre', 'العنوان'),
            language === 'Fr' ? doc.titleFr : doc.titleAr,
            (v) => updateDoc(doc.id, 'title' + language, v),
            {
              maxLength: 120,
              lang: language.toLowerCase(),
              dir: language === 'Ar' ? 'rtl' : 'ltr',
            },
          )}
          <details className="catalog-options">
            <summary>
              {t('Description, couverture et téléchargement', 'الوصف والغلاف والتحميل')}
            </summary>
            {[language].map((lang) => (
              <label className="field" key={lang}>
                {lang === 'Fr'
                  ? t('Description en français', 'الوصف بالفرنسية')
                  : t('Description en arabe', 'الوصف بالعربية')}
                <textarea
                  maxLength={800}
                  lang={lang === 'Fr' ? 'fr' : 'ar'}
                  dir={lang === 'Fr' ? 'ltr' : 'rtl'}
                  value={doc[('description' + lang) as 'descriptionFr']}
                  onChange={(e) => updateDoc(doc.id, 'description' + lang, e.target.value)}
                />
              </label>
            ))}
            {media(
              doc.cover,
              (v) => updateDoc(doc.id, 'cover', v),
              false,
              undefined,
              'catalog-cover',
            )}
            {toggle(t('Document visible', 'الوثيقة ظاهرة'), doc.visible, (v) =>
              updateDoc(doc.id, 'visible', v),
            )}
            {toggle(
              t('Autoriser le téléchargement volontaire', 'السماح بتحميل الملف'),
              doc.allowDownload,
              (v) => updateDoc(doc.id, 'allowDownload', v),
              !rights.downloads,
            )}
          </details>
          <label className="field">
            {t('Remplacer le PDF (adresse conservée)', 'تبديل الملف مع الحفاظ على الرابط')}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                e.currentTarget.value = '';
                if (file)
                  void run(async () => updateDoc(doc.id, 'src', await send(file, 'catalog-pdf')));
              }}
            />
          </label>
          <div className="catalog-actions">
            <button type="button" onClick={() => setPreview(preview === doc.id ? '' : doc.id)}>
              {t('Prévisualiser', 'معاينة')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    t(
                      'Supprimer ce document ? La suppression sera enregistrée automatiquement.',
                      'واش بغيتي تحذف هاد الوثيقة؟ الحذف غادي يتسجّل تلقائياً.',
                    ),
                  )
                )
                  setData((d: any) => ({
                    ...d,
                    pdf: '',
                    catalogDocuments: catalogDocuments(d).filter((p) => p.id !== doc.id),
                  }));
              }}
            >
              {t('Supprimer', 'حذف')}
            </button>
          </div>
          {preview === doc.id && <PdfCatalogue src={doc.src} ar={ar} />}
        </details>
      ))}
      <label className="field">
        {t('Importer un ou plusieurs PDF', 'استيراد ملف واحد أو أكثر')}
        <input
          type="file"
          multiple
          accept="application/pdf"
          disabled={locked || docs.length >= rights.maxDocuments}
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files || []);
            e.currentTarget.value = '';
            void run(async () => {
              if (docs.length + files.length > rights.maxDocuments)
                throw Error(
                  t('Nombre maximal de documents atteint.', 'وصلتي للحد الأقصى ديال الوثائق.'),
                );
              for (const file of files) {
                const src = await send(file, 'catalog-pdf');
                const doc = {
                  id: crypto.randomUUID(),
                  src,
                  titleFr: '',
                  titleAr: '',
                  descriptionFr: '',
                  descriptionAr: '',
                  cover: '',
                  visible: true,
                  allowDownload: false,
                };
                setData((d: any) => ({
                  ...d,
                  pdf: '',
                  catalogDocuments: [...catalogDocuments(d), doc],
                }));
                setExpandedDoc(doc.id);
              }
            });
          }}
        />
      </label>
    </fieldset>
  );
}
