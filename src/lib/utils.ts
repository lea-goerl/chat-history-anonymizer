import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Escape a string so it can be used as a literal inside a `RegExp`.
 * Without this, masked words containing regex metacharacters (e.g. ".", "(",
 * "+", "?") would break the pattern or match the wrong text.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
