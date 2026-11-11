import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { triggerWorkflowExecutionForUser } from "@/lib/store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let payload: Record<string, unknown> = {};
  try {
    const body = await req.json();
    payload = body.payload || {};
  } catch {
    payload = {};
  }

  const result = await triggerWorkflowExecutionForUser(user, id, payload);
  if (!result) {
    return NextResponse.json(
      { error: "Workflow not found or access denied for your clinic." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    execution: result.execution,
    knowledgeBaseHit: result.knowledgeBaseHit,
  });
}
