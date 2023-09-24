//CloudFlare environment variables
declare global {
  const WEBHOOK: string;
  const SECRET: string;
  const OPENAI_API_KEY: string;
  const SUPABASE_URL: string;
  const SUPABASE_KEY: string;
  const GITHUB_PAT: string;
  const GITHUB_OAUTH_CLIENT_ID: string;
  const GITHUB_OAUTH_CLIENT_SECRET: string;
  const GITHUB_INSTALLATION_TOKEN: string;
  const TELEGRAM_BOT_TOKEN: string;
  const LOG_WEBHOOK_SECRET: string;
}

export {};
