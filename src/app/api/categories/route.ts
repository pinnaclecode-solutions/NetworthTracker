import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: {
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, type, color } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 }
    );
  }

  if (type !== "ASSET" && type !== "LIABILITY") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  // Get current max sortOrder for this user
  const maxOrder = await prisma.category.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      type: type as CategoryType,
      color: color || "#0d9488",
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
    include: {
      lineItems: true,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
