// Money helpers. Prices are stored as whole cents; these convert to/from dollars.

// Format cents as a USD string, e.g. formatCents(1299) -> "$12.99".
export function formatCents(cents: number): string {
  const dollars = cents / 100;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return formatter.format(dollars);
}

// Convert dollars to whole cents. Round to avoid floating point errors like 1298.9999999.
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert whole cents back into a dollar number.
export function centsToDollars(cents: number): number {
  return cents / 100;
}
