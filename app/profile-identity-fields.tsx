'use client';
import type { Dispatch, SetStateAction } from 'react';
import { profileKind } from './lib/profile-identity';
export default function ProfileIdentityFields({
  data,
  setData,
  ar,
  busy,
}: {
  data: any;
  setData: Dispatch<SetStateAction<any>>;
  ar: boolean;
  busy: boolean;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr);
  const business = profileKind(data) === 'business';
  const input = (key: string, label: string, required = false) => (
    <label className="field" key={key}>
      {label}
      <input
        value={data[key] || ''}
        disabled={busy}
        required={required}
        maxLength={key === 'business' && !business ? 4000 : 120}
        autoComplete={
          key === 'name' ? 'name' : key === 'business' ? 'organization' : 'organization-title'
        }
        onChange={(e) => {
          const value = e.target.value;
          setData((d: any) => ({ ...d, [key]: value }));
        }}
      />
    </label>
  );
  return (
    <>
      <label className="field">
        {t('La carte représente', 'البطاقة كتمثّل')}
        <select
          value={profileKind(data)}
          disabled={busy}
          onChange={(e) => {
            const profileType = e.target.value;
            setData((d: any) => ({ ...d, profileType }));
          }}
        >
          <option value="person">{t('Un professionnel', 'مهني')}</option>
          <option value="business">
            {t('Un établissement / une entreprise', 'محل ولا مقاولة')}
          </option>
        </select>
      </label>
      <p className="hint">
        {business
          ? t(
              'Le nom de l’établissement apparaît en premier. Le nom du contact est facultatif et sera visible si vous le renseignez.',
              'اسم المحل كيبان هو الأول. اسم المسؤول اختياري وكيبان إلا عمّرتيه.',
            )
          : t(
              'Votre nom apparaît en premier. Le nom de l’entreprise est facultatif.',
              'الاسم ديالك كيبان هو الأول. اسم المقاولة اختياري.',
            )}
      </p>
      <div className="form-grid">
        {business ? (
          <>
            {input('business', t('Nom de l’établissement *', 'اسم المحل ولا المقاولة *'), true)}
            {input('job', t('Activité / spécialité', 'النشاط ولا التخصص'))}
            {input('name', t('Nom du contact (facultatif)', 'اسم المسؤول (اختياري)'))}
          </>
        ) : (
          <>
            {input('name', t('Nom complet *', 'الاسم الكامل *'), true)}
            {input('job', t('Profession', 'المهنة'))}
            {input('business', t('Entreprise / cabinet', 'المقاولة / المكتب'))}
          </>
        )}
      </div>
    </>
  );
}
