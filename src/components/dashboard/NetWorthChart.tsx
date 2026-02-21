"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDateShort, toNumber } from "@/lib/utils";

interface SnapshotPoint {
  id: string;
  date: string;
  label?: string | null;
  netWorth: number | string;
}

interface NetWorthChartProps {
  snapshots: SnapshotPoint[];
  currency: string;
}

type Range = "3m" | "6m" | "1y" | "all";

const RANGES: { label: string; value: Range }[] = [
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

function filterByRange(snapshots: SnapshotPoint[], range: Range) {
  if (range === "all") return snapshots;
  const now = new Date();
  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const cutoff = new Date(now.setMonth(now.getMonth() - months));
  return snapshots.filter((s) => new Date(s.date) >= cutoff);
}

function makeCustomTooltip(currency: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-stone-200 rounded-xl shadow-warm-md px-4 py-3">
        <p className="text-xs text-stone-400 mb-1">{label}</p>
        {data.label && (
          <p className="text-xs font-medium text-primary-600 mb-1">{data.label}</p>
        )}
        <p className="text-base font-bold text-stone-800">
          {formatCurrency(payload[0].value, { currency })}
        </p>
      </div>
    );
  };
}

export function NetWorthChart({ snapshots, currency }: NetWorthChartProps) {
  const [range, setRange] = useState<Range>("all");
  const CustomTooltip = makeCustomTooltip(currency);

  const data = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const filtered = filterByRange(sorted, range);
    return filtered.map((s) => ({
      id: s.id,
      date: formatDateShort(s.date),
      label: s.label,
      netWorth: toNumber(s.netWorth),
    }));
  }, [snapshots, range]);

  if (snapshots.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
        <div className="text-4xl">📈</div>
        <p className="text-sm font-medium">No snapshots yet</p>
        <p className="text-xs text-center max-w-48">
          Save your first snapshot to start tracking your net worth over time
        </p>
      </div>
    );
  }

  const isPositive = data.length > 1
    ? data[data.length - 1].netWorth >= data[0].netWorth
    : true;

  return (
    <div>
      {/* Range filters */}
      <div className="flex gap-1 mb-4">
        {RANGES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              range === value
                ? "bg-primary-100 text-primary-700"
                : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "#0d9488" : "#f43f5e"}
                stopOpacity={0.15}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "#0d9488" : "#f43f5e"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f5f5f4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v) => formatCurrency(v, { compact: true, currency })}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e7e5e4", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke={isPositive ? "#0d9488" : "#f43f5e"}
            strokeWidth={2.5}
            dot={{ r: 4, fill: isPositive ? "#0d9488" : "#f43f5e", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
