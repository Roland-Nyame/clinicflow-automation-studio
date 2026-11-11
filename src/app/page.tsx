"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FolderKanban,
  Globe,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings2,
  Shield,
  Sparkles,
  Upload,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import SuperAdminPanel from "@/components/SuperAdminPanel";
import {
  Clinic,
  SafeUser,
  SanitizedWorkflow,
  WorkflowExecution,
} from "@/lib/types";
import { ClinicKnowledgeBase } from "@/lib/knowledge-base";

type MainWorkspaceView =
  | "editor"
  | "overview"
  | "executions"
  | "knowledge_base"
  | "credentials"
  | "admin";

export default function ClinicFlowStudio() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [portalBrandName, setPortalBrandName] = useState(
    "ClinicFlow Automation Studio"
  );
  const [authChecking, setAuthChecking] = useState(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Studio Navigation State (mimicking n8n's exact layout)
  const [activeView, setActiveView] = useState<MainWorkspaceView>("editor");
  const [editorSubTab, setEditorSubTab] = useState<"canvas" | "executions">(
    "canvas"
  );

  // Portal Data State
  const [workflows, setWorkflows] = useState<SanitizedWorkflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [engineConnection, setEngineConnection] = useState<{
    apiKeyConfigured: boolean;
    liveConnected: boolean;
    lastSyncedAt: string | null;
    lastError: string | null;
  } | null>(null);

  const [selectedClinicFilter, setSelectedClinicFilter] =
    useState<string>("all");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Live Execution / Animation State
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(
    null
  );
  const [activeStepNodeId, setActiveStepNodeId] = useState<string | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null
  );

  // Import / Export Workflow JSON Modal
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInputText, setJsonInputText] = useState("");
  const [newWfTitle, setNewWfTitle] = useState("");

  // Clinic Knowledge Base State
  const [clinicKb, setClinicKb] = useState<ClinicKnowledgeBase | null>(null);
  const [savingKb, setSavingKb] = useState(false);
  const [syncingKbFromN8n, setSyncingKbFromN8n] = useState(false);
  const [showN8nKbConfig, setShowN8nKbConfig] = useState(false);
  const [n8nKbEngineUrl, setN8nKbEngineUrl] = useState("http://localhost:5678");
  const [n8nKbApiKey, setN8nKbApiKey] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("45 mins");
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");

  const fetchClinicKnowledgeBase = useCallback(
    async (clinicIdOverride?: string) => {
      const targetClinic =
        clinicIdOverride ||
        (selectedClinicFilter !== "all" ? selectedClinicFilter : "");
      const res = await fetch(
        `/api/knowledge-base${
          targetClinic ? `?clinicId=${encodeURIComponent(targetClinic)}` : ""
        }`
      );
      if (res.ok) {
        const data = await res.json();
        setClinicKb(data.knowledgeBase || null);
        if (data.engineSettings?.engineUrl) {
          setN8nKbEngineUrl(data.engineSettings.engineUrl);
        }
      }
    },
    [selectedClinicFilter]
  );

  const handleSyncKbFromN8n = async (customUrl?: string, customKey?: string) => {
    setSyncingKbFromN8n(true);
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: clinicKb?.clinicId || selectedClinicFilter,
          engineUrl: customUrl,
          apiKey: customKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.knowledgeBase) {
          setClinicKb(data.knowledgeBase);
        }
        await fetchPortalData();
        setShowN8nKbConfig(false);
        setN8nKbApiKey("");
        notify(
          data.message || "Knowledge Base synced directly from n8n instance!"
        );
      }
    } finally {
      setSyncingKbFromN8n(false);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    if (!clinicKb) return;
    setSavingKb(true);
    try {
      const res = await fetch("/api/knowledge-base", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: clinicKb.clinicId,
          updates: clinicKb,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClinicKb(data.knowledgeBase);
        await fetchPortalData();
        notify(
          `Saved ${clinicKb.clinicName} Knowledge Base & synced to n8n workflow nodes!`
        );
      }
    } finally {
      setSavingKb(false);
    }
  };

  const notify = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const fetchPortalData = useCallback(
    async (clinicFilterOverride?: string) => {
      const filterToUse = clinicFilterOverride ?? selectedClinicFilter;
      const res = await fetch(
        `/api/workflows?clinicId=${encodeURIComponent(filterToUse)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const wfList: SanitizedWorkflow[] = data.workflows || [];
      const execList: WorkflowExecution[] = data.executions || [];
      setWorkflows(wfList);
      setExecutions(execList);
      setClinics(data.clinics || []);
      if (data.engineConnection) {
        setEngineConnection(data.engineConnection);
      }

      setSelectedWorkflowId((prev) => {
        if (prev && wfList.some((w) => w.id === prev)) return prev;
        return wfList[0]?.id || null;
      });
    },
    [selectedClinicFilter]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.portalBrandName) setPortalBrandName(data.portalBrandName);
        }
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPortalData();
      fetchClinicKnowledgeBase();
    }
  }, [user, selectedClinicFilter, fetchPortalData, fetchClinicKnowledgeBase]);

  const handleLogin = async (email: string, password: string) => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Invalid credentials");
        return;
      }
      setUser(data.user);
      setSelectedClinicFilter("all");
      setActiveView("editor");
      setEditorSubTab("canvas");
      setCompletedNodeIds([]);
      setActiveStepNodeId(null);
    } catch {
      setLoginError("Network error while signing in.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setLoginEmail("");
    setLoginPassword("");
    setWorkflows([]);
    setExecutions([]);
    setSelectedWorkflowId(null);
  };

  const handleToggleWorkflow = async (wf: SanitizedWorkflow) => {
    const nextState = !wf.active;
    setWorkflows((prev) =>
      prev.map((item) =>
        item.id === wf.id ? { ...item, active: nextState } : item
      )
    );

    const res = await fetch(`/api/workflows/${wf.id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextState }),
    });
    if (res.ok) {
      notify(
        nextState
          ? `Workflow "${wf.name}" is now Active`
          : `Workflow "${wf.name}" set to Inactive`
      );
    } else {
      await fetchPortalData();
    }
  };

  const handleLocalWorkflowUpdate = (
    wfId: string,
    updates: Partial<SanitizedWorkflow>
  ) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === wfId ? { ...w, ...updates } : w))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveCurrentWorkflow = async () => {
    if (!selectedWorkflow) return;
    setSavingWorkflow(true);
    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
          category: selectedWorkflow.category,
          nodes: selectedWorkflow.nodes,
          edges: selectedWorkflow.edges,
        }),
      });
      if (res.ok) {
        setHasUnsavedChanges(false);
        await fetchClinicKnowledgeBase();
        notify("Workflow saved & Knowledge Base synced from nodes!");
      }
    } finally {
      setSavingWorkflow(false);
    }
  };

  const handleCreateNewWorkflow = async (rawJson?: string, title?: string) => {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: title || undefined,
        category: "WhatsApp Agent",
        rawJson,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchPortalData();
      if (data.workflow?.id) {
        setSelectedWorkflowId(data.workflow.id);
        setActiveView("editor");
        setEditorSubTab("canvas");
      }
      setShowJsonModal(false);
      setJsonInputText("");
      setNewWfTitle("");
      notify("New workflow created in your clinic workspace!");
    }
  };

  const handleRunWorkflow = async (
    wf: SanitizedWorkflow,
    customMessage?: string
  ) => {
    if (runningWorkflowId) return null;
    setRunningWorkflowId(wf.id);
    setCompletedNodeIds([]);
    setActiveStepNodeId(wf.nodes[0]?.id || null);

    const parsedPayload: Record<string, unknown> = {
      channel: wf.category,
      clinic: user?.clinic?.name || wf.clinicId,
      incomingMessage:
        customMessage ||
        "Hi, I'd like to book a dental checkup tomorrow afternoon.",
      timestamp: new Date().toISOString(),
    };

    for (let i = 0; i < wf.nodes.length; i++) {
      const node = wf.nodes[i];
      setActiveStepNodeId(node.id);
      await new Promise((r) => setTimeout(r, 260));
      setCompletedNodeIds((prev) => [...prev, node.id]);
    }
    setActiveStepNodeId(null);

    try {
      const res = await fetch(`/api/workflows/${wf.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedPayload }),
      });

      if (res.ok) {
        const data = await res.json();
        await fetchPortalData();
        if (data.execution?.id) {
          setSelectedExecutionId(data.execution.id);
        }
        notify("Workflow executed & clinic Knowledge Base queried!");
        return data.knowledgeBaseHit || null;
      }
      return null;
    } finally {
      setRunningWorkflowId(null);
    }
  };

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedWorkflow =
    workflows.find((w) => w.id === selectedWorkflowId) ||
    filteredWorkflows[0] ||
    null;

  const workflowExecutions = executions.filter(
    (e) => !selectedWorkflow || e.workflowId === selectedWorkflow.id
  );

  const activeExecution =
    workflowExecutions.find((e) => e.id === selectedExecutionId) ||
    workflowExecutions[0] ||
    null;

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141720] text-slate-400 text-sm">
        Loading Automation Studio...
      </div>
    );
  }

  // ==================== UNAUTHENTICATED LOGIN PORTAL ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-[#ff6d5a]/30">
        {/* Subtle Architectural Grid & Ambient Lighting */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #475569 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -top-48 left-1/3 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-48 right-1/3 w-[500px] h-[500px] bg-[#ff6d5a]/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Top Minimal Enterprise Bar */}
        <header className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6d5a] to-orange-600 flex items-center justify-center shadow-lg shadow-[#ff6d5a]/20 border border-white/10">
              <Workflow className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              {portalBrandName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 backdrop-blur-md border border-slate-800/90 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">
              All Systems Operational
            </span>
          </div>
        </header>

        {/* Centered Professional Authentication Card */}
        <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 my-auto">
          <div className="rounded-3xl border border-slate-800/90 bg-[#151823]/95 backdrop-blur-2xl p-8 sm:p-9 shadow-2xl space-y-6">
            {/* Brand Emblem & Title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6d5a] to-orange-600 flex items-center justify-center shadow-xl shadow-[#ff6d5a]/20 border border-white/10 mx-auto mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-400">
                Enter your email and password to access your workflow studio.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Manual Email & Password Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin(loginEmail, loginPassword);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#ff6d5a] focus:ring-2 focus:ring-[#ff6d5a]/15 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#ff6d5a] focus:ring-2 focus:ring-[#ff6d5a]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-gradient-to-r from-[#ff6d5a] to-orange-600 hover:from-[#ff8271] hover:to-orange-500 text-white font-semibold py-2.5 rounded-xl text-sm shadow-lg shadow-[#ff6d5a]/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 mt-2"
              >
                {loggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by 256-Bit Encrypted Tenant Isolation</span>
            </div>
          </div>
        </main>

        {/* Bottom Enterprise Footer */}
        <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-6 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} {portalBrandName}</span>
          <span>Secure Automation Cloud</span>
        </footer>
      </div>
    );
  }

  // ==================== AUTHENTICATED N8N-MIMIC STUDIO LAYOUT ====================
  const activeClinicBrandColor = user.clinic?.brandColor || "#ff6d5a";

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#141720] flex">
      {/* ==================== LEFT N8N NAVIGATION SIDEBAR ==================== */}
      <aside className="w-64 bg-[#181b26] border-r border-slate-800/90 flex flex-col justify-between shrink-0 select-none">
        <div className="p-3.5 space-y-4 overflow-y-auto">
          {/* Clinic Brand Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{ backgroundColor: activeClinicBrandColor }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0"
              >
                {user.clinic ? user.clinic.logoText : "CF"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.clinic ? user.clinic.name : "ClinicFlow Studio"}
                </p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {user.clinic ? "Isolated Workspace" : "Super Admin"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowJsonModal(true)}
              className="p-1.5 rounded-lg bg-[#ff6d5a] hover:bg-[#ff8271] text-white shadow cursor-pointer"
              title="Add / Import Workflow"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation Items (mimicking n8n left rail) */}
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveView("overview")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === "overview"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-[#ff6d5a]" />
                Overview / Workflows
              </span>
              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                {workflows.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("executions")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === "executions"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Executions
              </span>
              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                {executions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("knowledge_base")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === "knowledge_base"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Knowledge Base
              </span>
              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-sky-300">
                {clinicKb ? `${clinicKb.services.length} items` : "RAG"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("credentials")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === "credentials"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Credentials
              </span>
              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                5
              </span>
            </button>

            {user.role === "super_admin" && (
              <button
                type="button"
                onClick={() => setActiveView("admin")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeView === "admin"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-300 hover:text-white hover:bg-indigo-500/20"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Server className="w-4 h-4" />
                  Live Engine & Clinics
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    engineConnection?.liveConnected
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
              </button>
            )}
          </nav>

          {/* Direct Clinic Workflows List in Sidebar */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {user.clinic
                  ? `${user.clinic.slug.toUpperCase()} WORKFLOWS`
                  : "CLINIC WORKFLOWS"}
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative px-1">
              <Search className="w-3 h-3 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1 max-h-[320px] overflow-y-auto pr-0.5">
              {filteredWorkflows.map((wf) => {
                const isSelected =
                  selectedWorkflow?.id === wf.id && activeView === "editor";
                return (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorkflowId(wf.id);
                      setActiveView("editor");
                      setEditorSubTab("canvas");
                      setCompletedNodeIds([]);
                      setActiveStepNodeId(null);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-slate-800 text-white font-semibold border border-slate-700"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {wf.category.includes("WhatsApp") ? (
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : wf.category.includes("Facebook") ? (
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : wf.category.includes("Instagram") ? (
                        <MessageSquare className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      ) : (
                        <Workflow className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate text-[11px]">{wf.name}</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        wf.active ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                      title={wf.active ? "Active" : "Inactive"}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Footer: User Profile & Sign Out */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== RIGHT MAIN STUDIO WORKSPACE ==================== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* ==================== TOP N8N EDITOR HEADER BAR ==================== */}
        <header className="h-14 bg-[#181b26] border-b border-slate-800/90 px-5 flex items-center justify-between gap-4 shrink-0">
          {/* Left: Workflow Breadcrumb & Editable Name + Tags */}
          <div className="flex items-center gap-3 min-w-0">
            {activeView !== "overview" && (
              <button
                type="button"
                onClick={() => setActiveView("overview")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Back to Workflows Overview"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {activeView === "editor" && selectedWorkflow ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="text"
                  value={selectedWorkflow.name}
                  onChange={(e) =>
                    handleLocalWorkflowUpdate(selectedWorkflow.id, {
                      name: e.target.value,
                    })
                  }
                  className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-[#ff6d5a] focus:outline-none truncate max-w-[340px]"
                />
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {selectedWorkflow.category}
                </span>
                {user.clinic && (
                  <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                    {user.clinic.automationTag}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white capitalize">
                  {activeView === "overview"
                    ? `${
                        user.clinic ? user.clinic.name : "All Clinics"
                      } — Workflows Overview`
                    : activeView}
                </h1>
              </div>
            )}
          </div>

          {/* Center: Iconic n8n 'Editor | Executions' Segmented Switcher */}
          {activeView === "editor" && selectedWorkflow && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setEditorSubTab("canvas")}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  editorSubTab === "canvas"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setEditorSubTab("executions")}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  editorSubTab === "executions"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Executions ({workflowExecutions.length})
              </button>
            </div>
          )}

          {/* Right: n8n Active Switch, Save Button, Import/Export */}
          <div className="flex items-center gap-3 shrink-0">
            {saveToast && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveToast}
              </span>
            )}

            {user.role === "super_admin" && (
              <select
                value={selectedClinicFilter}
                onChange={(e) => setSelectedClinicFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="all">All Clinics ({clinics.length})</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {activeView === "editor" && selectedWorkflow && (
              <>
                {/* n8n Active / Inactive Toggle Switch */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      selectedWorkflow.active
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedWorkflow.active ? "Active" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleWorkflow(selectedWorkflow)}
                    className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                      selectedWorkflow.active
                        ? "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        selectedWorkflow.active
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Import / Export JSON */}
                <button
                  type="button"
                  onClick={() => setShowJsonModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  Import / Export
                </button>

                {/* n8n Coral 'Save' Button */}
                <button
                  type="button"
                  disabled={savingWorkflow}
                  onClick={handleSaveCurrentWorkflow}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    hasUnsavedChanges
                      ? "bg-[#ff6d5a] hover:bg-[#ff8271] text-white shadow-lg shadow-[#ff6d5a]/25"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingWorkflow ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </header>

        {/* ==================== MAIN WORKSPACE BODY ==================== */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* 1. EDITOR VIEW (CANVAS OR WORKFLOW EXECUTIONS SUB-TAB) */}
          {activeView === "editor" && selectedWorkflow && (
            <>
              {editorSubTab === "canvas" ? (
                <WorkflowCanvas
                  workflow={selectedWorkflow}
                  clinicName={
                    user.clinic?.name ||
                    clinics.find((c) => c.id === selectedWorkflow.clinicId)
                      ?.name ||
                    "Dental Clinic"
                  }
                  activeStepNodeId={activeStepNodeId}
                  completedNodeIds={completedNodeIds}
                  latestStepLogs={activeExecution?.steps || []}
                  brandColor={activeClinicBrandColor}
                  onUpdateWorkflow={(updates) =>
                    handleLocalWorkflowUpdate(selectedWorkflow.id, updates)
                  }
                  onRunWorkflow={(customMsg) =>
                    handleRunWorkflow(selectedWorkflow, customMsg)
                  }
                  onSyncKbFromN8n={() => handleSyncKbFromN8n()}
                  isRunning={runningWorkflowId === selectedWorkflow.id}
                />
              ) : (
                /* n8n-Style Split Executions View for Current Workflow */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-122px)]">
                  <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#181b26] p-4 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-white">
                        Executions for {selectedWorkflow.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRunWorkflow(selectedWorkflow)}
                        className="text-xs bg-[#ff6d5a] hover:bg-[#ff8271] text-white px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                      >
                        + Run Now
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {workflowExecutions.map((exec) => (
                        <div
                          key={exec.id}
                          onClick={() => setSelectedExecutionId(exec.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            activeExecution?.id === exec.id
                              ? "bg-sky-500/15 border-sky-500/50 text-white"
                              : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="font-bold">
                                {exec.triggerMode}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                #{exec.id.slice(-6)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {new Date(exec.startedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-emerald-400 font-semibold block">
                              Succeeded ({exec.durationMs}ms)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {exec.steps.length} nodes executed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#181b26] p-5 overflow-y-auto space-y-4">
                    {activeExecution ? (
                      <>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-xs font-semibold text-emerald-400">
                              ✓ Execution Succeeded in{" "}
                              {activeExecution.durationMs}ms
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {activeExecution.workflowName} — Step-by-Step Data
                              Trace
                            </h4>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(
                              activeExecution.startedAt
                            ).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {activeExecution.steps.map((step, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white">
                                  Step {i + 1}: {step.nodeName}{" "}
                                  <span className="text-slate-400 font-normal">
                                    ({step.typeLabel})
                                  </span>
                                </span>
                                <span className="font-mono text-emerald-400">
                                  1 item • {step.durationMs}ms
                                </span>
                              </div>
                              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                {JSON.stringify(step.outputPreview, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20 text-xs text-slate-500">
                        Select an execution on the left to inspect its node
                        outputs.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 2. OVERVIEW / WORKFLOWS LIST VIEW (mimicking n8n's Overview page) */}
          {activeView === "overview" && (
            <div className="max-w-6xl mx-auto space-y-5 py-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {user.clinic
                      ? `${user.clinic.name} — Workflows`
                      : "All Clinic Workflows"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any workflow card to open it in the visual node editor
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJsonModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#ff6d5a] hover:bg-[#ff8271] text-white shadow-lg shadow-[#ff6d5a]/25 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Workflow
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    onClick={() => {
                      setSelectedWorkflowId(wf.id);
                      setActiveView("editor");
                      setEditorSubTab("canvas");
                    }}
                    className="p-4 rounded-2xl bg-[#181b26] border border-slate-800 hover:border-slate-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-white">
                          {wf.name}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                          {wf.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 max-w-2xl">
                        {wf.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {wf.nodes.length} nodes • {wf.metrics.totalRuns} total
                        runs • Last updated{" "}
                        {new Date(wf.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-3 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          wf.active ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {wf.active ? "Active" : "Inactive"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleWorkflow(wf)}
                        className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                          wf.active ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            wf.active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GLOBAL EXECUTIONS VIEW */}
          {activeView === "executions" && (
            <div className="max-w-6xl mx-auto space-y-4 py-2">
              <h2 className="text-xl font-bold text-white">
                {user.clinic
                  ? `${user.clinic.name} — Execution Log History`
                  : "All Clinic Executions"}
              </h2>
              <div className="rounded-2xl border border-slate-800 bg-[#181b26] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Workflow</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Started At</th>
                      <th className="py-3 px-4">Run Time</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {executions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white">
                          {ex.workflowName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            ✓ Succeeded
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {ex.triggerMode}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(ex.startedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {ex.durationMs}ms
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorkflowId(ex.workflowId);
                              setSelectedExecutionId(ex.id);
                              setActiveView("editor");
                              setEditorSubTab("executions");
                            }}
                            className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                          >
                            Inspect Trace →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3.5. CLINIC KNOWLEDGE BASE VIEW (RAG source visited by Live Chat) */}
          {activeView === "knowledge_base" && clinicKb && (
            <div className="max-w-6xl mx-auto space-y-5 py-2">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#181b26] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white">
                        {clinicKb.clinicName} — n8n Instance Knowledge Base
                      </h2>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Synced with n8n Workflow Nodes
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Automatically extracted from{" "}
                      <strong>
                        {clinicKb.n8nSource?.workflowName ||
                          `${clinicKb.clinicName} — WhatsApp AI Agent`}
                      </strong>{" "}
                      (Vector Store:{" "}
                      <code className="text-sky-300 font-mono">
                        {clinicKb.n8nSource?.vectorStoreCollection ||
                          `${clinicKb.clinicId}_kb_vector_store`}
                      </code>
                      ). Live Chat queries this exact n8n Knowledge Base.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={syncingKbFromN8n}
                    onClick={() => handleSyncKbFromN8n()}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        syncingKbFromN8n ? "animate-spin" : ""
                      }`}
                    />
                    {syncingKbFromN8n
                      ? "Pulling KB from n8n..."
                      : "Pull KB from n8n Instance"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowN8nKbConfig((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    n8n Connection
                  </button>

                  <button
                    type="button"
                    disabled={savingKb}
                    onClick={handleSaveKnowledgeBase}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ff6d5a] hover:bg-[#ff8271] text-white shadow-lg shadow-[#ff6d5a]/25 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingKb ? "Saving KB..." : "Save & Sync to Nodes"}
                  </button>
                </div>
              </div>

              {/* Optional Collapsible n8n Instance Connection Form */}
              {showN8nKbConfig && (
                <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-indigo-400" />
                        Connect Live n8n Instance API (Pulls Workflows, AI Agent Prompts &amp; Vector Store KB)
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Enter your n8n URL and X-N8N-API-KEY to pull{" "}
                        {clinicKb.clinicName}&apos;s live workflows, AI Agent{" "}
                        <code>systemMessage</code>, and Vector Store Knowledge Base directly from your n8n server.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowN8nKbConfig(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input
                      type="text"
                      placeholder="n8n Instance URL (e.g. http://localhost:5678 or https://n8n.yourdomain.com)"
                      value={n8nKbEngineUrl}
                      onChange={(e) => setN8nKbEngineUrl(e.target.value)}
                      className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                    <input
                      type="password"
                      placeholder="n8n API Key (X-N8N-API-KEY)"
                      value={n8nKbApiKey}
                      onChange={(e) => setN8nKbApiKey(e.target.value)}
                      className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      disabled={syncingKbFromN8n}
                      onClick={() =>
                        handleSyncKbFromN8n(n8nKbEngineUrl, n8nKbApiKey)
                      }
                      className="md:col-span-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Connect &amp; Pull KB
                    </button>
                  </div>
                </div>
              )}

              {/* n8n Source Provenance & Raw n8n AI Agent System Prompt / Vector Store Inspector */}
              {clinicKb.n8nSource && (
                <div className="p-5 rounded-2xl bg-[#181b26] border border-slate-800 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">
                        n8n Workflow Knowledge Base Source &amp; System Prompt
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                        n8n Workflow ID: #{clinicKb.n8nSource.workflowId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono">
                        Nodes: {clinicKb.n8nSource.kbNodeNames.join(" • ")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    This is the live Knowledge Base prompt &amp; Vector Store
                    document extracted from{" "}
                    <strong>{clinicKb.clinicName}</strong>&apos;s n8n{" "}
                    <strong>AI Agent</strong> and{" "}
                    <strong>Calendar &amp; KB Tool</strong> nodes. Any line you
                    add here or on the workflow canvas is immediately searchable
                    in Live Chat:
                  </p>

                  <textarea
                    rows={6}
                    value={clinicKb.n8nSource.rawSystemPrompt}
                    onChange={(e) =>
                      setClinicKb({
                        ...clinicKb,
                        n8nSource: {
                          ...clinicKb.n8nSource!,
                          rawSystemPrompt: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>
              )}

              {/* Clinic Profile, Location, Hours & Insurance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#181b26] border border-slate-800 space-y-3.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    Location, Hours &amp; Contact Details
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Clinic Address
                    </label>
                    <input
                      type="text"
                      value={clinicKb.address}
                      onChange={(e) =>
                        setClinicKb({ ...clinicKb, address: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={clinicKb.workingHours}
                      onChange={(e) =>
                        setClinicKb({
                          ...clinicKb,
                          workingHours: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={clinicKb.phone}
                        onChange={(e) =>
                          setClinicKb({ ...clinicKb, phone: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Clinic Tagline / Notes
                      </label>
                      <input
                        type="text"
                        value={clinicKb.tagline}
                        onChange={(e) =>
                          setClinicKb({
                            ...clinicKb,
                            tagline: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#181b26] border border-slate-800 space-y-3.5">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Dentists, Insurance &amp; Tomorrow&apos;s Open Slots
                  </h3>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Lead Dentists (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={clinicKb.leadDentists.join(", ")}
                      onChange={(e) =>
                        setClinicKb({
                          ...clinicKb,
                          leadDentists: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Accepted Insurance Providers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={clinicKb.acceptedInsurance.join(", ")}
                      onChange={(e) =>
                        setClinicKb({
                          ...clinicKb,
                          acceptedInsurance: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Available Appointment Slots Tomorrow (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={clinicKb.availableSlotsTomorrow.join(", ")}
                      onChange={(e) =>
                        setClinicKb({
                          ...clinicKb,
                          availableSlotsTomorrow: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Services & Pricing Table */}
              <div className="p-5 rounded-2xl bg-[#181b26] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Dental Services &amp; Pricing Catalog (
                      {clinicKb.services.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live Chat automatically cites these exact prices when
                      patients ask about treatment costs.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clinicKb.services.map((svc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {svc.service}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          {svc.price} • {svc.duration}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setClinicKb({
                            ...clinicKb,
                            services: clinicKb.services.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove service"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Service Row */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Service name (e.g. Pediatric Checkup)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g. GHS 300)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-40 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 30 mins)"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newServiceName.trim() || !newServicePrice.trim())
                        return;
                      setClinicKb({
                        ...clinicKb,
                        services: [
                          ...clinicKb.services,
                          {
                            service: newServiceName.trim(),
                            price: newServicePrice.trim(),
                            duration: newServiceDuration.trim() || "45 mins",
                            details: `Standard ${newServiceName.trim()} procedure at ${clinicKb.clinicName}.`,
                          },
                        ],
                      });
                      setNewServiceName("");
                      setNewServicePrice("");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              {/* Clinic FAQs */}
              <div className="p-5 rounded-2xl bg-[#181b26] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Clinic FAQs &amp; Custom Policies ({clinicKb.faqs.length})
                </h3>
                <div className="space-y-2.5">
                  {clinicKb.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-sky-300">
                          Q: {faq.question}
                        </p>
                        <p className="text-xs text-slate-300">
                          A: {faq.answer}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setClinicKb({
                            ...clinicKb,
                            faqs: clinicKb.faqs.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="Question (e.g. Do you offer payment plans?)"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Answer returned by the AI Agent..."
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    className="md:col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFaqQuestion.trim() || !newFaqAnswer.trim())
                        return;
                      setClinicKb({
                        ...clinicKb,
                        faqs: [
                          ...clinicKb.faqs,
                          {
                            question: newFaqQuestion.trim(),
                            answer: newFaqAnswer.trim(),
                          },
                        ],
                      });
                      setNewFaqQuestion("");
                      setNewFaqAnswer("");
                    }}
                    className="md:col-span-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                  >
                    + Add FAQ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. CREDENTIALS VAULT VIEW (mimicking n8n's Credentials tab, scoped to the logged-in clinic) */}
          {activeView === "credentials" && (
            <div className="max-w-5xl mx-auto space-y-4 py-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user.clinic ? user.clinic.name : "Clinic"} — Connected
                  Credentials
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Encrypted API credentials used by your clinic&apos;s WhatsApp,
                  Facebook, Instagram, and AI Agent workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    name: `${
                      user.clinic ? user.clinic.name : "Clinic"
                    } — WhatsApp Cloud API`,
                    type: "WhatsApp Business Account OAuth2",
                    updated: "Connected & Verified",
                  },
                  {
                    name: `${
                      user.clinic ? user.clinic.name : "Clinic"
                    } — Facebook Page & Messenger Token`,
                    type: "Meta Graph API Credential",
                    updated: "Connected & Verified",
                  },
                  {
                    name: `${
                      user.clinic ? user.clinic.name : "Clinic"
                    } — Instagram Direct API`,
                    type: "Instagram Graph OAuth2",
                    updated: "Connected & Verified",
                  },
                  {
                    name: `${
                      user.clinic ? user.clinic.name : "Clinic"
                    } — OpenAI / LLM Agent Key`,
                    type: "AI Language Model API Key",
                    updated: "Connected & Verified",
                  },
                  {
                    name: `${
                      user.clinic ? user.clinic.name : "Clinic"
                    } — Appointment Calendar & CRM`,
                    type: "Clinic Calendar OAuth2",
                    updated: "Connected & Verified",
                  },
                ].map((cred, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#181b26] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {cred.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">{cred.type}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      ✓ Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SUPER ADMIN & LIVE N8N ENGINE CONNECTION VIEW */}
          {activeView === "admin" && user.role === "super_admin" && (
            <div className="max-w-6xl mx-auto py-2">
              <SuperAdminPanel
                onDataChanged={() => fetchPortalData()}
                onQuickSwitchLogin={(email, password) =>
                  handleLogin(email, password)
                }
              />
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODAL: CREATE / IMPORT / EXPORT WORKFLOW JSON ==================== */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#181b26] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Create, Import, or Export Workflow JSON
                </h3>
                <p className="text-[11px] text-slate-400">
                  Paste any exported workflow JSON to import it directly into{" "}
                  {user.clinic ? user.clinic.name : "this clinic"}, or create a
                  fresh workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workflow Name
              </label>
              <input
                type="text"
                placeholder="e.g. Prodent — TikTok Lead Agent"
                value={newWfTitle}
                onChange={(e) => setNewWfTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff6d5a]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Optional: Paste Workflow JSON to Import
                </label>
                {selectedWorkflow && (
                  <button
                    type="button"
                    onClick={() =>
                      setJsonInputText(
                        JSON.stringify(selectedWorkflow, null, 2)
                      )
                    }
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Load Current Workflow JSON
                  </button>
                )}
              </div>
              <textarea
                rows={7}
                placeholder='{"nodes": [...], "connections": {...}}'
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#ff6d5a]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCreateNewWorkflow(jsonInputText, newWfTitle)
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#ff6d5a] hover:bg-[#ff8271] text-white cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                {jsonInputText.trim()
                  ? "Import JSON into Canvas"
                  : "Create Blank Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
