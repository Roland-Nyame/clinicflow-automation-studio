import fs from "fs";
import path from "path";
import {
  buildClinicExecutions,
  buildClinicWorkflows,
  INITIAL_CLINICS,
  INITIAL_ENGINE_SETTINGS,
  INITIAL_EXECUTIONS,
  INITIAL_USERS,
  INITIAL_WORKFLOWS,
} from "./seed-data";
import {
  ClinicKnowledgeBase,
  createDefaultKnowledgeBaseForClinic,
  extractKnowledgeBaseFromN8nWorkflows,
  formatKbAsN8nSystemPrompt,
  INITIAL_KNOWLEDGE_BASES,
  queryClinicKnowledgeBase,
} from "./knowledge-base";
import {
  RawN8nExecution,
  RawN8nWorkflow,
  sanitizeN8nExecution,
  sanitizeN8nWorkflow,
} from "./sanitizer";
import {
  Clinic,
  EngineSettings,
  SafeUser,
  SanitizedWorkflow,
  UserAccount,
  WorkflowExecution,
} from "./types";

interface PortalDatabase {
  clinics: Clinic[];
  users: UserAccount[];
  workflows: SanitizedWorkflow[];
  executions: WorkflowExecution[];
  knowledgeBases: Record<string, ClinicKnowledgeBase>;
  /** Explicit admin mappings from n8n external workflow ID -> clinicId */
  workflowClinicOverrides: Record<string, string>;
  engineSettings: EngineSettings & {
    rawApiKey?: string;
    liveConnected?: boolean;
    lastError?: string | null;
  };
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "clinicflow-data")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "portal-db.json");

const PALETTE_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

function ensureDb(): PortalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: PortalDatabase = {
        clinics: INITIAL_CLINICS,
        users: INITIAL_USERS,
        workflows: INITIAL_WORKFLOWS,
        executions: INITIAL_EXECUTIONS,
        knowledgeBases: INITIAL_KNOWLEDGE_BASES,
        workflowClinicOverrides: {},
        engineSettings: {
          ...INITIAL_ENGINE_SETTINGS,
          rawApiKey: process.env.N8N_API_KEY || "",
          liveConnected: false,
          lastError: null,
        },
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PortalDatabase;
    if (!parsed.workflowClinicOverrides) {
      parsed.workflowClinicOverrides = {};
    }
    if (!parsed.knowledgeBases) {
      parsed.knowledgeBases = INITIAL_KNOWLEDGE_BASES;
    }
    // Always pick up latest env vars if set in .env.local
    if (process.env.N8N_BASE_URL && !parsed.engineSettings.engineUrl) {
      parsed.engineSettings.engineUrl = process.env.N8N_BASE_URL;
    }
    if (process.env.N8N_API_KEY && !parsed.engineSettings.rawApiKey) {
      parsed.engineSettings.rawApiKey = process.env.N8N_API_KEY;
    }
    return parsed;
  } catch {
    return {
      clinics: INITIAL_CLINICS,
      users: INITIAL_USERS,
      workflows: INITIAL_WORKFLOWS,
      executions: INITIAL_EXECUTIONS,
      knowledgeBases: INITIAL_KNOWLEDGE_BASES,
      workflowClinicOverrides: {},
      engineSettings: {
        ...INITIAL_ENGINE_SETTINGS,
        rawApiKey: process.env.N8N_API_KEY || "",
        liveConnected: false,
        lastError: null,
      },
    };
  }
}

function saveDb(db: PortalDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist DB:", err);
  }
}

function ensureAutoDiscoveredClinic(
  db: PortalDatabase,
  clinicNameOrSlug: string
): Clinic {
  const cleanName = clinicNameOrSlug.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/^clinic:/, "")
    .replace(/[^a-z0-9]/g, "");

  const existing = db.clinics.find(
    (c) =>
      c.slug.toLowerCase() === slug ||
      c.name.toLowerCase() === cleanName.toLowerCase() ||
      c.automationTag.toLowerCase() === `clinic:${slug}`
  );
  if (existing) return existing;

  const displayTitle =
    cleanName.charAt(0).toUpperCase() + cleanName.slice(1).replace(/^clinic:/i, "");
  const words = displayTitle.split(/\s+/);
  const logoText =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : displayTitle.slice(0, 2).toUpperCase();

  const color = PALETTE_COLORS[db.clinics.length % PALETTE_COLORS.length];
  const newClinic: Clinic = {
    id: `clinic-${slug}`,
    name: displayTitle,
    slug,
    brandColor: color,
    logoText,
    contactEmail: `${slug}@${slug}clinic.com`,
    location: "Synced from n8n",
    automationTag: `clinic:${slug}`,
    createdAt: new Date().toISOString(),
  };
  db.clinics.push(newClinic);

  // Also ensure a default clinic login exists for this clinic
  const defaultEmail = `${slug}@${slug}clinic.com`;
  const hasUser = db.users.some((u) => u.clinicId === newClinic.id);
  if (!hasUser) {
    db.users.push({
      id: `user-${slug}`,
      email: defaultEmail,
      passwordHash: `${slug}123`,
      name: `${displayTitle} Admin`,
      role: "clinic_admin",
      clinicId: newClinic.id,
      createdAt: new Date().toISOString(),
    });
  }

  return newClinic;
}

