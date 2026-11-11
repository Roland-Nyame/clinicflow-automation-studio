import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEngineSettings } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const settings = getEngineSettings();
  return NextResponse.json({
    user,
    portalBrandName: settings.portalBrandName,
  });
}
