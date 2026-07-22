// Reusable validation helpers shared across forms.

export const MIN_PASSWORD_LENGTH = 6;

// Basic "something@something.something" email check. Not exhaustive.
export function isValidEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// True if the value is a defined number that is zero or greater.
export function isNonNegativeNumber(value: number | null | undefined): boolean {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return false;
  }
  return value >= 0;
}