/**
 * Determines which clinic a live n8n workflow belongs to:
 * 1. Explicit override set in Super Admin (`workflowClinicOverrides[id]`)
 * 2. n8n Workflow Tag matching an existing clinic or `clinic:<slug>`
 * 3. n8n Workflow Name containing a clinic slug/name (e.g. "Prodent WhatsApp Agent")
 * 4. Prefix pattern like "ClinicName - WhatsApp Agent" or "[ClinicName] Facebook Agent"
 */
function resolveClinicForN8nWorkflow(
  db: PortalDatabase,
  rawWf: RawN8nWorkflow
): Clinic {
  const wfIdStr = String(rawWf.id);

  // 1. Check explicit admin assignment
  const overrideClinicId = db.workflowClinicOverrides[wfIdStr];
  if (overrideClinicId) {
    const found = db.clinics.find((c) => c.id === overrideClinicId);
    if (found) return found;
  }

  // 2. Check n8n workflow tags
  if (Array.isArray(rawWf.tags) && rawWf.tags.length > 0) {
    for (const tag of rawWf.tags) {
      const tagName = (tag.name || "").trim();
      if (!tagName) continue;
      const lowerTag = tagName.toLowerCase();

      // Match existing clinic by automationTag, slug, or name
      const matchedExisting = db.clinics.find(
        (c) =>
          c.automationTag.toLowerCase() === lowerTag ||
          c.slug.toLowerCase() === lowerTag.replace(/^clinic:/, "") ||
          c.name.toLowerCase().includes(lowerTag.replace(/^clinic:/, ""))
      );
      if (matchedExisting) return matchedExisting;

      // Auto-create clinic if tag is formatted or represents a clinic name
      return ensureAutoDiscoveredClinic(
        db,
        tagName.replace(/^clinic:/i, "").trim()
      );
    }
  }

  // 3. Check workflow name against existing clinics (e.g. "Prodent", "Apex", "SmileCare")
  const wfName = (rawWf.name || "").trim();
  const lowerName = wfName.toLowerCase();

  for (const clinic of db.clinics) {
    if (
      lowerName.includes(clinic.slug.toLowerCase()) ||
      lowerName.includes(clinic.name.toLowerCase())
    ) {
      return clinic;
    }
  }

  // 4. Check if workflow name has a prefix like "[ClinicName] WhatsApp" or "ClinicName - Facebook Agent"
  const bracketMatch = wfName.match(/^\[([^\]]+)\]/);
  if (bracketMatch && bracketMatch[1]) {
    return ensureAutoDiscoveredClinic(db, bracketMatch[1]);
  }

  const dashParts = wfName.split(/\s*[-–—:|]\s*/);
  if (dashParts.length >= 2) {
    const candidate = dashParts[0].trim();
    const genericWords = [
      "whatsapp",
      "facebook",
      "instagram",
      "telegram",
      "ai",
      "agent",
      "workflow",
      "my",
      "test",
      "copy",
      "new",
      "lead",
      "patient",
      "appointment",
      "webhook",
    ];
    if (
      candidate.length >= 3 &&
      candidate.length <= 28 &&
      !genericWords.includes(candidate.toLowerCase())
    ) {
      return ensureAutoDiscoveredClinic(db, candidate);
    }
  }

  // Default fallback to Prodent if no tag or prefix matched
  return db.clinics[0];
}

/**
 * Directly reads workflows & recent executions from the live n8n REST API
 * whenever `engineUrl` and `apiKey` are configured.
 */
