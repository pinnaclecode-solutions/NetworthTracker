"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { safeColor, autoColor } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY";
  color: string;
  lineItemCount: number;
  lineItems: { id: string; name: string }[];
}

interface CategoriesClientProps {
  initialCategories: CategoryItem[];
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // New category modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"ASSET" | "LIABILITY">("ASSET");
  const [newColor, setNewColor] = useState("#0d9488");
  const [addLoading, setAddLoading] = useState(false);

  // Rename line item
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
  const [editLineItemName, setEditLineItemName] = useState("");

  function startEdit(cat: CategoryItem) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit(catId: string) {
    if (!editName.trim()) return;
    setEditLoading(true);
    const res = await fetch(`/api/categories/${catId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId ? { ...c, name: editName.trim(), color: editColor } : c
        )
      );
    }
    setEditingId(null);
    setEditLoading(false);
  }

  async function handleAddCategory() {
    if (!newName.trim()) return;
    setAddLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        type: newType,
        color: newColor,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setCategories((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          type: created.type,
          color: created.color,
          lineItemCount: 0,
          lineItems: [],
        },
      ]);
    }
    setNewName("");
    setNewType("ASSET");
    setNewColor("#0d9488");
    setAddLoading(false);
    setShowAddModal(false);
    router.refresh();
  }

  async function saveLineItemName(lineItemId: string) {
    if (!editLineItemName.trim()) return;
    const res = await fetch(`/api/line-items/${lineItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editLineItemName.trim() }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          lineItems: cat.lineItems.map((li) =>
            li.id === lineItemId
              ? { ...li, name: editLineItemName.trim() }
              : li
          ),
        }))
      );
    }
    setEditingLineItemId(null);
    setEditLineItemName("");
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const assets = categories.filter((c) => c.type === "ASSET");
  const liabilities = categories.filter((c) => c.type === "LIABILITY");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <p className="text-sm text-stone-500">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
        </p>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={15} />
          Add Category
        </Button>
      </div>

      {/* Assets */}
      {assets.length > 0 && (
        <div className="px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">
            Assets
          </h3>
          <div className="flex flex-col gap-2">
            {assets.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                editing={editingId === cat.id}
                editName={editName}
                editColor={editColor}
                editLoading={editLoading}
                expanded={expandedIds.has(cat.id)}
                editingLineItemId={editingLineItemId}
                editLineItemName={editLineItemName}
                onStartEdit={() => startEdit(cat)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => saveEdit(cat.id)}
                onEditNameChange={setEditName}
                onEditColorChange={setEditColor}
                onToggleExpand={() => toggleExpand(cat.id)}
                onStartEditLineItem={(id, name) => {
                  setEditingLineItemId(id);
                  setEditLineItemName(name);
                }}
                onCancelEditLineItem={() => setEditingLineItemId(null)}
                onSaveLineItem={saveLineItemName}
                onEditLineItemNameChange={setEditLineItemName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Liabilities */}
      {liabilities.length > 0 && (
        <div className="px-6 py-4 border-t border-stone-50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-500 mb-3">
            Liabilities
          </h3>
          <div className="flex flex-col gap-2">
            {liabilities.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                editing={editingId === cat.id}
                editName={editName}
                editColor={editColor}
                editLoading={editLoading}
                expanded={expandedIds.has(cat.id)}
                editingLineItemId={editingLineItemId}
                editLineItemName={editLineItemName}
                onStartEdit={() => startEdit(cat)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => saveEdit(cat.id)}
                onEditNameChange={setEditName}
                onEditColorChange={setEditColor}
                onToggleExpand={() => toggleExpand(cat.id)}
                onStartEditLineItem={(id, name) => {
                  setEditingLineItemId(id);
                  setEditLineItemName(name);
                }}
                onCancelEditLineItem={() => setEditingLineItemId(null)}
                onSaveLineItem={saveLineItemName}
                onEditLineItemNameChange={setEditLineItemName}
              />
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-16 px-6">
          <p className="text-stone-400 text-sm mb-4">
            No categories yet. Add your first one to get started!
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Your First Category
          </Button>
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Category"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Category Type</label>
            <div className="flex gap-2">
              {(["ASSET", "LIABILITY"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setNewType(t);
                    setNewColor(
                      t === "ASSET"
                        ? autoColor(categories.filter((c) => c.type === "ASSET").length)
                        : "#f43f5e"
                    );
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                    newType === t
                      ? t === "ASSET"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {t === "ASSET" ? "Asset" : "Liability"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-base">Category Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                newType === "ASSET" ? "e.g. Retirement Accounts" : "e.g. Student Loans"
              }
              className="input-base"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
          </div>
          <div>
            <label className="label-base">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-stone-200 cursor-pointer p-1"
              />
              <span className="text-sm text-stone-500">{newColor}</span>
            </div>
          </div>
          <Button
            className="w-full mt-2"
            loading={addLoading}
            onClick={handleAddCategory}
          >
            Add Category
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Category Row ──────────────────────────────────────────────────────────────

interface CategoryRowProps {
  cat: CategoryItem;
  editing: boolean;
  editName: string;
  editColor: string;
  editLoading: boolean;
  expanded: boolean;
  editingLineItemId: string | null;
  editLineItemName: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditNameChange: (v: string) => void;
  onEditColorChange: (v: string) => void;
  onToggleExpand: () => void;
  onStartEditLineItem: (id: string, name: string) => void;
  onCancelEditLineItem: () => void;
  onSaveLineItem: (id: string) => void;
  onEditLineItemNameChange: (v: string) => void;
}

function CategoryRow({
  cat,
  editing,
  editName,
  editColor,
  editLoading,
  expanded,
  editingLineItemId,
  editLineItemName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditNameChange,
  onEditColorChange,
  onToggleExpand,
  onStartEditLineItem,
  onCancelEditLineItem,
  onSaveLineItem,
  onEditLineItemNameChange,
}: CategoryRowProps) {
  return (
    <div className="border border-stone-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Color */}
        {editing ? (
          <input
            type="color"
            value={editColor}
            onChange={(e) => onEditColorChange(e.target.value)}
            className="w-5 h-5 rounded-full border-0 cursor-pointer p-0 bg-transparent"
          />
        ) : (
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: safeColor(cat.color) }}
          />
        )}

        {/* Name */}
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1 text-sm font-medium border-b border-stone-300 focus:border-primary-400 outline-none bg-transparent py-0.5"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-stone-700">
            {cat.name}
          </span>
        )}

        <span className="text-xs text-stone-400">
          {cat.lineItemCount} item{cat.lineItemCount !== 1 ? "s" : ""}
        </span>

        {/* Actions */}
        {editing ? (
          <div className="flex gap-1">
            <button
              onClick={onSaveEdit}
              disabled={editLoading}
              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
              aria-label="Save"
            >
              <Check size={15} />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={onStartEdit}
              className="p-1.5 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Rename"
            >
              <Pencil size={13} />
            </button>
            {cat.lineItems.length > 0 && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
              >
                {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Line items */}
      {expanded && cat.lineItems.length > 0 && (
        <div className="border-t border-stone-50 bg-stone-50/50 px-4 py-2">
          {cat.lineItems.map((li) => (
            <div
              key={li.id}
              className="flex items-center gap-2 py-1.5 pl-4 group"
            >
              {editingLineItemId === li.id ? (
                <>
                  <input
                    type="text"
                    value={editLineItemName}
                    onChange={(e) => onEditLineItemNameChange(e.target.value)}
                    className="flex-1 text-sm border-b border-stone-300 focus:border-primary-400 outline-none bg-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveLineItem(li.id);
                      if (e.key === "Escape") onCancelEditLineItem();
                    }}
                  />
                  <button
                    onClick={() => onSaveLineItem(li.id)}
                    className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={onCancelEditLineItem}
                    className="p-1 text-stone-400 hover:bg-stone-100 rounded transition-colors"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs text-stone-500">{li.name}</span>
                  <button
                    onClick={() => onStartEditLineItem(li.id, li.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-primary-500 rounded transition-all"
                    aria-label="Rename item"
                  >
                    <Pencil size={11} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
