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

declare module "*.svg" {
  const content: import("react-native").ImageSourcePropType;
  export default content;
}

declare module "*.png" {
  const content: import("react-native").ImageSourcePropType;
  export default content;
}

declare module "*.jpg" {
  const content: import("react-native").ImageSourcePropType;
  export default content;
}

declare module "*.jpeg" {
  const content: import("react-native").ImageSourcePropType;
  export default content;
}
