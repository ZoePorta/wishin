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

export {};
