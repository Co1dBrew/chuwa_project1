// Reusable validation helpers shared across forms.

// The backend requires 8–128 character passwords, so match its minimum.
export const MIN_PASSWORD_LENGTH = 8;

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
