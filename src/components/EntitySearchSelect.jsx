import { useMemo, useState } from "react";

export function EntitySearchSelect({
  label,
  value,
  onChange,
  items,
  getOptionLabel,
  getSearchText,
  placeholder = "Search...",
  emptyLabel = "Select option",
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    const result = items.filter((item) => {
      if (!query) return true;

      return getSearchText(item).toLowerCase().includes(query);
    });

    const selectedItem = items.find((item) => String(item.id) === String(value));

    if (
      selectedItem &&
      !result.some((item) => String(item.id) === String(selectedItem.id))
    ) {
      return [selectedItem, ...result];
    }

    return result;
  }, [items, search, getSearchText, value]);

  return (
    <label>
      {label}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
      />

      <select
        value={value ?? ""}
        onChange={(event) => {
          const selectedValue = event.target.value;
          onChange(selectedValue ? Number(selectedValue) : "");
        }}
      >
        <option value="">{emptyLabel}</option>

        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>
            {getOptionLabel(item)}
          </option>
        ))}
      </select>
    </label>
  );
}