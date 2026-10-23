import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull().unique(),
  data: text('data').notNull(),
  published: integer('published').notNull().default(0),
  updated: text('updated').notNull(),
  email: text('email').notNull().default(''),
  state: text('state').notNull().default('trial'),
  plan: text('plan').notNull().default('Identite'),
  expires: text('expires'),
  proEnabled: integer('pro_enabled').notNull().default(0),
  catalogRights: text('catalog_rights'),
  clientAccess: text('client_access'),
});
export const requests = sqliteTable(
  'requests',
  {
    id: text('id').primaryKey(),
    profile: text('profile').notNull(),
    kind: text('kind').notNull(),
    language: text('language').notNull().default('fr'),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    message: text('message').notNull(),
    slot: text('slot'),
    email: text('email').notNull().default(''),
    service: text('service').notNull().default(''),
    duration: integer('duration').notNull().default(30),
    notificationRevision: integer('notification_revision').notNull().default(0),
    status: text('status').notNull().default('new'),
    created: text('created').notNull(),
  },
  (t) => [
    index('requests_profile_created').on(t.profile, t.created),
    index('requests_profile_phone_created').on(t.profile, t.phone, t.created),
  ],
);
export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    plan: text('plan').notNull(),
    kind: text('kind').notNull().default('purchase'),
    amount: integer('amount'),
    applied: text('applied'),
    status: text('status').notNull().default('pending'),
    created: text('created').notNull(),
  },
  (t) => [index('orders_owner_created').on(t.owner, t.created)],
);
export const bookings = sqliteTable(
  'bookings',
  { id: text('id').primaryKey(), profile: text('profile').notNull(), slot: text('slot').notNull() },
  (t) => [uniqueIndex('booking_slot').on(t.profile, t.slot)],
);
export const audit = sqliteTable('audit', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target').notNull(),
  created: text('created').notNull(),
});

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    profile: text('profile').notNull(),
    requestId: text('request_id').notNull(),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    state: text('state').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    created: text('created').notNull(),
    nextAttempt: text('next_attempt').notNull(),
    sentAt: text('sent_at'),
    providerId: text('provider_id'),
    error: text('error'),
  },
  (t) => [
    index('notifications_pending').on(t.state, t.nextAttempt),
    index('notifications_profile').on(t.profile, t.created),
  ],
);

export const mediaAssets = sqliteTable(
  'media_assets',
  {
    key: text('key').primaryKey(),
    owner: text('owner').notNull(),
    bytes: integer('bytes').notNull(),
    state: text('state').notNull(),
    created: text('created').notNull(),
  },
  (t) => [index('media_owner_state').on(t.owner, t.state)],
);

export const profileMedia = sqliteTable(
  'profile_media',
  {
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mediaKey: text('media_key').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.mediaKey] }),
    index('profile_media_key').on(t.mediaKey),
  ],
);

export const profileAddresses = sqliteTable(
  'profile_addresses',
  {
    name: text('name').primaryKey(),
    profile: text('profile')
      .notNull()
      .references(() => profiles.id),
    isCurrent: integer('is_current').notNull().default(1),
    created: text('created').notNull(),
  },
  (t) => [
    uniqueIndex('profile_current_address')
      .on(t.profile)
      .where(sql`${t.isCurrent}=1`),
    index('profile_address_history').on(t.profile),
  ],
);

export const appSessions = sqliteTable(
  'app_sessions',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    expires: integer('expires').notNull(),
  },
  (t) => [index('app_sessions_expiry').on(t.expires)],
);

export const catalogOrderIntents = sqliteTable(
  'catalog_order_intents',
  {
    id: text('id').primaryKey(),
    profile: text('profile')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    requestId: text('request_id').notNull(),
    payloadHash: text('payload_hash').notNull(),
    visitorHash: text('visitor_hash').notNull(),
    created: text('created').notNull(),
  },
  (t) => [
    index('catalog_intents_profile_created').on(t.profile, t.created),
    index('catalog_intents_visitor_created').on(t.visitorHash, t.created),
  ],
);
export const profileMetrics = sqliteTable(
  'profile_metrics',
  {
    profile: text('profile')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    source: text('source').notNull(),
    visits: integer('visits').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.profile, t.day, t.source] })],
);
export const profileMetricSeen = sqliteTable(
  'profile_metric_seen',
  {
    id: text('id').primaryKey(),
    profile: text('profile')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    created: text('created').notNull(),
  },
  (t) => [index('metric_seen_created').on(t.created)],
);
export const paymentReceipts = sqliteTable(
  'payment_receipts',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    owner: text('owner').notNull(),
    objectKey: text('object_key').notNull().unique(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull(),
    created: text('created').notNull(),
  },
  (t) => [
    index('receipts_order_created').on(t.orderId, t.created),
    index('receipts_owner_created').on(t.owner, t.created),
  ],
);
