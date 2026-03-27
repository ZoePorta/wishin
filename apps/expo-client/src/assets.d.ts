import type { ImageSourcePropType } from "react-native";

declare global {
  const Sentry: {
    addBreadcrumb: (breadcrumb: {
      message: string;
      category?: string;
      data?: Record<string, unknown>;
    }) => void;
  };
  const posthog: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
  };
}

declare module "*.png" {
  const content: ImageSourcePropType;
  export default content;
}

declare module "*.jpg" {
  const content: ImageSourcePropType;
  export default content;
}

declare module "*.jpeg" {
  const content: ImageSourcePropType;
  export default content;
}

export {};
