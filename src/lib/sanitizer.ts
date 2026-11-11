import {
  ExecutionStepLog,
  SanitizedWorkflow,
  WhiteLabelNode,
  WhiteLabelNodeCategory,
  WorkflowEdge,
  WorkflowExecution,
} from "./types";

export interface RawN8nNode {
  id?: string;
  name: string;
  type: string;
  position?: [number, number];
  parameters?: Record<string, unknown>;
  disabled?: boolean;
}

export interface RawN8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes?: RawN8nNode[];
  connections?: Record<
    string,
    Record<
      string,
      Array<Array<{ node: string; type?: string; index?: number }>>
    >
  >;
  tags?: Array<{ id?: string; name: string }>;
  updatedAt?: string;
  createdAt?: string;
}

export interface RawN8nExecution {
  id: string | number;
  workflowId: string | number;
  finished?: boolean;
  mode?: string;
  status?: string;
  startedAt: string;
  stoppedAt?: string;
  data?: {
    resultData?: {
      runData?: Record<
        string,
        Array<{
          startTime?: number;
          executionTime?: number;
          executionStatus?: string;
          error?: { message?: string };
          data?: Record<
            string,
            Array<Array<{ json?: Record<string, unknown> }>>
          >;
        }>
      >;
    };
  };
}

const NODE_TYPE_MAPPING: Record<
  string,
  { label: string; category: WhiteLabelNodeCategory; icon: string }