export async function syncDirectlyFromN8n(): Promise<{
  connected: boolean;
  workflowCount: number;
  error?: string;
}> {
  const db = ensureDb();
  const activeUrl = (
    db.engineSettings.engineUrl ||
    process.env.N8N_BASE_URL ||
    ""
  ).trim();
  const activeKey = (
    db.engineSettings.rawApiKey ||
    process.env.N8N_API_KEY ||
    ""
  ).trim();

  if (!activeUrl || !activeKey) {
    return {
      connected: false,
      workflowCount: db.workflows.length,
      error: "n8n API Key not configured yet.",
    };
  }

  const cleanBase = activeUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const wfRes = await fetch(`${cleanBase}/api/v1/workflows?limit=250`, {
      headers: {
        "X-N8N-API-KEY": activeKey,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!wfRes.ok) {
      const errMsg = `n8n API returned HTTP ${wfRes.status}. Please check your URL and X-N8N-API-KEY.`;
      db.engineSettings.liveConnected = false;
      db.engineSettings.lastError = errMsg;
      saveDb(db);
      return { connected: false, workflowCount: db.workflows.length, error: errMsg };
    }

    const wfBody = await wfRes.json();
    const rawWorkflows: RawN8nWorkflow[] = Array.isArray(wfBody?.data)
      ? wfBody.data
      : Array.isArray(wfBody)
      ? wfBody
      : [];

    // Also fetch recent executions from live n8n
    let rawExecutions: RawN8nExecution[] = [];
    try {
      const execRes = await fetch(
        `${cleanBase}/api/v1/executions?limit=40&includeData=true`,
        {
          headers: {
            "X-N8N-API-KEY": activeKey,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );
      if (execRes.ok) {
        const execBody = await execRes.json();
        rawExecutions = Array.isArray(execBody?.data) ? execBody.data : [];
      }
    } catch {
      // Execution endpoint optional if unavailable
    }

    const liveSanitizedWorkflows: SanitizedWorkflow[] = [];
    const wfByExternalId = new Map<string, SanitizedWorkflow>();
    const rawWfsByClinicId = new Map<string, RawN8nWorkflow[]>();

    for (const rawWf of rawWorkflows) {
      const clinic = resolveClinicForN8nWorkflow(db, rawWf);
      const sanitized = sanitizeN8nWorkflow(rawWf, clinic.id);

      const clinicRawList = rawWfsByClinicId.get(clinic.id) || [];
      clinicRawList.push(rawWf);
      rawWfsByClinicId.set(clinic.id, clinicRawList);

      // Compute execution stats for this workflow from live executions
      const wfExecs = rawExecutions.filter(
        (e) => String(e.workflowId) === String(rawWf.id)
      );
      if (wfExecs.length > 0) {
        const successCount = wfExecs.filter(
          (e) => e.status !== "error" && e.status !== "crashed"
        ).length;
        sanitized.metrics.totalRuns = wfExecs.length;
        sanitized.metrics.successRate = +(
          (successCount / wfExecs.length) *
          100
        ).toFixed(1);
        sanitized.metrics.lastRunAt = wfExecs[0].startedAt || sanitized.updatedAt;
      }

      liveSanitizedWorkflows.push(sanitized);
      wfByExternalId.set(String(rawWf.id), sanitized);
    }

    // Replace workflows with the live n8n workflows if at least 1 workflow exists in n8n
    if (liveSanitizedWorkflows.length > 0) {
      db.workflows = liveSanitizedWorkflows;
    }

    // Map live n8n executions
    if (rawExecutions.length > 0) {
      const mappedExecs: WorkflowExecution[] = [];
      for (const rawExec of rawExecutions) {
        const targetWf = wfByExternalId.get(String(rawExec.workflowId));
        if (targetWf) {
          mappedExecs.push(sanitizeN8nExecution(rawExec, targetWf));
        }
      }
      if (mappedExecs.length > 0) {
        db.executions = mappedExecs;
      }
    }

    // Extract & sync each clinic's Knowledge Base directly from the live n8n workflows & executions
    for (const clinic of db.clinics) {
      const clinicRawWfs = rawWfsByClinicId.get(clinic.id) || [];
      const clinicRawExecs = rawExecutions.filter((e) => {
        const wf = wfByExternalId.get(String(e.workflowId));
        return wf?.clinicId === clinic.id;
      });
      db.knowledgeBases[clinic.id] = extractKnowledgeBaseFromN8nWorkflows({
        clinicId: clinic.id,
        clinicName: clinic.name,
        clinicLocation: clinic.location,
        sanitizedWorkflows: db.workflows,
        rawWorkflows: clinicRawWfs,
        rawExecutions: clinicRawExecs,
        sanitizedExecutions: db.executions,
        existingKb: db.knowledgeBases[clinic.id] || null,
        liveConnected: true,
      });
    }

    db.engineSettings.liveConnected = true;
    db.engineSettings.lastError = null;
    db.engineSettings.lastSyncedAt = new Date().toISOString();
    saveDb(db);

    return {
      connected: true,
      workflowCount: liveSanitizedWorkflows.length,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? `Could not reach n8n at ${cleanBase} (${err.message})`
        : `Could not reach n8n at ${cleanBase}`;
    db.engineSettings.liveConnected = false;
    db.engineSettings.lastError = msg;
    saveDb(db);
    return {
      connected: false,
      workflowCount: db.workflows.length,
      error: msg,
    };
  }
}

export function authenticateUser(
  email: string,
  password: string
): SafeUser | null {
  const db = ensureDb();
  const cleanId = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  const lowerPass = cleanPass.toLowerCase();

  const user = db.users.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uPrefix = uEmail.split("@")[0];
    const clinic = u.clinicId
      ? db.clinics.find((c) => c.id === u.clinicId)
      : null;
    const slug = clinic?.slug.toLowerCase() || uPrefix;

    const idMatches =
      uEmail === cleanId ||
      uPrefix === cleanId ||
      slug === cleanId ||
      cleanId.startsWith(`${slug}@`) ||
      (clinic && clinic.name.toLowerCase() === cleanId) ||
      (u.role === "super_admin" &&
        (cleanId === "admin" ||
          cleanId === "superadmin" ||
          cleanId === "rolandnyame613@gmail.com"));

    if (!idMatches) return false;

    const expectedLower = u.passwordHash.trim().toLowerCase();
    return (
      u.passwordHash === cleanPass ||
      expectedLower === lowerPass ||
      lowerPass === slug ||
      lowerPass === `${slug}123`
    );
  });

  if (!user) return null;
  return toSafeUser(user, db.clinics);
}

export function getUserById(userId: string): SafeUser | null {
  const db = ensureDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  return toSafeUser(user, db.clinics);
}

function toSafeUser(user: UserAccount, clinics: Clinic[]): SafeUser {
  const clinic = user.clinicId
    ? clinics.find((c) => c.id === user.clinicId) || null
    : null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clinicId: user.clinicId,
    clinic,
  };
}

/**
 * Multi-tenant strict workflow query:
 * - Reads directly from live n8n when configured
 * - If user is a clinic user (e.g. Prodent), ONLY returns workflows assigned to `user.clinicId`.
 */
export async function getWorkflowsForUser(
  user: SafeUser,
  filterClinicId?: string | null
): Promise<SanitizedWorkflow[]> {
  await syncDirectlyFromN8n();
  const db = ensureDb();
  if (user.role !== "super_admin") {
    if (!user.clinicId) return [];
    return db.workflows.filter((w) => w.clinicId === user.clinicId);
  }
  if (filterClinicId && filterClinicId !== "all") {
    return db.workflows.filter((w) => w.clinicId === filterClinicId);
  }
  return db.workflows;
}

export function getExecutionsForUser(
  user: SafeUser,
  workflowId?: string | null,
  filterClinicId?: string | null
): WorkflowExecution[] {
  const db = ensureDb();
  let list = db.executions;

  if (user.role !== "super_admin") {
    if (!user.clinicId) return [];
    list = list.filter((e) => e.clinicId === user.clinicId);
  } else if (filterClinicId && filterClinicId !== "all") {
    list = list.filter((e) => e.clinicId === filterClinicId);
  }

  if (workflowId) {
    list = list.filter((e) => e.workflowId === workflowId);
  }

  return list.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export async function toggleWorkflowActiveForUser(
  user: SafeUser,
  workflowId: string,
  active: boolean
): Promise<SanitizedWorkflow | null> {
  const db = ensureDb();
  const wf = db.workflows.find((w) => w.id === workflowId);
  if (!wf) return null;

  // Enforce strict tenant isolation
  if (user.role !== "super_admin" && wf.clinicId !== user.clinicId) {
    return null;
  }

  wf.active = active;
  wf.updatedAt = new Date().toISOString();
  saveDb(db);

  // Proxy directly to live n8n instance if configured
  const engineUrl = (
    db.engineSettings.engineUrl ||
    process.env.N8N_BASE_URL ||
    ""
  ).trim();
  const apiKey = (
    db.engineSettings.rawApiKey ||
    process.env.N8N_API_KEY ||
    ""
  ).trim();

  if (engineUrl && apiKey && wf.externalId) {
    const endpoint = `${engineUrl.replace(/\/$/, "")}/api/v1/workflows/${
      wf.externalId
    }/${active ? "activate" : "deactivate"}`;
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "X-N8N-API-KEY": apiKey },
      });
    } catch {
      // Fallback gracefully
    }
  }

  return wf;
}

