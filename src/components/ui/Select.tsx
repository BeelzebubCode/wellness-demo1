import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;

  // ✅ ให้เหมือน shadcn
  onValueChange?: (value: string) => void;

  // ✅ ถ้าอยากรองรับ onChange ด้วย ก็ใส่ไว้เอง
  onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      id,
      onValueChange,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-gray-900 appearance-none font-medium",
              "transition-all duration-200 shadow-sm",
              "hover:border-gray-300 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none",
              error && "border-red-300 focus:ring-red-500/30 focus:border-red-500",
              className,
            )}
            {...rest}
            onChange={(e) => {
              onChange?.(e);                 // ✅ ยังรองรับคนที่ใช้ onChange เดิม
              onValueChange?.(e.target.value); // ✅ API แบบ shadcn
            }}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
export { Select };
