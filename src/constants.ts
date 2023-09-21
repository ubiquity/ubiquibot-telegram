export const TIME_LABELS: string[] = ["Time: <1 Hour", "Time: <1 Day", "Time: <1 Week", "Time: <2 Weeks", "Time: <1 Month"];
export const GITHUB_PATHNAME = "/register";
export const ENABLE_TOPIC = "/enable_topic";
export const BOT_COMMANDS = [
  { command: "start", description: "Setup your groups where bot is installed" },
  { command: "register", description: "Bind your Github account to your Telegram account" },
  { command: "enable_topic", description: "Whitelist a topic on supergroup for tasks" },
];

export default {
  TIME_LABELS,
};
