import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateWorkflowForUser } from "@/lib/store";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body = await req.json();
    const updated = updateWorkflowForUser(user, id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Workflow not found or access denied." },
        { status: 404 }
      );
    }
    return NextResponse.json({ workflow: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to save workflow." },
      { status: 400 }
    );
  }
}
