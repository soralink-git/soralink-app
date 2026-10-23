import { sendPending, type MailEnv } from './app/lib/notifications';

// Deploy separately from Pages, binding DB to the same D1 database.
export default {
  async fetch(request: Request, env: MailEnv) {
    const url = new URL(request.url);
    // This Worker has no public route: only a same-account service binding can invoke it.
    if (
      request.method !== 'POST' ||
      url.hostname !== 'notifications.internal' ||
      url.pathname !== '/dispatch'
    )
      return new Response(null, { status: 404 });
    await sendPending(env, fetch, 1);
    return new Response(null, { status: 204 });
  },
  async scheduled(_event: ScheduledController, env: MailEnv) {
    await sendPending(env);
  },
} satisfies ExportedHandler<MailEnv>;
