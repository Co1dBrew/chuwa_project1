/*
 * Reusable validation helpers.
 *
 * These small functions each answer one yes/no question about a value. We keep
 * them here in one place so different forms can share the exact same rules.
 * Sharing means that if we ever change (for example) the minimum password
 * length, we change it once here and every form updates automatically.
 *
 * Where each of these is used:
 *   - MIN_PASSWORD_LENGTH : the password fields in AuthForm.
 *   - isValidEmail        : the email field in AuthForm.
 *   - isNonNegativeNumber : the price and stock fields in ProductForm, and the
 *                           product service's own safety checks.
 */

/** The smallest number of characters a password is allowed to have. */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Check whether a piece of text looks like a valid email address.
 *
 * This is a simple check: it looks for "something@something.something".
 * It is not perfect, but it catches the common mistakes.
 *
 * @param email The text to check.
 * @returns true if the text looks like an email address.
 */
export function isValidEmail(email: string): boolean {
  // A regular expression describing the pattern of a basic email address.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Check whether a number is zero or greater (never negative).
 *
 * We use this for a product's price and stock: neither may be negative.
 *
 * @param value The number to check.
 * @returns true if the number is defined and is not negative.
 */
export function isNonNegativeNumber(value: number | null | undefined): boolean {
  // First make sure we actually have a number (not null, undefined, or NaN).
  if (value === null || value === undefined || Number.isNaN(value)) {
    return false;
  }
  return value >= 0;
}
