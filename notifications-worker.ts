import { sendPending, type MailEnv } from './app/lib/notifications';

// Deploy separately from Pages, binding DB to the same D1 database.
export default {
  async scheduled(_event: ScheduledController, env: MailEnv) {
    await sendPending(env);
  },
} satisfies ExportedHandler<MailEnv>;