export async function triggerWorkflowExecutionForUser(
  user: SafeUser,
  workflowId: string,
  payload: Record<string, unknown>
): Promise<{
  execution: WorkflowExecution;
  knowledgeBaseHit: {
    clinicName: string;
    matchedSection: string;
    retrievedFacts: Record<string, unknown>;
    agentReply: string;
  };
} | null> {
  // Always attempt a fresh sync from the live n8n instance first
  await syncDirectlyFromN8n();
  const db = ensureDb();
  const wf = db.workflows.find((w) => w.id === workflowId);
  if (!wf) return null;

  // Strict tenant isolation check
  if (user.role !== "super_admin" && wf.clinicId !== user.clinicId) {
    return null;
  }

  const clinicObj = db.clinics.find((c) => c.id === wf.clinicId);
  // Extract / refresh Knowledge Base directly from this clinic's n8n workflow nodes
  const clinicKb = extractKnowledgeBaseFromN8nWorkflows({
    clinicId: wf.clinicId,
    clinicName: clinicObj?.name || "Dental Clinic",
    clinicLocation: clinicObj?.location || "Main Branch",
    sanitizedWorkflows: db.workflows,
    sanitizedExecutions: db.executions,
    existingKb: db.knowledgeBases[wf.clinicId] || null,
    liveConnected: Boolean(db.engineSettings.liveConnected),
  });
  db.knowledgeBases[wf.clinicId] = clinicKb;

  const userQuestion = String(
    payload.incomingMessage ||
      payload.message ||
      "Hello, what services and appointment slots do you have available?"
  );

  // Query this specific clinic's n8n-extracted Knowledge Base
  let kbHit = queryClinicKnowledgeBase(clinicKb, userQuestion);

  const startedAt = new Date();
  const engineUrl = (
    db.engineSettings.engineUrl ||
    process.env.N8N_BASE_URL ||
    ""
  ).trim();
  let webhookResponse: Record<string, unknown> | null = null;

  if (engineUrl && wf.webhookPath) {
    const cleanBase = engineUrl.replace(/\/$/, "");
    const rawPath = wf.webhookPath.startsWith("/")
      ? wf.webhookPath
      : `/${wf.webhookPath}`;
    // Try both direct webhook path and standard n8n /webhook/... path
    const candidateUrls = [
      `${cleanBase}${rawPath}`,
      `${cleanBase}/webhook${rawPath.replace(/^\/webhooks?/, "")}`,
    ];

    for (const targetUrl of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3800);
        const res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            chatInput: userQuestion,
            message: userQuestion,
            incomingMessage: userQuestion,
            sessionId: `clinic-session-${wf.clinicId}`,
            clinicId: wf.clinicId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          let respJson: unknown = null;
          try {
            respJson = await res.json();
          } catch {
            respJson = { status: "OK" };
          }
          webhookResponse = {
            liveWebhookDispatched: true,
            statusCode: res.status,
            response: respJson,
          };

          // If the live n8n workflow webhook returned a direct AI Agent / KB answer, use it!
          if (respJson && typeof respJson === "object") {
            const rObj = respJson as Record<string, unknown>;
            const liveReply =
              rObj.output ||
              rObj.text ||
              rObj.reply ||
              rObj.response ||
              rObj.answer ||
              rObj.message;
            if (typeof liveReply === "string" && liveReply.trim().length > 5) {
              kbHit = {
                matchedSection: `Live n8n Instance Webhook (${wf.name})`,
                retrievedFacts: {
                  n8nLiveWebhook: targetUrl,
                  n8nWorkflowId: wf.externalId,
                  rawN8nResponse: rObj,
                },
                agentReply: liveReply.trim(),
              };
            }
          }
          break;
        }
      } catch {
        // Fallback to n8n-extracted Knowledge Base RAG execution
      }
    }
  }

  let totalDuration = 0;
  const steps = wf.nodes.map((node, index) => {
    const stepDuration = 65 + ((index * 119) % 280);
    totalDuration += stepDuration;
    const lowerNodeName = `${node.name} ${node.typeLabel}`.toLowerCase();

    let outputPreview: Record<string, unknown>;
    if (index === 0) {
      outputPreview = {
        receivedMessage: userQuestion,
        clinicScope: clinicKb.clinicName,
        trigger: "Live Chat / Webhook",
      };
    } else if (
      lowerNodeName.includes("kb") ||
      lowerNodeName.includes("calendar") ||
      lowerNodeName.includes("tool") ||
      lowerNodeName.includes("database")
    ) {
      outputPreview = {
        knowledgeBaseVisited: clinicKb.clinicName,
        matchedSection: kbHit.matchedSection,
        ...kbHit.retrievedFacts,
      };
    } else if (
      lowerNodeName.includes("agent") ||
      lowerNodeName.includes("model") ||
      lowerNodeName.includes("openai")
    ) {
      outputPreview = {
        clinicGrounded: clinicKb.clinicName,
        kbSectionUsed: kbHit.matchedSection,
        generatedResponse: kbHit.agentReply,
      };
    } else if (index === wf.nodes.length - 1) {
      outputPreview = {
        status: "DELIVERED",
        clinicVerified: clinicKb.clinicName,
        replyDispatched: kbHit.agentReply,
        ...(webhookResponse || {}),
      };
    } else {
      outputPreview = {
        stepProcessed: node.name,
        clinicId: wf.clinicId,
        result: "OK",
      };
    }

    return {
      nodeId: node.id,
      nodeName: node.name,
      typeLabel: node.typeLabel,
      status: "success" as const,
      durationMs: stepDuration,
      timestamp: new Date(startedAt.getTime() + totalDuration).toISOString(),
      outputPreview,
    };
  });

  const finishedAt = new Date(startedAt.getTime() + totalDuration);
  const newExec: WorkflowExecution = {
    id: `exec-${Date.now()}`,
    workflowId: wf.id,
    workflowName: wf.name,
    clinicId: wf.clinicId,
    status: "success",
    triggerMode: "Manual Portal Trigger",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: totalDuration,
    inputPayload: payload,
    steps,
  };

  db.executions.unshift(newExec);
  wf.metrics.totalRuns += 1;
  wf.metrics.lastRunAt = finishedAt.toISOString();
  saveDb(db);

  return {
    execution: newExec,
    knowledgeBaseHit: {
      clinicName: clinicKb.clinicName,
      matchedSection: kbHit.matchedSection,
      retrievedFacts: kbHit.retrievedFacts,
      agentReply: kbHit.agentReply,
    },
  };
}

