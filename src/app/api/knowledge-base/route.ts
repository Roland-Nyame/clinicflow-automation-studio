import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getEngineSettings,
  getKnowledgeBaseForUser,
  syncDirectlyFromN8n,
  syncKnowledgeBaseFromN8nForUser,
  updateKnowledgeBaseForUser,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncDirectlyFromN8n();
  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get("clinicId");
  const kb = getKnowledgeBaseForUser(user, clinicId);
  return NextResponse.json({
    knowledgeBase: kb,
    engineSettings: getEngineSettings(),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const result = await syncKnowledgeBaseFromN8nForUser(user, {
      clinicId: body.clinicId,
      engineUrl: body.engineUrl,
      apiKey: body.apiKey,
    });
    return NextResponse.json({
      ...result,
      engineSettings: getEngineSettings(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to sync Knowledge Base from n8n instance" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const targetClinicId =
      user.role === "super_admin"
        ? body.clinicId || user.clinicId
        : user.clinicId;

    if (!targetClinicId) {
      return NextResponse.json(
        { error: "Clinic ID required" },
        { status: 400 }
      );
    }

    const payload = body.updates || body;
    const updated = updateKnowledgeBaseForUser(user, targetClinicId, payload);
    return NextResponse.json({ knowledgeBase: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to update Knowledge Base" },
      { status: 400 }
    );
  }
}
