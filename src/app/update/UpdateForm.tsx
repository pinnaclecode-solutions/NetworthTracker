"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, autoColor, CURRENCIES } from "@/lib/utils";

interface LineItemInput {
  id: string | null; // null = new (not yet in DB)
  name: string;
  value: string;
  isNew?: boolean;
}

interface CategoryInput {
  id: string | null; // null = new
  name: string;
  type: "ASSET" | "LIABILITY";
  color: string;
  lineItems: LineItemInput[];
  isNew?: boolean;
  expanded: boolean;
}

interface UpdateFormProps {
  initialCategories: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY";
    color: string;
    lineItems: { id: string; name: string; value: number }[];
  }[];
  currency: string;
}

export function UpdateForm({ initialCategories, currency }: UpdateFormProps) {
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹";
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryInput[]>(() =>
    initialCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      isNew: false,
      expanded: true,
      lineItems: cat.lineItems.map((li) => ({
        id: li.id,
        name: li.name,
        value: li.value > 0 ? String(li.value) : "",
        isNew: false,
      })),
    }))
  );

  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Totals
  const { totalAssets, totalLiabs, netWorth } = useMemo(() => {
    let assets = 0;
    let liabs = 0;
    for (const cat of categories) {
      for (const li of cat.lineItems) {
        const v = parseFloat(li.value) || 0;
        if (cat.type === "ASSET") assets += v;
        else liabs += v;
      }
    }
    return { totalAssets: assets, totalLiabs: liabs, netWorth: assets - liabs };
  }, [categories]);

  // ── Category helpers ──────────────────────────────────────────────────────

  function addCategory(type: "ASSET" | "LIABILITY") {
    const newIndex = categories.filter((c) => c.isNew).length;
    setCategories((prev) => [
      ...prev,
      {
        id: null,
        name: "",
        type,
        color: autoColor(prev.length + newIndex),
        isNew: true,
        expanded: true,
        lineItems: [
          { id: null, name: "", value: "", isNew: true },
        ],
      },
    ]);
  }

  function updateCategory(
    tempKey: number,
    field: keyof Pick<CategoryInput, "name" | "color">,
    value: string
  ) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === tempKey ? { ...cat, [field]: value } : cat
      )
    );
  }

  function toggleCategory(index: number) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  }

  // ── Line item helpers ─────────────────────────────────────────────────────

  function addLineItem(catIndex: number) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex
          ? {
              ...cat,
              lineItems: [
                ...cat.lineItems,
                { id: null, name: "", value: "", isNew: true },
              ],
            }
          : cat
      )
    );
  }

  function updateLineItem(
    catIndex: number,
    liIndex: number,
    field: "name" | "value",
    value: string
  ) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex
          ? {
              ...cat,
              lineItems: cat.lineItems.map((li, j) =>
                j === liIndex ? { ...li, [field]: value } : li
              ),
            }
          : cat
      )
    );
  }

  function removeLineItem(catIndex: number, liIndex: number) {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === catIndex
          ? {
              ...cat,
              lineItems: cat.lineItems.filter((_, j) => j !== liIndex),
            }
          : cat
      )
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // 1. Create new categories
      const resolvedCategories = await Promise.all(
        categories.map(async (cat) => {
          if (!cat.isNew || !cat.name.trim()) return cat;
          const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: cat.name.trim(),
              type: cat.type,
              color: cat.color,
            }),
          });
          if (!res.ok) throw new Error("Failed to create category");
          const created = await res.json();
          return { ...cat, id: created.id as string };
        })
      );

      // 2. Create new line items
      const resolvedWithLineItems = await Promise.all(
        resolvedCategories.map(async (cat) => {
          if (!cat.id) return cat; // skip nameless new cats
          const lineItems = await Promise.all(
            cat.lineItems.map(async (li) => {
              if (!li.isNew || !li.name.trim()) return li;
              const res = await fetch("/api/line-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  categoryId: cat.id,
                  name: li.name.trim(),
                }),
              });
              if (!res.ok) throw new Error("Failed to create line item");
              const created = await res.json();
              return { ...li, id: created.id as string };
            })
          );
          return { ...cat, lineItems };
        })
      );

      // 3. Build snapshot items (only items with a value and a real ID)
      const items: { lineItemId: string; value: number }[] = [];
      for (const cat of resolvedWithLineItems) {
        for (const li of cat.lineItems) {
          if (!li.id || li.id.startsWith("temp-")) continue;
          const v = parseFloat(li.value);
          if (!isNaN(v) && v !== 0) {
            items.push({ lineItemId: li.id, value: v });
          }
        }
      }

      if (items.length === 0) {
        setError("Please enter at least one non-zero value before saving.");
        setSaving(false);
        return;
      }

      // 4. Create snapshot
      const snapRes = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, note, items, date: snapshotDate }),
      });

      if (!snapRes.ok) {
        const data = await snapRes.json();
        throw new Error(data.error || "Failed to save snapshot");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  const assets = categories.filter((c) => c.type === "ASSET");
  const liabilities = categories.filter((c) => c.type === "LIABILITY");

  return (
    <div>
      {/* Sticky totals bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl px-5 py-4 mb-6 shadow-warm-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-stone-400 font-medium">Assets</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalAssets, { currency })}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-medium">Liabilities</p>
            <p className="text-lg font-bold text-rose-500">
              {formatCurrency(totalLiabs, { currency })}
            </p>
          </div>
          <div className="border-l border-stone-200 pl-6">
            <p className="text-xs text-stone-400 font-medium">Net Worth</p>
            <p
              className={`text-lg font-bold ${
                netWorth >= 0 ? "text-primary-600" : "text-rose-500"
              }`}
            >
              {formatCurrency(netWorth, { currency })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye size={15} />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => setShowPreview(true)}
            loading={saving}
          >
            <Save size={15} />
            Save Snapshot
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Assets section */}
      <Section
        title="Assets"
        type="ASSET"
        accent="emerald"
        categories={assets}
        allCategories={categories}
        currency={currency}
        onAddCategory={() => addCategory("ASSET")}
        onToggle={(catIndex) => toggleCategory(catIndex)}
        onUpdateCategory={updateCategory}
        onAddLineItem={addLineItem}
        onUpdateLineItem={updateLineItem}
        onRemoveLineItem={removeLineItem}
      />

      {/* Liabilities section */}
      <div className="mt-6">
        <Section
          title="Liabilities"
          type="LIABILITY"
          accent="rose"
          categories={liabilities}
          allCategories={categories}
          currency={currency}
          onAddCategory={() => addCategory("LIABILITY")}
          onToggle={(catIndex) => toggleCategory(catIndex)}
          onUpdateCategory={updateCategory}
          onAddLineItem={addLineItem}
          onUpdateLineItem={updateLineItem}
          onRemoveLineItem={removeLineItem}
        />
      </div>

      {/* Preview / Save modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Save Snapshot"
        size="md"
      >
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Assets</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(totalAssets, { currency })}
              </p>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <p className="text-xs text-rose-500 font-medium mb-1">Liabilities</p>
              <p className="text-lg font-bold text-rose-600">
                {formatCurrency(totalLiabs, { currency })}
              </p>
            </div>
            <div className="bg-primary-50 rounded-xl p-3 text-center">
              <p className="text-xs text-primary-600 font-medium mb-1">Net Worth</p>
              <p
                className={`text-lg font-bold ${
                  netWorth >= 0 ? "text-primary-700" : "text-rose-600"
                }`}
              >
                {formatCurrency(netWorth, { currency })}
              </p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="label-base">Snapshot Date</label>
            <input
              type="date"
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="input-base"
            />
          </div>

          {/* Label & note */}
          <div>
            <label className="label-base">
              Snapshot Label{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='e.g. "End of Q2 2025" or "After bonus"'
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">
              Note{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any context you want to remember about this snapshot..."
              rows={3}
              className="input-base resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPreview(false)}
            >
              Back to Edit
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={handleSave}
            >
              <Save size={15} />
              Confirm & Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Section component (Assets or Liabilities) ─────────────────────────────

interface SectionProps {
  title: string;
  type: "ASSET" | "LIABILITY";
  accent: "emerald" | "rose";
  categories: CategoryInput[];
  allCategories: CategoryInput[];
  currency: string;
  onAddCategory: () => void;
  onToggle: (globalIndex: number) => void;
  onUpdateCategory: (
    globalIndex: number,
    field: "name" | "color",
    value: string
  ) => void;
  onAddLineItem: (globalIndex: number) => void;
  onUpdateLineItem: (
    globalIndex: number,
    liIndex: number,
    field: "name" | "value",
    value: string
  ) => void;
  onRemoveLineItem: (globalIndex: number, liIndex: number) => void;
}

function Section({
  title,
  type,
  accent,
  categories,
  allCategories,
  currency,
  onAddCategory,
  onToggle,
  onUpdateCategory,
  onAddLineItem,
  onUpdateLineItem,
  onRemoveLineItem,
}: SectionProps) {
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₹";
  const accentClasses = {
    emerald: {
      header: "text-emerald-700 bg-emerald-50 border-emerald-100",
      badge: "bg-emerald-100 text-emerald-700",
      button: "text-emerald-600 hover:bg-emerald-50",
    },
    rose: {
      header: "text-rose-600 bg-rose-50 border-rose-100",
      badge: "bg-rose-100 text-rose-600",
      button: "text-rose-500 hover:bg-rose-50",
    },
  }[accent];

  const sectionTotal = categories.reduce((sum, cat) => {
    return (
      sum +
      cat.lineItems.reduce((s, li) => s + (parseFloat(li.value) || 0), 0)
    );
  }, 0);

  return (
    <div>
      {/* Section header */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-3 ${accentClasses.header}`}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">{title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accentClasses.badge}`}>
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </span>
        </div>
        <span className="font-bold text-sm">{formatCurrency(sectionTotal, { currency })}</span>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-3">
        {categories.map((cat) => {
          const globalIndex = allCategories.indexOf(cat);
          const catTotal = cat.lineItems.reduce(
            (s, li) => s + (parseFloat(li.value) || 0),
            0
          );

          return (
            <div
              key={cat.id ?? cat.name + globalIndex}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-warm"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
                {/* Color dot */}
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) =>
                    onUpdateCategory(globalIndex, "color", e.target.value)
                  }
                  className="w-5 h-5 rounded-full border-0 cursor-pointer p-0 bg-transparent"
                  title="Pick category color"
                  style={{ appearance: "none" }}
                />

                {/* Name */}
                {cat.isNew ? (
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) =>
                      onUpdateCategory(globalIndex, "name", e.target.value)
                    }
                    placeholder={`New ${type === "ASSET" ? "asset" : "liability"} category name`}
                    className="flex-1 text-sm font-medium bg-transparent border-b border-dashed border-stone-300 focus:border-primary-400 outline-none pb-0.5 text-stone-700 placeholder:text-stone-300"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm font-semibold text-stone-700">
                    {cat.name}
                  </span>
                )}

                {/* Total */}
                <span
                  className={`text-sm font-bold ml-auto ${
                    type === "ASSET" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(catTotal, { currency })}
                </span>

                {/* Expand toggle */}
                <button
                  onClick={() => onToggle(globalIndex)}
                  className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {cat.expanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              </div>

              {/* Line items */}
              {cat.expanded && (
                <div className="px-4 py-2">
                  {cat.lineItems.map((li, liIndex) => (
                    <div
                      key={li.id ?? `new-${liIndex}`}
                      className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0 group"
                    >
                      {/* Name */}
                      <input
                        type="text"
                        value={li.name}
                        onChange={(e) =>
                          onUpdateLineItem(
                            globalIndex,
                            liIndex,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder={
                          li.isNew ? "Account or item name" : li.name
                        }
                        className={`flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300 ${
                          li.isNew
                            ? "border-b border-dashed border-stone-300 focus:border-primary-400 pb-0.5"
                            : ""
                        }`}
                        readOnly={!li.isNew}
                      />

                      {/* Value */}
                      <div className="flex items-center">
                        <span className="text-stone-300 text-sm mr-1">{currencySymbol}</span>
                        <input
                          type="number"
                          value={li.value}
                          onChange={(e) =>
                            onUpdateLineItem(
                              globalIndex,
                              liIndex,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-28 text-sm text-right bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 tabular-nums"
                        />
                      </div>

                      {/* Remove (new items or always) */}
                      <button
                        onClick={() => onRemoveLineItem(globalIndex, liIndex)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-400 transition-all rounded-lg"
                        aria-label="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Add line item */}
                  <button
                    onClick={() => onAddLineItem(globalIndex)}
                    className={`flex items-center gap-1.5 mt-2 mb-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-colors ${accentClasses.button}`}
                  >
                    <Plus size={13} />
                    Add item
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add category button */}
        <button
          onClick={onAddCategory}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors ${
            type === "ASSET"
              ? "border-emerald-200 text-emerald-500 hover:border-emerald-300 hover:bg-emerald-50"
              : "border-rose-200 text-rose-400 hover:border-rose-300 hover:bg-rose-50"
          }`}
        >
          <Plus size={16} />
          Add {type === "ASSET" ? "Asset" : "Liability"} Category
        </button>
      </div>
    </div>
  );
}
