import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatDate, toNumber, safeColor } from "@/lib/utils";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

export const metadata = { title: "Snapshot Detail — NetWorth Tracker" };

export default async function SnapshotDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const userPrefs = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true },
  });
  const currency = userPrefs?.currency ?? "INR";

  const snapshot = await prisma.snapshot.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          lineItem: {
            include: {
              category: {
                select: { id: true, name: true, type: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  if (!snapshot || snapshot.userId !== session.user.id) notFound();

  // Group by category
  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
      type: "ASSET" | "LIABILITY";
      color: string | null;
      total: number;
      items: { id: string; name: string; value: number }[];
    }
  >();

  for (const item of snapshot.items) {
    const cat = item.lineItem.category;
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        total: 0,
        items: [],
      });
    }
    const entry = categoryMap.get(cat.id)!;
    const value = toNumber(item.value);
    entry.total += value;
    entry.items.push({ id: item.lineItem.id, name: item.lineItem.name, value });
  }

  const categories = Array.from(categoryMap.values());
  const assets = categories.filter((c) => c.type === "ASSET");
  const liabilities = categories.filter((c) => c.type === "LIABILITY");

  const netWorth = toNumber(snapshot.netWorth);
  const totalAssets = toNumber(snapshot.totalAssets);
  const totalLiabs = toNumber(snapshot.totalLiabs);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/snapshots"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to History
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              Snapshot Detail
            </h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-stone-400">
                <Calendar size={14} />
                {formatDate(snapshot.date)}
              </span>
              {snapshot.label && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                  <Tag size={12} />
                  {snapshot.label}
                </span>
              )}
            </div>
            {snapshot.note && (
              <p className="text-sm text-stone-400 italic mt-2">
                "{snapshot.note}"
              </p>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card padding="sm" className="text-center">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
              Assets
            </p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(totalAssets, { currency })}
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-1">
              Liabilities
            </p>
            <p className="text-xl font-bold text-rose-500">
              {formatCurrency(totalLiabs, { currency })}
            </p>
          </Card>
          <Card
            padding="sm"
            className="text-center bg-gradient-to-br from-primary-50 to-white"
          >
            <p className="text-xs text-primary-500 font-medium uppercase tracking-wide mb-1">
              Net Worth
            </p>
            <p
              className={`text-xl font-bold ${
                netWorth >= 0 ? "text-primary-700" : "text-rose-600"
              }`}
            >
              {formatCurrency(netWorth, { currency })}
            </p>
          </Card>
        </div>

        {/* Assets */}
        {assets.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Assets</CardTitle>
              <span className="font-bold text-emerald-600 text-sm">
                {formatCurrency(totalAssets, { currency })}
              </span>
            </CardHeader>
            <CategoryList categories={assets} type="ASSET" currency={currency} />
          </Card>
        )}

        {/* Liabilities */}
        {liabilities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
              <span className="font-bold text-rose-500 text-sm">
                {formatCurrency(totalLiabs, { currency })}
              </span>
            </CardHeader>
            <CategoryList categories={liabilities} type="LIABILITY" currency={currency} />
          </Card>
        )}
      </main>
    </div>
  );
}

function CategoryList({
  categories,
  type,
  currency,
}: {
  categories: {
    id: string;
    name: string;
    color: string | null;
    total: number;
    items: { id: string; name: string; value: number }[];
  }[];
  type: "ASSET" | "LIABILITY";
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: safeColor(cat.color) }}
              />
              <span className="text-sm font-semibold text-stone-700">
                {cat.name}
              </span>
            </div>
            <span
              className={`text-sm font-bold ${
                type === "ASSET" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {formatCurrency(cat.total, { currency })}
            </span>
          </div>
          <div className="pl-4 border-l-2 border-stone-100 flex flex-col gap-2">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm text-stone-500">{item.name}</span>
                <span className="text-sm text-stone-600 font-medium tabular-nums">
                  {formatCurrency(item.value, { currency })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