> = {
  whatsapp: {
    label: "WhatsApp Business Gateway",
    category: "communication",
    icon: "MessageCircle",
  },
  whatsapptrigger: {
    label: "WhatsApp Incoming Trigger",
    category: "trigger",
    icon: "MessageCircle",
  },
  facebook: {
    label: "Facebook Graph Connector",
    category: "communication",
    icon: "Globe",
  },
  facebookleadads: {
    label: "Facebook Lead Ads Trigger",
    category: "trigger",
    icon: "Globe",
  },
  facebooktrigger: {
    label: "Facebook Messenger Webhook",
    category: "trigger",
    icon: "Globe",
  },
  instagram: {
    label: "Instagram Direct Gateway",
    category: "communication",
    icon: "MessageCircle",
  },
  webhook: {
    label: "Incoming Webhook Trigger",
    category: "trigger",
    icon: "Webhook",
  },
  Respondtowebhook: {
    label: "Webhook Response Dispatcher",
    category: "communication",
    icon: "Webhook",
  },
  scheduletrigger: {
    label: "Scheduled Cron Trigger",
    category: "trigger",
    icon: "Clock",
  },
  cron: {
    label: "Scheduled Cron Trigger",
    category: "trigger",
    icon: "Clock",
  },
  formtrigger: {
    label: "Patient Intake Form Trigger",
    category: "trigger",
    icon: "FileText",
  },
  chattrigger: {
    label: "Live Chat Message Trigger",
    category: "trigger",
    icon: "MessageSquare",
  },
  manualtrigger: {
    label: "Manual Portal Trigger",
    category: "trigger",
    icon: "Play",
  },
  agent: {
    label: "Autonomous AI Agent",
    category: "ai",
    icon: "Bot",
  },
  lmchatopenai: {
    label: "AI Language Model (OpenAI)",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatanthropic: {
    label: "AI Language Model (Claude)",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatgooglevertex: {
    label: "AI Language Model (Gemini)",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatgooglegemini: {
    label: "AI Language Model (Gemini)",
    category: "ai",
    icon: "Sparkles",
  },
  openai: {
    label: "AI Clinical Assistant",
    category: "ai",
    icon: "Sparkles",
  },
  memorybufferwindow: {
    label: "Conversation Buffer Memory",
    category: "database",
    icon: "Database",
  },
  memorypostgreschat: {
    label: "Persistent Patient Chat Memory",
    category: "database",
    icon: "Database",
  },
  memoryredischat: {
    label: "High-Speed Session Memory",
    category: "database",
    icon: "Database",
  },
  vectorstore: {
    label: "Clinic Knowledge Base (RAG)",
    category: "database",
    icon: "Database",
  },
  httprequest: {
    label: "External API Connector",
    category: "integration",
    icon: "Globe",
  },
  postgres: {
    label: "Clinic SQL Database",
    category: "database",
    icon: "Database",
  },
  mysql: {
    label: "Clinic SQL Database",
    category: "database",
    icon: "Database",
  },
  supabase: {
    label: "Patient Records Vault",
    category: "database",
    icon: "Database",
  },
  airtable: {
    label: "Clinic Records Base",
    category: "database",
    icon: "Table",
  },
  googlecalendar: {
    label: "Clinic Appointment Calendar",
    category: "crm",
    icon: "Calendar",
  },
  googlesheets: {
    label: "Clinic Spreadsheet Sync",
    category: "database",
    icon: "Table",
  },
  googledrive: {
    label: "Clinic Document Storage",
    category: "database",
    icon: "FileText",
  },
  twilio: {
    label: "Patient SMS Gateway",
    category: "communication",
    icon: "MessageSquare",
  },
  gmail: {
    label: "Clinic Email Dispatcher",
    category: "communication",
    icon: "Mail",
  },
  emailsend: {
    label: "Clinic Email Dispatcher",
    category: "communication",
    icon: "Mail",
  },
  slack: {
    label: "Front-Desk Team Alert",
    category: "communication",
    icon: "Bell",
  },
  telegram: {
    label: "Instant Messaging Gateway",
    category: "communication",
    icon: "MessageCircle",
  },
  if: {
    label: "Conditional Decision Router",
    category: "logic",
    icon: "GitBranch",
  },
  switch: {
    label: "Multi-Path Logic Router",
    category: "logic",
    icon: "Shuffle",
  },
  merge: {
    label: "Data Stream Merger",
    category: "logic",
    icon: "GitBranch",
  },
  set: {
    label: "Data Formatter & Mapper",
    category: "logic",
    icon: "Sliders",
  },
  code: {
    label: "Custom Business Rule Engine",
    category: "logic",
    icon: "Code",
  },
  wait: {
    label: "Timed Delay / Smart Wait",
    category: "logic",
    icon: "Hourglass",
  },
  hubspot: {
    label: "Patient CRM Sync",
    category: "crm",
    icon: "Users",
  },
  highlevel: {
    label: "Clinic GoHighLevel CRM",
    category: "crm",
    icon: "Users",
  },
};

/**
 * Strips any occurrence of "n8n", internal URLs, or sensitive keys from strings
 */
export function scrubBrandStrings(input: string): string {
  if (!input) return "";
  return input
    .replace(/n8n-nodes-base\./gi, "")
    .replace(/@n8n\/n8n-nodes-langchain\./gi, "")
    .replace(/\bn8n\b/gi, "ClinicFlow")
    .replace(/https?:\/\/[^\s"']+:5678[^\s"']*/gi, "[Protected Endpoint]");
}

export function mapNodeTypeToWhiteLabel(rawType: string): {
  label: string;
  category: WhiteLabelNodeCategory;
  icon: string;
} {
  const cleaned = (rawType || "")
    .toLowerCase()
    .replace(/^n8n-nodes-base\./, "")
    .replace(/^@n8n\/n8n-nodes-langchain\./, "")
    .replace(/tool$/, "")
    .replace(/[^a-z0-9]/g, "");

  for (const [key, value] of Object.entries(NODE_TYPE_MAPPING)) {
    if (cleaned.includes(key.toLowerCase())) {
      if (rawType.toLowerCase().includes("tool")) {
        return {
          ...value,
          label: `${value.label} Tool`,
        };
      }
      return value;
    }
  }

  const fallbackLabel = scrubBrandStrings(rawType)
    .replace(/^.*\./, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return {
    label: fallbackLabel || "Automation Step",
    category: "integration",
    icon: "Cpu",
  };
}

export function inferWorkflowCategory(
  name: string,
  nodes: WhiteLabelNode[]
): string {
  const lower = name.toLowerCase();
  if (lower.includes("whatsapp") || lower.includes("wa ")) {
    return "WhatsApp Agent";
  }
  if (
    lower.includes("facebook") ||
    lower.includes("fb ") ||
    lower.includes("messenger") ||
    lower.includes("meta")
  ) {
    return "Facebook Agent";
  }
  if (lower.includes("instagram") || lower.includes("ig ")) {
    return "Instagram Agent";
  }
  if (
    lower.includes("reminder") ||
    lower.includes("appointment") ||
    lower.includes("recall") ||
    lower.includes("booking")
  ) {
    return "Appointment Agent";
  }
  if (lower.includes("voice") || lower.includes("call")) {
    return "Voice & Call Agent";
  }
  if (nodes.some((n) => n.category === "ai")) {
    return "AI Clinical Agent";
  }
  return "Clinical Automation";
}

export function sanitizeParameters(
  params?: Record<string, unknown>
): Record<string, string | number | boolean> {
  if (!params) return {};
  const safe: Record<string, string | number | boolean> = {};
  const blockedKeys = [
    "authentication",
    "credentials",
    "apikey",
    "secret",
    "password",
    "token",
    "headerparameters",
  ];

  const longTextKeys = [
    "systemmessage",
    "systemprompt",
    "prompt",
    "text",
    "description",
    "kbcontent",
    "knowledgebase",
    "content",
    "jscode",
    "query",
    "instructions",
    "services",
    "faqs",
  ];

  for (const [k, v] of Object.entries(params)) {
    const lowerKey = k.toLowerCase();
    if (blockedKeys.some((b) => lowerKey.includes(b))) continue;
    const isLongField = longTextKeys.some((lk) => lowerKey.includes(lk));
    const maxLen = isLongField ? 12000 : 300;

    if (typeof v === "string" && v.trim() !== "") {
      safe[k] = scrubBrandStrings(v).slice(0, maxLen);
    } else if (typeof v === "number" || typeof v === "boolean") {
      safe[k] = v;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      // Extract nested n8n options such as parameters.options.systemMessage on AI Agent nodes
      for (const [subK, subV] of Object.entries(v as Record<string, unknown>)) {
        const lowerSub = subK.toLowerCase();
        if (blockedKeys.some((b) => lowerSub.includes(b))) continue;
        if (typeof subV === "string" && subV.trim() !== "") {
          const subMax = longTextKeys.some((lk) => lowerSub.includes(lk))
            ? 12000
            : 300;
          safe[subK] = scrubBrandStrings(subV).slice(0, subMax);
        } else if (typeof subV === "number" || typeof subV === "boolean") {
          safe[subK] = subV;
        }
      }
    }
  }
  return safe;
}

/**
 * Normalizes arbitrary n8n canvas coordinates (which can be negative or large)
 * so they always fit cleanly in the portal's visual canvas.
 */
function normalizePositions(rawNodes: RawN8nNode[]): Array<[number, number]> {
  if (rawNodes.length === 0) return [];
  const xs = rawNodes.map((n, i) =>
    Array.isArray(n.position) && typeof n.position[0] === "number"
      ? n.position[0]
      : i * 260
  );
  const ys = rawNodes.map((n) =>
    Array.isArray(n.position) && typeof n.position[1] === "number"
      ? n.position[1]
      : 180
  );

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return rawNodes.map((_, i) => [
    Math.round((xs[i] - minX) * 0.95 + 60),
    Math.round((ys[i] - minY) * 0.95 + 70),
  ]);
}

/**
 * Converts a live n8n workflow object (including AI Agent sub-nodes like
 * ai_languageModel, ai_memory, ai_tool) into a white-labeled SanitizedWorkflow.
 */
export function sanitizeN8nWorkflow(
  raw: RawN8nWorkflow,
  clinicId: string
): SanitizedWorkflow {
  // Filter out sticky notes so the client canvas only shows functional nodes
  const functionalNodes = (raw.nodes || []).filter(
    (n) => !String(n.type || "").toLowerCase().includes("stickynote")
  );

  const normalizedCoords = normalizePositions(functionalNodes);
  const nameToIdMap = new Map<string, string>();

  const nodes: WhiteLabelNode[] = functionalNodes.map((n, idx) => {
    const id = n.id || `node-${idx + 1}`;
    nameToIdMap.set(n.name, id);
    const mapped = mapNodeTypeToWhiteLabel(n.type || "integration");
    return {
      id,
      name: scrubBrandStrings(n.name),
      typeLabel: mapped.label,
      category: mapped.category,
      icon: mapped.icon,
      position: normalizedCoords[idx] || [80 + idx * 250, 160],
      configSummary: sanitizeParameters(n.parameters),
      status: "idle",
    };
  });

  const edges: WorkflowEdge[] = [];
  let webhookPath: string | undefined;

  // Extract webhook path if present on a trigger node
  for (const rawNode of functionalNodes) {
    if (
      String(rawNode.type || "").toLowerCase().includes("webhook") ||
      String(rawNode.type || "").toLowerCase().includes("whatsapp") ||
      String(rawNode.type || "").toLowerCase().includes("facebook")
    ) {
      const pathVal = rawNode.parameters?.path;
      if (typeof pathVal === "string" && pathVal.trim()) {
        webhookPath = `/webhook/${pathVal.replace(/^\//, "")}`;
      }
    }
  }

  if (raw.connections) {
    let edgeIdx = 1;
    for (const [sourceName, connectionTypesObj] of Object.entries(
      raw.connections
    )) {
      const sourceId = nameToIdMap.get(sourceName);
      if (!sourceId || !connectionTypesObj) continue;

      for (const [connType, branches] of Object.entries(connectionTypesObj)) {
        if (!Array.isArray(branches)) continue;

        const isAiModel = connType.toLowerCase().includes("languagemodel");
        const isAiMemory = connType.toLowerCase().includes("memory");
        const isAiTool =
          connType.toLowerCase().includes("tool") ||
          connType.toLowerCase().includes("vectorstore") ||
          connType.toLowerCase().includes("retriever");

        branches.forEach((branch, branchIdx) => {
          if (!Array.isArray(branch)) return;
          branch.forEach((targetConn) => {
            const targetId = nameToIdMap.get(targetConn.node);
            if (targetId) {
              let label: string | undefined;
              if (isAiModel) label = "Model";
              else if (isAiMemory) label = "Memory";
              else if (isAiTool) label = "Tools";
              else if (branches.length > 1) {
                label =
                  branchIdx === 0
                    ? "Branch 1"
                    : branchIdx === 1
                    ? "Branch 2"
                    : `Path ${branchIdx + 1}`;
              }

              edges.push({
                id: `edge-${edgeIdx++}`,
                source: sourceId,
                target: targetId,
                label,
              });
            }
          });
        });
      }
    }
  }

  const hasSchedule = nodes.some((n) =>
    n.typeLabel.toLowerCase().includes("schedule")
  );
  const category = inferWorkflowCategory(raw.name || "", nodes);

  return {
    id: `wf-n8n-${raw.id}`,
    externalId: String(raw.id),
    clinicId,
    name: scrubBrandStrings(raw.name || "Untitled Clinic Agent"),
    description: `Live ${category} workflow synced from your automation instance (${nodes.length} nodes).`,
    category,
    active: Boolean(raw.active),
    triggerType: hasSchedule ? "Schedule" : "Webhook",
    webhookPath,
    nodes,
    edges,
    metrics: {
      totalRuns: 0,
      successRate: 100,
      avgDurationMs: 950,
      lastRunAt: raw.updatedAt || new Date().toISOString(),
      timeSavedMinutesPerRun: 8,
    },
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Converts a live n8n execution record (`/api/v1/executions`) into a white-labeled
 * WorkflowExecution with step-by-step telemetry.
 */
export function sanitizeN8nExecution(
  rawExec: RawN8nExecution,
  workflow: SanitizedWorkflow
): WorkflowExecution {
  const startedAt = rawExec.startedAt || new Date().toISOString();
  const finishedAt = rawExec.stoppedAt || new Date().toISOString();
  const durationMs = Math.max(
    120,
    new Date(finishedAt).getTime() - new Date(startedAt).getTime() || 850
  );

  const runData = rawExec.data?.resultData?.runData || {};
  const steps: ExecutionStepLog[] = [];

  for (const [nodeName, nodeRuns] of Object.entries(runData)) {
    const matchedNode = workflow.nodes.find((n) => n.name === nodeName);
    const firstRun = Array.isArray(nodeRuns) ? nodeRuns[0] : undefined;
    const mainOutput = firstRun?.data?.main?.[0]?.[0]?.json || {
      status: "Completed",
    };

    const sanitizedPreview: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(mainOutput).slice(0, 5)) {
      if (typeof v === "string") {
        sanitizedPreview[k] = scrubBrandStrings(v).slice(0, 140);
      } else if (typeof v === "number" || typeof v === "boolean") {
        sanitizedPreview[k] = v;
      }
    }

    steps.push({
      nodeId: matchedNode?.id || `step-${steps.length + 1}`,
      nodeName: scrubBrandStrings(nodeName),
      typeLabel: matchedNode?.typeLabel || "Automation Step",
      status: firstRun?.error ? "error" : "success",
      durationMs: firstRun?.executionTime || 110,
      timestamp: startedAt,
      outputPreview:
        Object.keys(sanitizedPreview).length > 0
          ? sanitizedPreview
          : { executed: true },
    });
  }

  // If execution summary did not include step details, provide node summary steps
  if (steps.length === 0) {
    workflow.nodes.slice(0, 4).forEach((node, idx) => {
      steps.push({
        nodeId: node.id,
        nodeName: node.name,
        typeLabel: node.typeLabel,
        status: rawExec.status === "error" ? "error" : "success",
        durationMs: Math.round(durationMs / Math.max(1, workflow.nodes.length)),
        timestamp: new Date(
          new Date(startedAt).getTime() + idx * 150
        ).toISOString(),
        outputPreview: { status: rawExec.status || "success" },
      });
    });
  }

  return {
    id: `exec-${rawExec.id}`,
    workflowId: workflow.id,
    workflowName: workflow.name,
    clinicId: workflow.clinicId,
    status:
      rawExec.status === "error" || rawExec.status === "crashed"
        ? "error"
        : "success",
    triggerMode:
      rawExec.mode === "trigger" || rawExec.mode === "webhook"
        ? "Webhook"
        : "Schedule",
    startedAt,
    finishedAt,
    durationMs,
    steps,
  };
}
