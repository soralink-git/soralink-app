const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { normalizeSchedule, availableSlots } = load(path.resolve('app/lib/schedule.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
test('an explicitly removed pause and final appointment type stay empty while absent legacy settings keep defaults', () => {
  const input = {
    name: 'Owner',
    hours: { 1: ['09:00', '17:00'] },
    breakStart: '',
    breakEnd: '',
    appointmentServices: [],
  };
  assert.equal(profileDataSchema.safeParse(input).success, true);
  const next = normalizeSchedule(JSON.parse(JSON.stringify(input)));
  assert.equal(next.breakStart, '');
  assert.equal(next.breakEnd, '');
  assert.equal(next.appointmentServices.length, 0);
  assert.equal(normalizeSchedule({}).breakStart, '12:00');
  assert.equal(normalizeSchedule({}).breakEnd, '14:00');
  const now = new Date('2026-10-18T09:00:00Z');
  assert(availableSlots(next, '2026-10-19', 30, [], now).includes('2026-10-19T13:00'));
  assert(
    !availableSlots(
      { ...next, breakStart: '12:00', breakEnd: '14:00' },
      '2026-10-19',
      30,
      [],
      now,
    ).includes('2026-10-19T13:00'),
  );
});
test('last-item removal remains authoritative for catalogue, links and media in the public card', () => {
  const empty = {
    name: 'Owner',
    avatar: '',
    cover: '',
    backgroundPhoto: '',
    photos: [],
    video: '',
    recordedVideo: '',
    pdf: '',
    catalogDocuments: [],
    catalogCategories: [],
    services: [],
    promotions: [],
    profileLinks: [],
    appointmentServices: [],
  };
  const parsed = profileDataSchema.parse(empty);
  const out = publicCardData(parsed, true);
  for (const key of [
    'photos',
    'catalogDocuments',
    'catalogCategories',
    'services',
    'promotions',
    'profileLinks',
    'appointmentServices',
  ])
    assert.equal(out[key].length, 0);
  for (const key of ['avatar', 'cover', 'backgroundPhoto', 'video', 'recordedVideo', 'pdf'])
    assert.equal(out[key], '');
});

test('clearing all closure dates or leaving a trailing blank line saves an empty or valid list', () => {
  const empty = profileDataSchema.parse({ name: 'Owner', closures: ['', '  '] });
  assert.equal(empty.closures.length, 0);
  const single = profileDataSchema.parse({ name: 'Owner', closures: ['2026-10-20', ''] });
  assert.equal(single.closures.join(','), '2026-10-20');
  assert.equal(
    profileDataSchema.safeParse({ name: 'Owner', closures: ['invalid'] }).success,
    false,
  );
});