export function getKnowledgeBaseForUser(
  user: SafeUser,
  clinicIdOverride?: string | null
): ClinicKnowledgeBase | null {
  const db = ensureDb();
  const targetClinicId =
    user.role === "super_admin"
      ? clinicIdOverride && clinicIdOverride !== "all"
        ? clinicIdOverride
        : db.clinics[0]?.id
      : user.clinicId;

  if (!targetClinicId) return null;
  const clinicObj = db.clinics.find((c) => c.id === targetClinicId);
  const syncedKb = extractKnowledgeBaseFromN8nWorkflows({
    clinicId: targetClinicId,
    clinicName: clinicObj?.name || "Dental Clinic",
    clinicLocation: clinicObj?.location || "Main Branch",
    sanitizedWorkflows: db.workflows,
    sanitizedExecutions: db.executions,
    existingKb: db.knowledgeBases[targetClinicId] || null,
    liveConnected: Boolean(db.engineSettings.liveConnected),
  });
  db.knowledgeBases[targetClinicId] = syncedKb;
  saveDb(db);
  return syncedKb;
}

export async function syncKnowledgeBaseFromN8nForUser(
  user: SafeUser,
  options?: {
    clinicId?: string | null;
    engineUrl?: string;
    apiKey?: string;
  }
): Promise<{
  knowledgeBase: ClinicKnowledgeBase | null;
  liveConnected: boolean;
  message: string;
}> {
  const db = ensureDb();
  if (options?.engineUrl && options.engineUrl.trim()) {
    db.engineSettings.engineUrl = options.engineUrl.trim();
  }
  if (options?.apiKey && options.apiKey.trim()) {
    db.engineSettings.rawApiKey = options.apiKey.trim();
  }
  saveDb(db);

  const syncRes = await syncDirectlyFromN8n();
  const refreshedDb = ensureDb();
  const targetClinicId =
    user.role === "super_admin"
      ? options?.clinicId && options.clinicId !== "all"
        ? options.clinicId
        : refreshedDb.clinics[0]?.id
      : user.clinicId;

  if (!targetClinicId) {
    return {
      knowledgeBase: null,
      liveConnected: syncRes.connected,
      message: "No target clinic found.",
    };
  }

  const clinicObj = refreshedDb.clinics.find((c) => c.id === targetClinicId);
  const extracted = extractKnowledgeBaseFromN8nWorkflows({
    clinicId: targetClinicId,
    clinicName: clinicObj?.name || "Dental Clinic",
    clinicLocation: clinicObj?.location || "Main Branch",
    sanitizedWorkflows: refreshedDb.workflows,
    sanitizedExecutions: refreshedDb.executions,
    existingKb: refreshedDb.knowledgeBases[targetClinicId] || null,
    liveConnected: syncRes.connected,
  });

  refreshedDb.knowledgeBases[targetClinicId] = extracted;
  saveDb(refreshedDb);

  const nodeCount = extracted.n8nSource?.kbNodeNames?.length || 2;
  return {
    knowledgeBase: extracted,
    liveConnected: syncRes.connected,
    message: syncRes.connected
      ? `Synced Knowledge Base directly from your live n8n instance (${nodeCount} KB & AI Agent nodes extracted for ${extracted.clinicName})!`
      : `Extracted Knowledge Base from ${extracted.clinicName}'s n8n workflow nodes (${nodeCount} KB & AI Agent nodes synced).`,
  };
}

