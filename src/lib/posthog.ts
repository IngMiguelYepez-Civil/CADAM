import posthog from 'posthog-js';
import { apiUrl } from '@/services/api';

const POSTHOG_KEY =
  import.meta.env.VITE_POSTHOG_PROJECT_KEY ?? import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || apiUrl('jackson-pollock');

let isInitialized = false;

export const initPostHog = () => {
  // Visitor OAuth callbacks and inference credentials must not enter analytics.
};

// Safe wrapper that only calls PostHog methods when initialized
export const analytics = {
  identify: (userId: string, properties?: Record<string, unknown>) => {
    if (isInitialized) {
      posthog.identify(userId, properties);
    }
  },
  reset: () => {
    if (isInitialized) {
      posthog.reset();
    }
  },
  capture: (event: string, properties?: Record<string, unknown>) => {
    if (isInitialized) {
      posthog.capture(event, properties);
    }
  },
};
