"use client";

import { Brain, Loader2, ChevronsUpDown, Check, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type ProblemCategory = {
  id: number;
  code: string;
  nameTh: string;
  nameEn: string;
  description?: string;
};

type ProblemCategoryFilterProps = {
  selected: string[];
  onChange: (codes: string[]) => void;
};

export function ProblemCategoryFilter({ selected, onChange }: ProblemCategoryFilterProps) {
  const [categories, setCategories] = useState<ProblemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/problem-categories");

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching problem categories:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleSelect = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        <span className="text-[10px] xl:text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2 px-3 bg-red-50 border border-red-100 rounded-lg">
        <span className="text-[10px] xl:text-xs text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
        <Brain className="w-3 h-3" />
        ประเภทปัญหา
      </label>

      {/* Beautiful Custom Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3 py-2.5 text-[10px] xl:text-xs font-medium border-2 rounded-xl flex items-center justify-between text-left transition-all
          ${isOpen ? "border-indigo-600 ring-4 ring-indigo-50 shadow-md bg-white" : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"}
        `}
      >
        <span className={selected.length === 0 ? "text-gray-500" : "text-gray-900 font-semibold"}>
          {selected.length === 0 ? "เลือกประเภทปัญหา" : `${selected.length} รายการ`}
        </span>

        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <div
              onClick={clearSelection}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </div>
          )}
          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {/* Selected Tags Preview (Always Show All) */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 animate-fadeIn max-h-32 overflow-y-auto custom-scrollbar">
          {selected.map(code => (
            <div key={code} className="px-2 py-1 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-[10px] xl:text-xs font-medium rounded-md shadow-sm flex items-center gap-1 flex-shrink-0">
              {categories.find(c => c.code === code)?.nameTh || code}
              <button onClick={() => handleSelect(code)} className="hover:text-red-200 ml-0.5"><X className="w-2.5 h-2.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Portal Dropdown Menu - Floats above everything */}
      {isOpen && dropdownRef.current && (
        <DropdownPortal
          parentRef={dropdownRef}
          categories={categories}
          selected={selected}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 10px;
          border: 1px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-400 */
        }
      `}</style>
    </div>
  );
}

// Separate Portal Component for robust positioning
import { createPortal } from "react-dom";

function DropdownPortal({
  parentRef,
  categories,
  selected,
  onSelect,
  onClose
}: {
  parentRef: React.RefObject<HTMLDivElement>;
  categories: ProblemCategory[];
  selected: string[];
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const portalRef = useRef<HTMLDivElement>(null);

  // Initial positioning
  useEffect(() => {
    if (!parentRef.current) return;

    const updatePosition = () => {
      if (!parentRef.current) return;
      const rect = parentRef.current.getBoundingClientRect();

      // Position above the input
      setStyle({
        position: "fixed",
        bottom: `${window.innerHeight - rect.top + 8}px`, // 8px gap above input
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999, // Max z-index
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [parentRef]);

  // Handle clicks outside - MUST be done here or communicated up
  // Since we are in a portal, normal event bubbling works for React events, but native document listeners
  // in parent might fire first or fail to see this as "inside".
  // ACTUALLY: The parent's handleClickOutside uses dropdownRef.contains().
  // We need to tell the parent NOT to close if clicking inside here.
  // STRATEGY: Use a specialized click listener inside this portal to stop propagation? 
  // No, mousedown on document fires before React onClick usually.
  // 
  // BETTER STRATEGY: Add a mousedown listener to this portal element that stops propagation to document?
  // Yes, if we stop propagation of mousedown, the document listener in parent won't see it (if it's checking bubbling).
  // Parent uses: document.addEventListener("mousedown", handleClickOutside);
  // 
  useEffect(() => {
    function handlePortalClick(e: MouseEvent) {
      // Stop this click from reaching the document listener in the parent
      // IF the parent listener is on the bubble phase (default).
      e.stopPropagation();
    }

    const el = portalRef.current;
    if (el) {
      el.addEventListener("mousedown", handlePortalClick);
    }

    return () => {
      if (el) el.removeEventListener("mousedown", handlePortalClick);
    };
  }, []);

  // Also close on main window scroll (except internal scroll)
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // If scrolling happens inside the dropdown, don't close
      if (portalRef.current && portalRef.current.contains(e.target as Node)) {
        return;
      }
      // If scrolling main page, close
      onClose();
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  return createPortal(
    <div
      ref={portalRef}
      style={style}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 origin-bottom"
    >
      <div className="p-1.5 grid gap-0.5">
        {categories.map((cat) => {
          const isSelected = selected.includes(cat.code);
          return (
            <button
              key={cat.code}
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // prevent bubbling if confusing
                onSelect(cat.code);
              }}
              className={`
                                w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-[10px] xl:text-xs text-left transition-all
                                ${isSelected
                  ? "bg-indigo-50 text-indigo-900 font-bold"
                  : "text-gray-700 hover:bg-gray-50"}
                            `}
            >
              <span className="truncate pr-2">{cat.nameTh}</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  );
}