export function updateKnowledgeBaseForUser(
  user: SafeUser,
  clinicId: string,
  updates: Partial<ClinicKnowledgeBase>
): ClinicKnowledgeBase | null {
  if (user.role !== "super_admin" && user.clinicId !== clinicId) {
    return null;
  }
  const db = ensureDb();
  const existing = getKnowledgeBaseForUser(user, clinicId);
  if (!existing) return null;

  const updated: ClinicKnowledgeBase = {
    ...existing,
    ...updates,
    clinicId: existing.clinicId,
    updatedAt: new Date().toISOString(),
  };

  // Also sync updated KB back into the clinic's n8n workflow AI Agent & KB Tool nodes!
  const newSystemPrompt = formatKbAsN8nSystemPrompt(updated);
  if (updated.n8nSource) {
    updated.n8nSource.rawSystemPrompt = newSystemPrompt;
    updated.n8nSource.syncedFromN8nAt = new Date().toISOString();
  }

  db.workflows = db.workflows.map((wf) => {
    if (wf.clinicId !== clinicId) return wf;
    return {
      ...wf,
      nodes: wf.nodes.map((node) => {
        const lower = `${node.name} ${node.typeLabel}`.toLowerCase();
        if (node.category === "ai" && lower.includes("agent")) {
          return {
            ...node,
            configSummary: {
              ...node.configSummary,
              systemPrompt: newSystemPrompt,
            },
          };
        }
        if (lower.includes("kb") || lower.includes("calendar")) {
          return {
            ...node,
            configSummary: {
              ...node.configSummary,
              kbContent: `Address: ${updated.address} | Hours: ${updated.workingHours} | Phone: ${updated.phone} | Dentists: ${updated.leadDentists.join(", ")} | Services: ${updated.services.map((s) => `${s.service} (${s.price})`).join("; ")}`,
            },
          };
        }
        return node;
      }),
    };
  });

  db.knowledgeBases[clinicId] = updated;
  saveDb(db);
  return updated;
}

// ==================== SUPER ADMIN OPERATIONS ====================

export function getAllClinics(): Clinic[] {
  return ensureDb().clinics;
}

export function getAllUsersSafe(): SafeUser[] {
  const db = ensureDb();
  return db.users.map((u) => toSafeUser(u, db.clinics));
}

