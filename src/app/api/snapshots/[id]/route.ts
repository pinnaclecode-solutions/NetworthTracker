import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await prisma.snapshot.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          lineItem: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: {
          lineItem: {
            category: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!snapshot || snapshot.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await prisma.snapshot.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!snapshot || snapshot.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.snapshot.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
