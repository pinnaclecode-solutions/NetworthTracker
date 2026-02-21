import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { categoryId, name } = body;

  if (!categoryId || !name) {
    return NextResponse.json(
      { error: "categoryId and name are required" },
      { status: 400 }
    );
  }

  // Verify category belongs to this user
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.userId !== session.user.id) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const lineItem = await prisma.lineItem.create({
    data: {
      categoryId,
      name: name.trim(),
    },
  });

  return NextResponse.json(lineItem, { status: 201 });
}
