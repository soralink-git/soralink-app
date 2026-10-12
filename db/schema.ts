import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),owner:text('owner').notNull().unique(),data:text('data').notNull(),published:integer('published').notNull().default(0),updated:text('updated').notNull(),email:text('email').notNull().default(''),state:text('state').notNull().default('trial'),plan:text('plan').notNull().default('Digital'),expires:text('expires'),proEnabled:integer('pro_enabled').notNull().default(0)});
export const requests=sqliteTable('requests',{id:text('id').primaryKey(),profile:text('profile').notNull(),kind:text('kind').notNull(),name:text('name').notNull(),phone:text('phone').notNull(),message:text('message').notNull(),slot:text('slot'),email:text('email').notNull().default(''),service:text('service').notNull().default(''),duration:integer('duration').notNull().default(30),notificationRevision:integer('notification_revision').notNull().default(0),status:text('status').notNull().default('new'),created:text('created').notNull()});
export const orders=sqliteTable('orders',{id:text('id').primaryKey(),owner:text('owner').notNull(),plan:text('plan').notNull(),status:text('status').notNull().default('pending'),created:text('created').notNull()});
export const bookings=sqliteTable('bookings',{id:text('id').primaryKey(),profile:text('profile').notNull(),slot:text('slot').notNull()},t=>[uniqueIndex('booking_slot').on(t.profile,t.slot)]);
export const audit=sqliteTable('audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),target:text('target').notNull(),created:text('created').notNull()});

export const notifications=sqliteTable('notifications',{
 id:text('id').primaryKey(),profile:text('profile').notNull(),requestId:text('request_id').notNull(),recipient:text('recipient').notNull(),subject:text('subject').notNull(),body:text('body').notNull(),state:text('state').notNull().default('pending'),attempts:integer('attempts').notNull().default(0),created:text('created').notNull(),nextAttempt:text('next_attempt').notNull(),sentAt:text('sent_at'),providerId:text('provider_id'),error:text('error')
},t=>[index('notifications_pending').on(t.state,t.nextAttempt),index('notifications_profile').on(t.profile,t.created)]);

export const mediaAssets=sqliteTable('media_assets',{
 key:text('key').primaryKey(),owner:text('owner').notNull(),bytes:integer('bytes').notNull(),state:text('state').notNull(),created:text('created').notNull()
},t=>[index('media_owner_state').on(t.owner,t.state)]);
