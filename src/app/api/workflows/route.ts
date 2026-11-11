import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createWorkflowForUser,
  getAllClinics,
  getEngineSettings,
  getExecutionsForUser,
  getWorkflowsForUser,
} from "@/lib/store";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clinicFilter = searchParams.get("clinicId");
  const workflowIdFilter = searchParams.get("workflowId");

  const workflows = await getWorkflowsForUser(user, clinicFilter);
  const executions = getExecutionsForUser(user, workflowIdFilter, clinicFilter);
  const engineSettings = getEngineSettings();

  const clinics =
    user.role === "super_admin"
      ? getAllClinics()
      : user.clinic
      ? [user.clinic]
      : [];

  return NextResponse.json({
    workflows,
    executions,
    clinics,
    engineConnection: {
      apiKeyConfigured: engineSettings.apiKeyConfigured,
      liveConnected: Boolean(engineSettings.liveConnected),
      lastSyncedAt: engineSettings.lastSyncedAt,
      lastError: user.role === "super_admin" ? engineSettings.lastError : null,
    },
    tenantIsolation: {
      enforced: true,
      scopedClinicId:
        user.role === "super_admin" ? clinicFilter || "all" : user.clinicId,
      engineLabel: "ClinicFlow Automation Runtime",
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const wf = createWorkflowForUser(user, {
      clinicId: body.clinicId,
      name: body.name,
      category: body.category,
      rawJson: body.rawJson,
    });
    return NextResponse.json({ workflow: wf });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to provision clinic workflow.",
      },
      { status: 400 }
    );
  }
}
