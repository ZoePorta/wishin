import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as
    | string
    | undefined;

  return {
    ...config,
    name: config.name ?? "Wishin",
    slug: config.slug ?? "app",
    scheme: projectId ? `appwrite-callback-${projectId}` : "wishin",
  };
};
