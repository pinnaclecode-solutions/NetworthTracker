"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, toNumber } from "@/lib/utils";

interface AssetsLiabilitiesChartProps {
  totalAssets: number | string;
  totalLiabs: number | string;
  currency: string;
}

export function AssetsLiabilitiesChart({
  totalAssets,
  totalLiabs,
  currency,
}: AssetsLiabilitiesChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-stone-200 rounded-xl shadow-warm-md px-4 py-3">
        <p className="text-sm font-semibold text-stone-700">
          {payload[0].payload.name}
        </p>
        <p className="text-base font-bold mt-0.5" style={{ color: payload[0].fill }}>
          {formatCurrency(payload[0].value, { currency })}
        </p>
      </div>
    );
  }
  const assets = toNumber(totalAssets);
  const liabs = toNumber(totalLiabs);

  const data = [
    { name: "Assets", value: assets, color: "#0d9488" },
    { name: "Liabilities", value: liabs, color: "#f43f5e" },
  ];

  const total = assets + liabs;
  const assetsPercent = total > 0 ? (assets / total) * 100 : 0;
  const liabsPercent = total > 0 ? (liabs / total) * 100 : 0;

  return (
    <div>
      {/* Numbers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
            Total Assets
          </p>
          <p className="text-xl font-bold text-emerald-600">
            {formatCurrency(assets, { currency })}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">{assetsPercent.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
            Total Liabilities
          </p>
          <p className="text-xl font-bold text-rose-500">
            {formatCurrency(liabs, { currency })}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">{liabsPercent.toFixed(1)}%</p>
        </div>
      </div>

      {/* Progress bar comparison */}
      {total > 0 && (
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-3">
            <div
              className="bg-emerald-400 transition-all duration-500"
              style={{ width: `${assetsPercent}%` }}
              title={`Assets: ${assetsPercent.toFixed(1)}%`}
            />
            <div
              className="bg-rose-400 transition-all duration-500"
              style={{ width: `${liabsPercent}%` }}
              title={`Liabilities: ${liabsPercent.toFixed(1)}%`}
            />
          </div>
        </div>
      )}

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#a8a29e" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, { compact: true, currency })}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f4", radius: 8 }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
