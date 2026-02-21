import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { CategoriesClient } from "./CategoriesClient";

export const metadata = { title: "Manage Categories — NetWorth Tracker" };

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: {
      lineItems: { orderBy: { createdAt: "asc" } },
      _count: { select: { lineItems: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const initial = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type as "ASSET" | "LIABILITY",
    color: cat.color ?? "#0d9488",
    lineItemCount: cat._count.lineItems,
    lineItems: cat.lineItems.map((li) => ({ id: li.id, name: li.name })),
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">
            Manage Categories
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Add or rename asset and liability categories. Categories cannot be
            deleted once created.
          </p>
        </div>
        <Card padding="none">
          <CategoriesClient initialCategories={initial} />
        </Card>
      </main>
    </div>
  );
}
