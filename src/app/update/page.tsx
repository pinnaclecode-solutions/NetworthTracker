import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { UpdateForm } from "./UpdateForm";
import { toNumber } from "@/lib/utils";

export const metadata = { title: "Update Values — NetWorth Tracker" };

export default async function UpdatePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  // Fetch user currency preference
  const userPrefs = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true },
  });
  const currency = userPrefs?.currency ?? "INR";

  // Fetch categories with line items
  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: {
      lineItems: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // Fetch most recent snapshot values for pre-population
  const latestSnapshot = await prisma.snapshot.findFirst({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: {
      items: {
        select: { lineItemId: true, value: true },
      },
    },
  });

  // Build a map of lineItemId → value
  const latestValues = new Map<string, number>();
  if (latestSnapshot) {
    for (const item of latestSnapshot.items) {
      latestValues.set(item.lineItemId, toNumber(item.value));
    }
  }

  // Serialize for client component
  const initialCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type as "ASSET" | "LIABILITY",
    color: cat.color ?? "#0d9488",
    lineItems: cat.lineItems.map((li) => ({
      id: li.id,
      name: li.name,
      value: latestValues.get(li.id) ?? 0,
    })),
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={session.user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-800">Update Values</h1>
          <p className="text-stone-400 text-sm mt-1">
            Enter your current asset and liability values, then save a snapshot.
          </p>
        </div>
        <UpdateForm initialCategories={initialCategories} currency={currency} />
      </main>
    </div>
  );
}
