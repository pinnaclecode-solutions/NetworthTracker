"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, toNumber, safeColor } from "@/lib/utils";

interface LineItemData {
  id: string;
  name: string;
  value: number | string;
}

interface CategoryData {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY";
  color?: string | null;
  total: number | string;
  lineItems: LineItemData[];
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
  currency: string;
}

type SortKey = "name" | "value";

function CategoryRow({ category, currency }: { category: CategoryData; currency: string }) {
  const [open, setOpen] = useState(false);
  const total = toNumber(category.total);
  const color = safeColor(category.color);

  return (
    <div className="border border-stone-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-stone-700 truncate">
            {category.name}
          </span>
          {category.lineItems.length > 0 && (
            <span className="text-xs text-stone-400 flex-shrink-0">
              {category.lineItems.length} item{category.lineItems.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span
            className={`text-sm font-semibold ${
              category.type === "ASSET" ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {formatCurrency(total, { currency })}
          </span>
          {category.lineItems.length > 0 &&
            (open ? (
              <ChevronDown size={15} className="text-stone-400" />
            ) : (
              <ChevronRight size={15} className="text-stone-400" />
            ))}
        </div>
      </button>

      {open && category.lineItems.length > 0 && (
        <div className="border-t border-stone-50 bg-stone-50/50">
          {category.lineItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-2.5 pl-10"
            >
              <span className="text-sm text-stone-500">{item.name}</span>
              <span className="text-sm text-stone-600 font-medium">
                {formatCurrency(toNumber(item.value), { currency })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryBreakdown({ categories, currency }: CategoryBreakdownProps) {
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const assets = categories
    .filter((c) => c.type === "ASSET")
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return toNumber(b.total) - toNumber(a.total);
    });

  const liabilities = categories
    .filter((c) => c.type === "LIABILITY")
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return toNumber(b.total) - toNumber(a.total);
    });

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-stone-400">Sort by:</span>
        {(["value", "name"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setSortKey(key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              sortKey === key
                ? "bg-primary-100 text-primary-700"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Assets */}
      {assets.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Assets
          </h4>
          <div className="flex flex-col gap-2">
            {assets.map((cat) => (
              <CategoryRow key={cat.id} category={cat} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* Liabilities */}
      {liabilities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            Liabilities
          </h4>
          <div className="flex flex-col gap-2">
            {liabilities.map((cat) => (
              <CategoryRow key={cat.id} category={cat} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-8">
          No data in this snapshot
        </p>
      )}
    </div>
  );
}
