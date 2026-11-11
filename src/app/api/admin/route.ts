import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  assignWorkflowToClinic,
  createClinic,
  createClinicUser,
  getAllClinics,
  getAllUsersSafe,
  getEngineSettings,
  getWorkflowsForUser,
  updateAndSyncEngineSettings,
} from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Super Admin access required." },
      { status: 403 }
    );
  }

  const workflows = await getWorkflowsForUser(user, "all");

  return NextResponse.json({
    clinics: getAllClinics(),
    users: getAllUsersSafe(),
    workflows,
    engineSettings: getEngineSettings(),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create_clinic") {
      const clinic = createClinic({
        name: body.name,
        slug: body.slug,
        brandColor: body.brandColor || "#0ea5e9",
        contactEmail: body.contactEmail || "",
        location: body.location || "",
        automationTag: body.automationTag || `clinic:${body.slug}`,
      });
      return NextResponse.json({ clinic });
    }

    if (action === "create_user") {
      const createdUser = createClinicUser({
        name: body.name,
        email: body.email,
        password: body.password,
        clinicId: body.clinicId,
        role: body.role || "clinic_admin",
      });
      return NextResponse.json({ user: createdUser });
    }

    if (action === "assign_workflow") {
      const wf = assignWorkflowToClinic(body.workflowId, body.clinicId);
      return NextResponse.json({ workflow: wf });
    }

    if (action === "sync_engine") {
      const result = await updateAndSyncEngineSettings({
        engineUrl: body.engineUrl,
        apiKey: body.apiKey,
        portalBrandName: body.portalBrandName,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Admin operation failed.",
      },
      { status: 400 }
    );
  }
}