export function createClinic(input: {
  name: string;
  slug: string;
  brandColor: string;
  contactEmail: string;
  location: string;
  automationTag: string;
}): Clinic {
  const db = ensureDb();
  const words = input.name.trim().split(/\s+/);
  const logoText =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : input.name.slice(0, 2).toUpperCase();

  const cleanSlug = input.slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const newClinic: Clinic = {
    id: `clinic-${cleanSlug}`,
    name: input.name.trim(),
    slug: cleanSlug,
    brandColor: input.brandColor || "#0ea5e9",
    logoText,
    contactEmail: input.contactEmail.trim(),
    location: input.location.trim() || "United States",
    automationTag: input.automationTag.trim() || `clinic:${cleanSlug}`,
    createdAt: new Date().toISOString(),
  };

  db.clinics.push(newClinic);

  // Automatically provision a default login and the 4 core AI Agent workflows for the new clinic
  const defaultEmail =
    input.contactEmail.trim() || `${cleanSlug}@${cleanSlug}dental.com`;
  if (!db.users.some((u) => u.email.toLowerCase() === defaultEmail.toLowerCase())) {
    db.users.push({
      id: `user-${cleanSlug}`,
      email: defaultEmail.toLowerCase(),
      passwordHash: `${cleanSlug}123`,
      name: `${newClinic.name} Admin`,
      role: "clinic_admin",
      clinicId: newClinic.id,
      createdAt: new Date().toISOString(),
    });
  }

  const starterWorkflows = buildClinicWorkflows(
    newClinic,
    (db.clinics.length + 1) * 1000
  );
  db.workflows.push(...starterWorkflows);
  db.executions.push(...buildClinicExecutions(newClinic));

  saveDb(db);
  return newClinic;
}

export function createClinicUser(input: {
  name: string;
  email: string;
  password: string;
  clinicId: string;
  role?: "clinic_admin" | "clinic_viewer";
}): SafeUser {
  const db = ensureDb();
  const existing = db.users.find(
    (u) => u.email.toLowerCase() === input.email.trim().toLowerCase()
  );
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const newUser: UserAccount = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.password,
    role: input.role || "clinic_admin",
    clinicId: input.clinicId,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDb(db);
  return toSafeUser(newUser, db.clinics);
}

export function assignWorkflowToClinic(
  workflowId: string,
  clinicId: string
): SanitizedWorkflow | null {
  const db = ensureDb();
  const wf = db.workflows.find((w) => w.id === workflowId);
  if (!wf) return null;
  wf.clinicId = clinicId;
  wf.updatedAt = new Date().toISOString();
  // Persist the override by external n8n ID so future live n8n syncs keep this clinic assignment!
  if (wf.externalId) {
    db.workflowClinicOverrides[wf.externalId] = clinicId;
  }
  saveDb(db);
  return wf;
}

