import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshots = await prisma.snapshot.findMany({
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
      createdAt: true,
      _count: {
        select: { items: true },
      },
    },
  });

  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { label, note, items, date } = body as {
    label?: string;
    note?: string;
    date?: string;
    items: { lineItemId: string; value: number }[];
  };

  // Parse user-supplied date; fall back to now
  const snapshotDate = date ? new Date(date) : new Date();
  if (isNaN(snapshotDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "At least one item is required" },
      { status: 400 }
    );
  }

  // Verify all line items belong to this user and get category type
  const lineItemIds = items.map((i) => i.lineItemId);
  const lineItems = await prisma.lineItem.findMany({
    where: { id: { in: lineItemIds } },
    include: { category: { select: { userId: true, type: true } } },
  });

  // Ensure all line items belong to user
  const unauthorized = lineItems.some(
    (li) => li.category.userId !== session.user.id
  );
  if (unauthorized || lineItems.length !== lineItemIds.length) {
    return NextResponse.json({ error: "Invalid line items" }, { status: 403 });
  }

  // Calculate totals
  const lineItemMap = new Map(lineItems.map((li) => [li.id, li]));
  let totalAssets = 0;
  let totalLiabs = 0;

  for (const item of items) {
    const li = lineItemMap.get(item.lineItemId);
    if (!li) continue;
    const value = Number(item.value) || 0;
    if (li.category.type === CategoryType.ASSET) {
      totalAssets += value;
    } else {
      totalLiabs += value;
    }
  }

  const netWorth = totalAssets - totalLiabs;

  // Create snapshot with all items in a transaction
  const snapshot = await prisma.$transaction(async (tx) => {
    const snap = await tx.snapshot.create({
      data: {
        userId: session.user.id,
        label: label?.trim() || null,
        note: note?.trim() || null,
        totalAssets,
        totalLiabs,
        netWorth,
        date: snapshotDate,
      },
    });

    await tx.snapshotItem.createMany({
      data: items.map((item) => ({
        snapshotId: snap.id,
        lineItemId: item.lineItemId,
        value: Number(item.value) || 0,
      })),
    });

    return snap;
  });

  return NextResponse.json(snapshot, { status: 201 });
}
