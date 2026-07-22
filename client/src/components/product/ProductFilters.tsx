/*
 * ProductFilters lets the user narrow the product list by category.
 *
 * It is a "controlled" component: the parent owns the selected value and passes
 * it in, and we tell the parent about changes through onChange. An empty string
 * ("") means "All categories".
 */

import { Select } from "antd";

interface ProductFiltersProps {
  /** All category names that can be chosen. */
  categories: string[];
  /** The currently selected category ("" means all). */
  value: string;
  /** Called with the new category when the user picks one. */
  onChange: (category: string) => void;
}

function ProductFilters({ categories, value, onChange }: ProductFiltersProps) {
  // Build the list of dropdown options, starting with an "All" choice.
  const options = [{ label: "All categories", value: "" }];
  categories.forEach(function (category) {
    options.push({ label: category, value: category });
  });

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      style={{ width: 200 }}
      aria-label="Filter by category"
    />
  );
}

export default ProductFilters;
