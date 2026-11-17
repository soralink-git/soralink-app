export type FieldValidity = Pick<
  ValidityState,
  | 'valueMissing'
  | 'typeMismatch'
  | 'tooShort'
  | 'tooLong'
  | 'patternMismatch'
  | 'rangeUnderflow'
  | 'rangeOverflow'
  | 'stepMismatch'
  | 'badInput'
  | 'valid'
>;

export function fieldFeedback(
  field: { validity: FieldValidity; type?: string; minLength?: number; min?: string; max?: string },
  ar: boolean,
  confirmationMatches = true,
): string {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const v = field.validity;
  if (v.valueMissing) return t('Renseignez ce champ pour continuer.', 'عمّر هاد الخانة باش تكمل.');
  if (v.typeMismatch)
    return field.type === 'email'
      ? t(
          'Saisissez une adresse e-mail complète, par exemple vous@exemple.ma.',
          'كتب إيميل كامل، مثلا vous@exemple.ma.',
        )
      : t(
          'Saisissez une adresse complète, par exemple https://exemple.ma.',
          'كتب رابط كامل، مثلا https://exemple.ma.',
        );
  if (v.tooShort)
    return t(
      `Saisissez au moins ${field.minLength} caractères.`,
      `كتب على الأقل ${field.minLength} حروف ورموز.`,
    );
  if (v.tooLong)
    return t(
      'Raccourcissez ce texte pour respecter la limite indiquée.',
      'قصّر هاد النص باش ما تفوتش الحد المسموح.',
    );
  if (v.rangeUnderflow)
    return t(
      `Saisissez une valeur supérieure ou égale à ${field.min}.`,
      `دخل قيمة أكبر من ولا كتساوي ${field.min}.`,
    );
  if (v.rangeOverflow)
    return t(
      `Saisissez une valeur inférieure ou égale à ${field.max}.`,
      `دخل قيمة أقل من ولا كتساوي ${field.max}.`,
    );
  if (v.stepMismatch || v.badInput)
    return t(
      'Saisissez une valeur numérique valide dans le format demandé.',
      'دخل رقم صحيح بالصيغة المطلوبة.',
    );
  if (v.patternMismatch)
    return t(
      'Respectez le format indiqué à côté de ce champ.',
      'تبع الصيغة الموضحة حدا هاد الخانة.',
    );
  if (!confirmationMatches)
    return t('Retapez exactement le même mot de passe.', 'عاود كتب نفس كلمة السر بالضبط.');
  return '';
}
