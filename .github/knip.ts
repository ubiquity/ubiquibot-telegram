import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/worker.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/types/config.ts", "**/__mocks__/**", "**/__fixtures__/**"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["eslint-config-prettier", "eslint-plugin-prettier", "@mswjs/data"],
  eslint: true,
};

export default config;