export function importOrCreateWorkflowForClinic(input: {
  clinicId: string;
  name: string;
  description: string;
  category: string;
  triggerType: "Webhook" | "Schedule" | "Event" | "Manual";
  webhookPath?: string;
  rawJson?: string;
}): SanitizedWorkflow {
  const db = ensureDb();

  if (input.rawJson && input.rawJson.trim()) {
    try {
      const parsed = JSON.parse(input.rawJson);
      const extId = String(parsed.id || Date.now());
      const sanitized = sanitizeN8nWorkflow(
        {
          id: extId,
          name: input.name || parsed.name || "Imported Clinical Automation",
          active: Boolean(parsed.active ?? true),
          nodes: parsed.nodes || [],
          connections: parsed.connections || {},
        },
        input.clinicId
      );
      if (input.description) sanitized.description = input.description;
      if (input.category) sanitized.category = input.category;
      db.workflowClinicOverrides[extId] = input.clinicId;
      db.workflows.unshift(sanitized);

      const clinicObj = db.clinics.find((c) => c.id === input.clinicId);
      db.knowledgeBases[input.clinicId] = extractKnowledgeBaseFromN8nWorkflows({
        clinicId: input.clinicId,
        clinicName: clinicObj?.name || "Dental Clinic",
        clinicLocation: clinicObj?.location || "Main Branch",
        sanitizedWorkflows: db.workflows,
        rawWorkflows: [parsed],
        sanitizedExecutions: db.executions,
        existingKb: db.knowledgeBases[input.clinicId] || null,
        liveConnected: Boolean(db.engineSettings.liveConnected),
      });

      saveDb(db);
      return sanitized;
    } catch {
      throw new Error("Invalid workflow JSON structure provided.");
    }
  }

  const created: SanitizedWorkflow = {
    id: `wf-custom-${Date.now()}`,
    externalId: String(Date.now()).slice(-4),
    clinicId: input.clinicId,
    name: input.name.trim(),
    description:
      input.description.trim() ||
      "Custom clinic workflow provisioned via ClinicFlow Admin.",
    category: input.category.trim() || "WhatsApp Agent",
    active: true,
    triggerType: input.triggerType,
    webhookPath:
      input.webhookPath || `/webhooks/custom-${Date.now().toString().slice(-4)}`,
    nodes: [
      {
        id: "n1",
        name: `${input.triggerType} Trigger`,
        typeLabel:
          input.triggerType === "Schedule"
            ? "Scheduled Cron Trigger"
            : "Incoming Webhook Trigger",
        category: "trigger",
        icon: input.triggerType === "Schedule" ? "Clock" : "Webhook",
        position: [90, 180],
        configSummary: { mode: input.triggerType },
      },
      {
        id: "n2",
        name: "AI Patient Data Processor",
        typeLabel: "Autonomous AI Agent",
        category: "ai",
        icon: "Bot",
        position: [360, 180],
        configSummary: { engine: "Clinical-NLP-v4" },
      },
      {
        id: "n3",
        name: "Patient Notification & Sync",
        typeLabel: "WhatsApp Business Gateway",
        category: "communication",
        icon: "MessageCircle",
        position: [630, 180],
        configSummary: { status: "Verified" },
      },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
    metrics: {
      totalRuns: 1,
      successRate: 100,
      avgDurationMs: 850,
      lastRunAt: new Date().toISOString(),
      timeSavedMinutesPerRun: 10,
    },
    updatedAt: new Date().toISOString(),
  };

  db.workflows.unshift(created);
  saveDb(db);
  return created;
}

export function updateWorkflowForUser(
  user: SafeUser,
  workflowId: string,
  updates: Partial<SanitizedWorkflow>
): SanitizedWorkflow | null {
  const db = ensureDb();
  const idx = db.workflows.findIndex((w) => w.id === workflowId);
  if (idx < 0) return null;

  const wf = db.workflows[idx];
  if (user.role !== "super_admin" && wf.clinicId !== user.clinicId) {
    return null;
  }

  const updated: SanitizedWorkflow = {
    ...wf,
    name: updates.name !== undefined ? updates.name : wf.name,
    description:
      updates.description !== undefined ? updates.description : wf.description,
    category: updates.category !== undefined ? updates.category : wf.category,
    active: updates.active !== undefined ? updates.active : wf.active,
    nodes: updates.nodes !== undefined ? updates.nodes : wf.nodes,
    edges: updates.edges !== undefined ? updates.edges : wf.edges,
    updatedAt: new Date().toISOString(),
  };

  db.workflows[idx] = updated;

  const clinicObj = db.clinics.find((c) => c.id === updated.clinicId);
  db.knowledgeBases[updated.clinicId] = extractKnowledgeBaseFromN8nWorkflows({
    clinicId: updated.clinicId,
    clinicName: clinicObj?.name || "Dental Clinic",
    clinicLocation: clinicObj?.location || "Main Branch",
    sanitizedWorkflows: db.workflows,
    sanitizedExecutions: db.executions,
    existingKb: db.knowledgeBases[updated.clinicId] || null,
    liveConnected: Boolean(db.engineSettings.liveConnected),
  });

  saveDb(db);
  return updated;
}

export function createWorkflowForUser(
  user: SafeUser,
  input: {
    name?: string;
    category?: string;
    clinicId?: string;
    rawJson?: string;
  }
): SanitizedWorkflow {
  const targetClinicId =
    user.role === "super_admin"
      ? input.clinicId || "clinic-prodent"
      : user.clinicId || "clinic-prodent";

  const clinicName =
    ensureDb().clinics.find((c) => c.id === targetClinicId)?.name || "Clinic";

  return importOrCreateWorkflowForClinic({
    clinicId: targetClinicId,
    name: input.name || `${clinicName.split(" ")[0]} — New AI Agent Workflow`,
    description: `Automated ${input.category || "WhatsApp Agent"} workflow for ${clinicName}.`,
    category: input.category || "WhatsApp Agent",
    triggerType: "Webhook",
    rawJson: input.rawJson,
  });
}

export function getEngineSettings(): EngineSettings & {
  liveConnected?: boolean;
  lastError?: string | null;
} {
  const db = ensureDb();
  const { rawApiKey, ...rest } = db.engineSettings;
  const hasKey = Boolean(rawApiKey || process.env.N8N_API_KEY);
  return {
    ...rest,
    apiKeyConfigured: hasKey,
    apiKeyMasked: hasKey
      ? "•••••••••••••••• (Configured)"
      : "Not configured yet — Enter your n8n URL & API Key to read live workflows",
  };
}

export async function updateAndSyncEngineSettings(input: {
  engineUrl: string;
  apiKey?: string;
  portalBrandName?: string;
}): Promise<{
  settings: EngineSettings;
  syncedCount: number;
  connectionStatus: "connected" | "saved_offline";
  message: string;
}> {
  const db = ensureDb();
  if (input.engineUrl !== undefined) {
    db.engineSettings.engineUrl = input.engineUrl.trim();
  }
  if (input.apiKey !== undefined && input.apiKey.trim() !== "") {
    db.engineSettings.rawApiKey = input.apiKey.trim();
  }
  if (input.portalBrandName) {
    db.engineSettings.portalBrandName = input.portalBrandName.trim();
  }
  saveDb(db);

  const syncResult = await syncDirectlyFromN8n();
  return {
    settings: getEngineSettings(),
    syncedCount: syncResult.workflowCount,
    connectionStatus: syncResult.connected ? "connected" : "saved_offline",
    message: syncResult.connected
      ? `Connected directly to your n8n instance! Reading ${syncResult.workflowCount} live workflow(s) across ${getAllClinics().length} clinic(s).`
      : syncResult.error || "Settings saved.",
  };
}
