// Search box above the product grid; searches on Enter/click, not every keystroke.

import { useState } from "react";
import { Input } from "antd";

interface ProductSearchBarProps {
  initialValue?: string;
  onSearch: (term: string) => void;
}

function ProductSearchBar({ initialValue = "", onSearch }: ProductSearchBarProps) {
  const [text, setText] = useState(initialValue);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);

    // Clearing the box immediately shows all products again.
    if (value === "") {
      onSearch("");
    }
  }

  function handleSearch() {
    onSearch(text.trim());
  }

  return (
    <Input.Search
      placeholder="Search products by name or description"
      value={text}
      allowClear
      enterButton="Search"
      onChange={handleChange}
      onSearch={handleSearch}
      style={{ maxWidth: 420 }}
    />
  );
}

export default ProductSearchBar;
