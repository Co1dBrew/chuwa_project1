// Controlled category filter; "" means "All categories".

import { Select } from "antd";

interface ProductFiltersProps {
  categories: string[];
  /** The currently selected category ("" means all). */
  value: string;
  onChange: (category: string) => void;
}

function ProductFilters({ categories, value, onChange }: ProductFiltersProps) {
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
