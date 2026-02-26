import { Priority } from "@wishin/domain";

/**
 * Display labels for priority levels.
 * Decoupled from the domain enum to allow for internationalization and presentation changes.
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "LOW",
  [Priority.MEDIUM]: "MEDIUM",
  [Priority.HIGH]: "HIGH",
  [Priority.URGENT]: "URGENT",
};

/**
 * Priorities sorted by importance for consistent iteration in UI components.
 */
export const SORTED_PRIORITIES: Priority[] = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.URGENT,
];
