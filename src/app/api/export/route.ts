import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshots = await prisma.snapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        include: {
          lineItem: {
            include: {
              category: {
                select: { name: true, type: true },
              },
            },
          },
        },
      },
    },
  });

  // Build CSV
  const rows: string[] = [
    "Snapshot Date,Snapshot Label,Snapshot Note,Type,Category,Line Item,Value",
  ];

  for (const snapshot of snapshots) {
    const date = snapshot.createdAt.toISOString().split("T")[0];
    const label = escapeCsv(snapshot.label ?? "");
    const note = escapeCsv(snapshot.note ?? "");

    for (const item of snapshot.items) {
      const type = item.lineItem.category.type;
      const category = escapeCsv(item.lineItem.category.name);
      const lineItem = escapeCsv(item.lineItem.name);
      const value = Number(item.value).toFixed(2);
      rows.push(`${date},${label},${note},${type},${category},${lineItem},${value}`);
    }

    // Summary row for the snapshot
    rows.push(
      `${date},${label},${note},SUMMARY,Total Assets,,${Number(snapshot.totalAssets).toFixed(2)}`
    );
    rows.push(
      `${date},${label},${note},SUMMARY,Total Liabilities,,${Number(snapshot.totalLiabs).toFixed(2)}`
    );
    rows.push(
      `${date},${label},${note},SUMMARY,Net Worth,,${Number(snapshot.netWorth).toFixed(2)}`
    );
    rows.push(""); // blank separator between snapshots
  }

  const csv = rows.join("\n");
  const filename = `networth-export-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
