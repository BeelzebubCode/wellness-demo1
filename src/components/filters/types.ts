// path: src/components/filters/types.ts
export type FilterType = "select" | "searchable_select" | "multi_select" | "text" | "numberMin" | "boolean" | "date";

export type FilterOption = {
  label: string;
  value: string | number | boolean;
};

export type FilterDef<TFilters extends Record<string, any>> = {
  key: keyof TFilters;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
};
