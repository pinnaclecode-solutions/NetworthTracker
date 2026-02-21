import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetsLiabilitiesChart } from "@/components/dashboard/AssetsLiabilitiesChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import {
  formatCurrency,
  formatDate,
  percentChange,
  formatPercent,
  toNumber,
} from "@/lib/utils";
import { PlusCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const metadata = { title: "Dashboard — NetWorth Tracker" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  // Fetch user currency preference
  const userPrefs = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true },
  });
  const currency = userPrefs?.currency ?? "INR";

  // Fetch all snapshots for chart
  const allSnapshots = await prisma.snapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    select: {
      id: true,
      label: true,
      netWorth: true,
      totalAssets: true,
      totalLiabs: true,
      date: true,
      createdAt: true,
    },
  });

  const latestSnapshot = allSnapshots[0] ?? null;
  const previousSnapshot = allSnapshots[1] ?? null;

  // Fetch category breakdown for latest snapshot
  let categoryData: {
    id: string;
    name: string;
    type: "ASSET" | "LIABILITY";
    color: string | null;
    total: number;
    lineItems: { id: string; name: string; value: number }[];
  }[] = [];

  if (latestSnapshot) {
    const snapshotDetail = await prisma.snapshot.findUnique({
      where: { id: latestSnapshot.id },
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

    if (snapshotDetail) {
      // Group items by category
      const catMap = new Map<
        string,
        {
          id: string;
          name: string;
          type: "ASSET" | "LIABILITY";
          color: string | null;
          total: number;
          lineItems: { id: string; name: string; value: number }[];
        }
      >();

      for (const item of snapshotDetail.items) {
        const cat = item.lineItem.category;
        if (!catMap.has(cat.id)) {
          catMap.set(cat.id, {
            id: cat.id,
            name: cat.name,
            type: cat.type,
            color: cat.color,
            total: 0,
            lineItems: [],
          });
        }
        const entry = catMap.get(cat.id)!;
        const value = toNumber(item.value);
        entry.total += value;
        entry.lineItems.push({
          id: item.lineItem.id,
          name: item.lineItem.name,
          value,
        });
      }

      categoryData = Array.from(catMap.values());
    }
  }

  const currentNetWorth = toNumber(latestSnapshot?.netWorth ?? 0);
  const previousNetWorth = toNumber(previousSnapshot?.netWorth ?? 0);
  const change = latestSnapshot ? currentNetWorth - previousNetWorth : 0;
  const changePct = previousSnapshot ? percentChange(currentNetWorth, previousNetWorth) : null;
  const isPositive = change >= 0;
  const isNeutral = change === 0 || !previousSnapshot;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              Good {getGreeting()}, {session.user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              {latestSnapshot
                ? `Last updated ${formatDate(latestSnapshot.date)}`
                : "No snapshots yet — get started below"}
            </p>
          </div>
          <Link
            href="/update"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-warm"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:block">New Snapshot</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Hero net worth card */}
        <Card className="mb-6 bg-gradient-to-br from-primary-600 to-primary-700 border-0 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-primary-200 text-sm font-medium uppercase tracking-wide mb-2">
                Current Net Worth
              </p>
              <p className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                {latestSnapshot
                  ? formatCurrency(currentNetWorth, { currency })
                  : "—"}
              </p>

              {/* Change indicator */}
              {previousSnapshot && (
                <div className="flex items-center gap-2 mt-3">
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${
                      isNeutral
                        ? "bg-white/10 text-white"
                        : isPositive
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-rose-400/20 text-rose-200"
                    }`}
                  >
                    {isNeutral ? (
                      <Minus size={14} />
                    ) : isPositive ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {isNeutral
                      ? "No change"
                      : `${isPositive ? "+" : ""}${formatCurrency(change, { currency })}`}
                    {changePct !== null && !isNeutral && (
                      <span className="opacity-70">
                        ({formatPercent(changePct)})
                      </span>
                    )}
                  </div>
                  <span className="text-primary-300 text-xs">
                    since last snapshot
                  </span>
                </div>
              )}
            </div>

            {/* Quick stats */}
            {latestSnapshot && (
              <div className="flex gap-6 sm:gap-8">
                <div className="text-right">
                  <p className="text-primary-200 text-xs mb-1">Assets</p>
                  <p className="text-xl font-bold text-emerald-300">
                    {formatCurrency(toNumber(latestSnapshot.totalAssets), { currency })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-200 text-xs mb-1">Liabilities</p>
                  <p className="text-xl font-bold text-rose-300">
                    {formatCurrency(toNumber(latestSnapshot.totalLiabs), { currency })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Net worth chart (wider) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Net Worth Over Time</CardTitle>
              <span className="text-xs text-stone-400">
                {allSnapshots.length} snapshot{allSnapshots.length !== 1 ? "s" : ""}
              </span>
            </CardHeader>
            <NetWorthChart
              currency={currency}
              snapshots={allSnapshots.map((s) => ({
                id: s.id,
                date: s.date.toISOString(),
                label: s.label,
                netWorth: toNumber(s.netWorth),
              }))}
            />
          </Card>

          {/* Assets vs Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Assets vs Liabilities</CardTitle>
            </CardHeader>
            <AssetsLiabilitiesChart
              totalAssets={toNumber(latestSnapshot?.totalAssets ?? 0)}
              totalLiabs={toNumber(latestSnapshot?.totalLiabs ?? 0)}
              currency={currency}
            />
          </Card>
        </div>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <span className="text-xs text-stone-400">
              {latestSnapshot
                ? `As of ${formatDate(latestSnapshot.date)}`
                : "Latest snapshot"}
            </span>
          </CardHeader>

          {categoryData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-stone-600 font-medium mb-1">
                Ready to grow your wealth?
              </p>
              <p className="text-stone-400 text-sm mb-6">
                Add your first categories and take a snapshot to get started
              </p>
              <Link
                href="/update"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
              >
                <PlusCircle size={16} />
                Add Your First Snapshot
              </Link>
            </div>
          ) : (
            <CategoryBreakdown categories={categoryData} currency={currency} />
          )}
        </Card>
      </main>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
