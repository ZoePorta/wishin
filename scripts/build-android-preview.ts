import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const easConfigPath = path.resolve(projectRoot, "../apps/expo-client/eas.json");
const easConfig = JSON.parse(readFileSync(easConfigPath, "utf8")) as {
  build: { preview: { env: Record<string, string> } };
};

const projectId = easConfig.build.preview.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!projectId) {
  console.error(
    `Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID in ${easConfigPath} build.preview.env`,
  );
  process.exit(1);
}

execFileSync(
  "pnpm",
  [
    "--filter",
    "@wishin/expo-client",
    "exec",
    "eas",
    "build",
    "--platform",
    "android",
    "--profile",
    "preview",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, EXPO_PUBLIC_APPWRITE_PROJECT_ID: projectId },
  },
);
