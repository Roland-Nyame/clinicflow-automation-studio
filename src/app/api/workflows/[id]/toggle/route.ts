import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleWorkflowActiveForUser } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();
  const active = Boolean(body.active);

  const updated = await toggleWorkflowActiveForUser(user, id, active);
  if (!updated) {
    return NextResponse.json(
      { error: "Workflow not found or access denied for your clinic." },
      { status: 404 }
    );
  }

  return NextResponse.json({ workflow: updated });
}
