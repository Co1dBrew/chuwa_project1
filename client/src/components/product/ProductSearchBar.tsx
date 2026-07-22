/*
 * ProductSearchBar is the search box above the product grid.
 *
 * It keeps its own "what the user is typing" state internally, and only tells
 * the parent to actually search when the user presses Enter or clicks the search
 * button (or clears the box). This avoids searching on every single keystroke.
 */

import { useState } from "react";
import { Input } from "antd";

interface ProductSearchBarProps {
  /** The search text to start with (so the box stays filled after a refresh). */
  initialValue?: string;
  /** Called with the search term when the user runs a search. */
  onSearch: (term: string) => void;
}

function ProductSearchBar({ initialValue = "", onSearch }: ProductSearchBarProps) {
  // Local state: the text currently typed into the box.
  const [text, setText] = useState(initialValue);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setText(value);

    // If the user cleared the box, immediately show all products again.
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
