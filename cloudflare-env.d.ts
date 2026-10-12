declare namespace Cloudflare {
  interface Env {
    NOTIFICATIONS_ENABLED?: string;
    PUBLIC_SITE_URL?: string;
    EMAIL_FROM?: string;
    RESEND_API_KEY?: string;
    DB?: D1Database;
    SORATAP_ADMIN_EMAIL?: string;
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare {interface Env {ASSETS:Fetcher;}}
