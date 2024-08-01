export function checkEnvVars() {
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "GITHUB_PAT",
    "GITHUB_INSTALLATION_TOKEN",
    "LOG_WEBHOOK_SECRET",
    "GITHUB_OAUTH_CLIENT_ID",
    "GITHUB_OAUTH_CLIENT_SECRET",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "TELEGRAM_BOT_TOKEN",
    "WEBHOOK",
    "SECRET",
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    console.error(`Missing the following environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1); // Exit the process with an error code
  }

  return requiredEnvVars.reduce(
    (env, varName) => {
      env[varName] = process.env[varName] as string;
      return env;
    },
    {} as Record<string, string>
  );
}
