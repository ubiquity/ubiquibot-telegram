import { RepoType } from "./types/Basic";
export const TIME_LABELS: string[] = ["Time: <1 Hour", "Time: <1 Day", "Time: <1 Week", "Time: <2 Weeks", "Time: <1 Month"];
export const GITHUB_PATHNAME = "/github-link"

export const repoMapping: RepoType[] = [
  {
    group: -1001738021587,
    github: "Seprintour-Test/test",
  },
  {
    group: -1001558587400,
    github: "ubiquity/testing-telegram-ubiquibot",
  },
];

export default {
  TIME_LABELS,
  repoMapping,
};
