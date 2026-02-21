import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";
import { Clock, PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import { DeleteSnapshotButton } from "./DeleteSnapshotButton";

export const metadata = { title: "Snapshot History — NetWorth Tracker" };

export default async function SnapshotsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const [userPrefs, snapshots] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true },
    }),
    prisma.snapshot.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        label: true,
        note: true,
        totalAssets: true,
        totalLiabs: true,
        netWorth: true,
        date: true,
        _count: { select: { items: true } },
      },
    }),
  ]);
  const currency = userPrefs?.currency ?? "INR";

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              Snapshot History
            </h1>
            <p className="text-stone-400 text-sm mt-1">
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}{" "}
              recorded
            </p>
          </div>
          <Link
            href="/update"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-warm"
          >
            <PlusCircle size={16} />
            New Snapshot
          </Link>
        </div>

        {snapshots.length === 0 ? (
          <Card className="text-center py-16">
            <Clock size={40} className="mx-auto text-stone-300 mb-3" />
            <p className="text-stone-600 font-medium mb-1">No snapshots yet</p>
            <p className="text-stone-400 text-sm mb-6">
              Take your first snapshot to start building your financial history
            </p>
            <Link
              href="/update"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              <PlusCircle size={16} />
              Take First Snapshot
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshots.map((snap, index) => {
              const netWorth = toNumber(snap.netWorth);
              const prevSnap = snapshots[index + 1];
              const prevNetWorth = prevSnap ? toNumber(prevSnap.netWorth) : null;
              const change =
                prevNetWorth !== null ? netWorth - prevNetWorth : null;
              const isPositive = change !== null ? change >= 0 : true;

              return (
                <Card key={snap.id} padding="none" className="overflow-hidden">
                  <div className="flex items-stretch">
                    {/* Color bar */}
                    <div
                      className={`w-1.5 flex-shrink-0 ${
                        netWorth >= 0 ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />

                    <div className="flex-1 px-5 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        {/* Left: date, label, meta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-stone-700">
                              {formatDate(snap.date)}
                            </p>
                            {index === 0 && (
                              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                Latest
                              </span>
                            )}
                            {snap.label && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full truncate max-w-[200px]">
                                {snap.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5">
                            <span className="text-xs text-stone-400">
                              {snap._count.items} item{snap._count.items !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-emerald-600">
                              Assets: {formatCurrency(toNumber(snap.totalAssets), { currency })}
                            </span>
                            <span className="text-xs text-rose-500">
                              Liab: {formatCurrency(toNumber(snap.totalLiabs), { currency })}
                            </span>
                          </div>
                          {snap.note && (
                            <p className="text-xs text-stone-400 mt-1 italic truncate max-w-sm">
                              "{snap.note}"
                            </p>
                          )}
                        </div>

                        {/* Right: net worth + actions */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold tabular-nums ${
                                netWorth >= 0
                                  ? "text-stone-800"
                                  : "text-rose-600"
                              }`}
                            >
                              {formatCurrency(netWorth, { currency })}
                            </p>
                            {change !== null && (
                              <div
                                className={`flex items-center gap-1 text-xs font-medium justify-end ${
                                  isPositive
                                    ? "text-emerald-500"
                                    : "text-rose-500"
                                }`}
                              >
                                {isPositive ? (
                                  <TrendingUp size={11} />
                                ) : (
                                  <TrendingDown size={11} />
                                )}
                                {change >= 0 ? "+" : ""}
                                {formatCurrency(change, { currency })}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/snapshots/${snap.id}`}
                              className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                            >
                              View
                            </Link>
                            <DeleteSnapshotButton snapshotId={snap.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
