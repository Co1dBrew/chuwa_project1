/*
 * Helper functions for working with money.
 *
 * As explained in types/product.ts, prices are stored as whole cents. These
 * functions convert between cents (used for storage and math) and dollars
 * (used for input fields and display).
 */

/**
 * Turn a number of cents into a nicely formatted dollar string.
 *
 * Example: formatCents(1299) returns "$12.99".
 *
 * @param cents A price in whole cents.
 * @returns A string such as "$12.99".
 */
export function formatCents(cents: number): string {
  // Divide by 100 to move from cents to dollars.
  const dollars = cents / 100;

  // Intl.NumberFormat is a built-in browser tool that formats numbers as money.
  // Here we ask it for United States dollars.
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return formatter.format(dollars);
}

/**
 * Convert a dollar amount (what the user types) into whole cents (what we store).
 *
 * Example: dollarsToCents(12.99) returns 1299.
 *
 * We multiply by 100 and then round to the nearest whole number so that tiny
 * floating point errors do not leave us with something like 1298.9999999.
 *
 * @param dollars A price in dollars, for example 12.99.
 * @returns The same price expressed in whole cents.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert whole cents back into a dollar number (used to fill in a form field).
 *
 * Example: centsToDollars(1299) returns 12.99.
 *
 * @param cents A price in whole cents.
 * @returns The same price expressed in dollars.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
