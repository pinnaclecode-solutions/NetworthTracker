"use client";

import { useState } from "react";
import { CURRENCIES } from "@/lib/utils";

interface CurrencySelectorProps {
  initialCurrency: string;
}

export function CurrencySelector({ initialCurrency }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newCurrency: string) {
    setCurrency(newCurrency);
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Could not save preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => handleChange(c.code)}
            disabled={saving}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              currency === c.code
                ? "border-primary-400 bg-primary-50 text-primary-700"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
            }`}
          >
            <span className="text-base leading-none">{c.symbol}</span>
            <span className="truncate">{c.code}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 h-4">
        {saved && (
          <p className="text-xs text-emerald-600 font-medium">
            Currency updated
          </p>
        )}
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    </div>
  );
}
