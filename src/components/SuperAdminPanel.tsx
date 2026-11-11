"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileCode2,
  KeyRound,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  UserPlus,
  Workflow,
} from "lucide-react";
import {
  Clinic,
  EngineSettings,
  SafeUser,
  SanitizedWorkflow,
} from "@/lib/types";

interface SuperAdminPanelProps {
  onDataChanged: () => void;
  onQuickSwitchLogin: (email: string, password: string) => void;
}

export default function SuperAdminPanel({
  onDataChanged,
  onQuickSwitchLogin,
}: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "clinics" | "users" | "workflows" | "engine"
  >("engine");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [workflows, setWorkflows] = useState<SanitizedWorkflow[]>([]);
  const [engineSettings, setEngineSettings] = useState<EngineSettings | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // New Clinic Form
  const [clinicName, setClinicName] = useState("");
  const [clinicSlug, setClinicSlug] = useState("");
  const [clinicColor, setClinicColor] = useState("#0ea5e9");
  const [clinicLocation, setClinicLocation] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");

  // New User Login Form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userClinicId, setUserClinicId] = useState("clinic-prodent");

  // New / Import Workflow Form
  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfCategory, setWfCategory] = useState("Patient Automation");
  const [wfClinicId, setWfClinicId] = useState("clinic-prodent");
  const [wfTrigger, setWfTrigger] = useState<
    "Webhook" | "Schedule" | "Event" | "Manual"
  >("Webhook");
  const [wfRawJson, setWfRawJson] = useState("");

  // Engine Config Form
  const [engineUrl, setEngineUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [portalBrandName, setPortalBrandName] = useState("");
  const [syncing, setSyncing] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics || []);
        setUsers(data.users || []);
        setWorkflows(data.workflows || []);
        setEngineSettings(data.engineSettings || null);
        if (data.engineSettings) {
          setEngineUrl(data.engineSettings.engineUrl || "");
          setPortalBrandName(data.engineSettings.portalBrandName || "");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName || !clinicSlug) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_clinic",
        name: clinicName,
        slug: clinicSlug,
        brandColor: clinicColor,
        location: clinicLocation,
        contactEmail: clinicEmail,
        automationTag: `clinic:${clinicSlug.toLowerCase()}`,
      }),
    });
    if (res.ok) {
      setClinicName("");
      setClinicSlug("");
      setClinicLocation("");
      setClinicEmail("");
      showNotice(`Clinic "${clinicName}" created with isolated tenant scope!`);
      await fetchAdminData();
      onDataChanged();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !userPassword || !userClinicId) return;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_user",
        name: userName,
        email: userEmail,
        password: userPassword,
        clinicId: userClinicId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      showNotice(`Client login "${userEmail}" provisioned!`);
      await fetchAdminData();
    } else {
      showNotice(data.error || "Failed to create user.");
    }
  };

  const handleAssignWorkflow = async (workflowId: string, clinicId: string) => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign_workflow",
        workflowId,
        clinicId,
      }),
    });
    if (res.ok) {
      const targetClinic = clinics.find((c) => c.id === clinicId);
      showNotice(
        `Workflow reassigned exclusively to ${targetClinic?.name || clinicId}.`
      );
      await fetchAdminData();
      onDataChanged();
    }
  };

  const handleImportWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName && !wfRawJson) return;
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicId: wfClinicId,
        name: wfName || "Imported Clinic Workflow",
        description: wfDesc,
        category: wfCategory,
        triggerType: wfTrigger,
        rawJson: wfRawJson,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setWfName("");
      setWfDesc("");
      setWfRawJson("");
      showNotice(
        "Workflow sanitized (all backend branding stripped) and assigned to clinic!"
      );
      await fetchAdminData();
      onDataChanged();
    } else {
      showNotice(data.error || "Failed to import workflow.");
    }
  };

  const handleSyncEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_engine",
          engineUrl,
          apiKey,
          portalBrandName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey("");
        showNotice(data.message || "Engine settings updated.");
        await fetchAdminData();
        onDataChanged();
      }
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        Loading Super Admin Control Center...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 backdrop-blur-md p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Agency Super Admin
            </span>
            <span className="text-xs text-slate-400">
              Multi-Tenant Isolation & White-Label Engine Mapping
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Clinic Tenants, Client Logins & Workflow Assignment
          </h2>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("clinics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "clinics"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Clinics ({clinics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Clinic Logins ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "workflows"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Workflow Mapping & JSON Import
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "engine"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Hidden Engine Proxy
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 1: CLINICS */}
      {activeTab === "clinics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Active Clinic Tenants
            </h3>
            <div className="space-y-2.5">
              {clinics.map((clinic) => {
                const wfCount = workflows.filter(
                  (w) => w.clinicId === clinic.id
                ).length;
                const userCount = users.filter(
                  (u) => u.clinicId === clinic.id
                ).length;

                return (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-950/90 border border-slate-800"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        style={{ backgroundColor: clinic.brandColor }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      >
                        {clinic.logoText}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {clinic.name}
                          </h4>
                          <span className="text-[11px] font-mono bg-slate-900 text-sky-400 px-2 py-0.5 rounded border border-slate-800">
                            Tag: {clinic.automationTag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {clinic.location} • {clinic.contactEmail}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-white block">
                        {wfCount} Isolated Workflows
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {userCount} Client Login(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleCreateClinic}
            className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Onboard New Clinic
              Tenant
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Clinic Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BrightSmile Dental Care"
                value={clinicName}
                onChange={(e) => {
                  setClinicName(e.target.value);
                  if (!clinicSlug) {
                    setClinicSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, "")
                        .slice(0, 14)
                    );
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Tenant Slug / Tag ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="brightsmile"
                  value={clinicSlug}
                  onChange={(e) => setClinicSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Portal Brand Accent
                </label>
                <input
                  type="color"
                  value={clinicColor}
                  onChange={(e) => setClinicColor(e.target.value)}
                  className="w-full h-8 bg-slate-900 border border-slate-800 rounded-lg px-1 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  placeholder="Miami, FL"
                  value={clinicLocation}
                  onChange={(e) => setClinicLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  placeholder="hello@brightsmile.com"
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
            >
              Create Isolated Clinic Tenant
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: USERS / LOGINS */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Configured Portal Logins (Strict Tenant Mapping)
            </h3>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/90 border border-slate-800"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {u.name}
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {u.role === "super_admin"
                          ? "Super Admin (All Clinics)"
                          : `Locked to: ${u.clinic?.name || u.clinicId}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Login: {u.email}
                    </p>
                  </div>

                  {u.role !== "super_admin" && u.clinic && (
                    <button
                      type="button"
                      onClick={() =>
                        onQuickSwitchLogin(
                          u.email,
                          `${u.clinic?.slug || "clinic"}123`
                        )
                      }
                      className="text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                    >
                      Test {u.clinic.name.split(" ")[0]} Login →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleCreateUser}
            className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" /> Create Clinic
              Client Login
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Assign to Clinic (Strict Data Isolation)
              </label>
              <select
                value={userClinicId}
                onChange={(e) => setUserClinicId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.automationTag})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Client Contact Name
              </label>
              <input
                type="text"
                required
                placeholder="Dr. Sarah Connor"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Login Email
              </label>
              <input
                type="email"
                required
                placeholder="sarah@prodentdental.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Initial Password
              </label>
              <input
                type="text"
                required
                placeholder="prodent2026"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
            >
              Provision Client Login
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WORKFLOW MAPPING & SANITIZED JSON IMPORT */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Assign Workflows to Clinics
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {wf.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {wf.nodes.length} nodes • Trigger: {wf.triggerType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400">Clinic:</span>
                    <select
                      value={wf.clinicId}
                      onChange={(e) =>
                        handleAssignWorkflow(wf.id, e.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleImportWorkflow}
            className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-indigo-400" /> Provision or
              Import Workflow JSON
            </h3>
            <p className="text-[11px] text-slate-400">
              Paste any exported workflow JSON below — our sanitizer
              automatically strips all internal node package names and
              credentials before assigning it to the selected clinic.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Target Clinic
                </label>
                <select
                  value={wfClinicId}
                  onChange={(e) => setWfClinicId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Trigger Type
                </label>
                <select
                  value={wfTrigger}
                  onChange={(e) =>
                    setWfTrigger(
                      e.target.value as
                        | "Webhook"
                        | "Schedule"
                        | "Event"
                        | "Manual"
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  <option value="Webhook">Webhook</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Event">Event</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Client-Facing Workflow Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prodent Implant Lead Follow-Up"
                value={wfName}
                onChange={(e) => setWfName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="What this workflow automates for the clinic..."
                value={wfDesc}
                onChange={(e) => setWfDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Optional: Raw Workflow JSON (Auto-Sanitized)
              </label>
              <textarea
                rows={3}
                placeholder='{"nodes": [...], "connections": {...}}'
                value={wfRawJson}
                onChange={(e) => setWfRawJson(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer"
            >
              Sanitize & Publish to Clinic Portal
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: HIDDEN ENGINE PROXY */}
      {activeTab === "engine" && (
        <form
          onSubmit={handleSyncEngine}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" /> Server-Side
                Automation Engine Connection
              </h3>
              <span className="text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Hidden from Clients
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your backend engine URL and API Key are stored strictly on the
              server. Clients logging into the portal only communicate with{" "}
              <code className="text-sky-300">/api/workflows</code> and never see
              the underlying automation tool.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  White-Label Portal Brand Name
                </label>
                <input
                  type="text"
                  value={portalBrandName}
                  onChange={(e) => setPortalBrandName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Backend Instance Base URL (Server-Only)
                </label>
                <input
                  type="text"
                  value={engineUrl}
                  onChange={(e) => setEngineUrl(e.target.value)}
                  placeholder="http://localhost:5678"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Backend REST API Key ({engineSettings?.apiKeyMasked})
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste X-N8N-API-KEY to sync live workflows..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={syncing}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing
                ? "Saving & Syncing Workflows..."
                : "Save & Sync Workflows by Clinic Tag"}
            </button>
          </div>

          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> How
              White-Label Isolation Works
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>
                  <strong>Tag-Based Tenant Routing:</strong> Tag workflows in
                  your backend engine with{" "}
                  <code className="text-sky-300">clinic:prodent</code> or assign
                  them directly in this Admin Center.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>
                  <strong>Server-Side Sanitizer:</strong> Strips{" "}
                  <code className="text-rose-300">n8n-nodes-base.*</code>,
                  webhook hostnames, and API credentials before any response
                  leaves the server.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>
                  <strong>Zero Cross-Clinic Leakage:</strong> When{" "}
                  <code className="text-sky-300">prodent@prodentdental.com</code>{" "}
                  logs in, the session token scopes every API query to{" "}
                  <code className="text-emerald-300">clinic-prodent</code>.
                </span>
              </li>
            </ul>
          </div>
        </form>
      )}
    </div>
  );
}
