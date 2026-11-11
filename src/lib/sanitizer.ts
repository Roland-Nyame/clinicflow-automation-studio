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
  whatsapptrigger: {
    label: "WhatsApp Trigger",
    category: "trigger",
    icon: "MessageCircle",
  },
  whatsapp: {
    label: "WhatsApp Business Cloud",
    category: "communication",
    icon: "MessageCircle",
  },
  facebookleadads: {
    label: "Facebook Lead Ads Trigger",
    category: "trigger",
    icon: "Globe",
  },
  facebooktrigger: {
    label: "Facebook Trigger",
    category: "trigger",
    icon: "Globe",
  },
  facebook: {
    label: "Facebook Graph API",
    category: "communication",
    icon: "Globe",
  },
  instagram: {
    label: "Instagram",
    category: "communication",
    icon: "MessageCircle",
  },
  respondtowebhook: {
    label: "Respond to Webhook",
    category: "communication",
    icon: "Webhook",
  },
  webhook: {
    label: "Webhook",
    category: "trigger",
    icon: "Webhook",
  },
  scheduletrigger: {
    label: "Schedule Trigger",
    category: "trigger",
    icon: "Clock",
  },
  cron: {
    label: "Cron Trigger",
    category: "trigger",
    icon: "Clock",
  },
  formtrigger: {
    label: "On Form Submission",
    category: "trigger",
    icon: "FileText",
  },
  chattrigger: {
    label: "When Chat Message Received",
    category: "trigger",
    icon: "MessageSquare",
  },
  manualtrigger: {
    label: "When clicking 'Test workflow'",
    category: "trigger",
    icon: "Play",
  },
  executeworkflowtrigger: {
    label: "Execute Workflow Trigger",
    category: "trigger",
    icon: "Play",
  },
  executeworkflow: {
    label: "Call Sub-Workflow",
    category: "logic",
    icon: "GitBranch",
  },
  toolworkflow: {
    label: "Call Sub-Workflow Tool",
    category: "logic",
    icon: "GitBranch",
  },
  agent: {
    label: "AI Agent",
    category: "ai",
    icon: "Bot",
  },
  chainllm: {
    label: "Basic LLM Chain",
    category: "ai",
    icon: "Bot",
  },
  chainretrievalqa: {
    label: "Question & Answer Chain",
    category: "ai",
    icon: "Bot",
  },
  lmchatopenai: {
    label: "OpenAI Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatanthropic: {
    label: "Anthropic Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatgooglevertex: {
    label: "Google Vertex Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatgooglegemini: {
    label: "Google Gemini Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatgroq: {
    label: "Groq Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  lmchatollama: {
    label: "Ollama Chat Model",
    category: "ai",
    icon: "Sparkles",
  },
  embeddingsopenai: {
    label: "Embeddings OpenAI",
    category: "ai",
    icon: "Sparkles",
  },
  openai: {
    label: "OpenAI",
    category: "ai",
    icon: "Sparkles",
  },
  memorybufferwindow: {
    label: "Simple Memory",
    category: "database",
    icon: "Database",
  },
  memorypostgreschat: {
    label: "Postgres Chat Memory",
    category: "database",
    icon: "Database",
  },
  memoryredischat: {
    label: "Redis Chat Memory",
    category: "database",
    icon: "Database",
  },
  vectorstoresupabase: {
    label: "Supabase Vector Store",
    category: "database",
    icon: "Database",
  },
  vectorstorepinecone: {
    label: "Pinecone Vector Store",
    category: "database",
    icon: "Database",
  },
  vectorstoreqdrant: {
    label: "Qdrant Vector Store",
    category: "database",
    icon: "Database",
  },
  vectorstoreinmemory: {
    label: "In-Memory Vector Store",
    category: "database",
    icon: "Database",
  },
  vectorstore: {
    label: "Vector Store",
    category: "database",
    icon: "Database",
  },
  outputparserstructured: {
    label: "Structured Output Parser",
    category: "ai",
    icon: "Code",
  },
  outputparserautofixing: {
    label: "Auto-fixing Output Parser",
    category: "ai",
    icon: "Code",
  },
  mcpclienttool: {
    label: "MCP Client Tool",
    category: "integration",
    icon: "Cpu",
  },
  toolcalculator: {
    label: "Calculator Tool",
    category: "logic",
    icon: "Sliders",
  },
  toolwikipedia: {
    label: "Wikipedia Tool",
    category: "integration",
    icon: "Globe",
  },
  httprequest: {
    label: "HTTP Request",
    category: "integration",
    icon: "Globe",
  },
  postgres: {
    label: "Postgres",
    category: "database",
    icon: "Database",
  },
  mysql: {
    label: "MySQL",
    category: "database",
    icon: "Database",
  },
  supabase: {
    label: "Supabase",
    category: "database",
    icon: "Database",
  },
  airtable: {
    label: "Airtable",
    category: "database",
    icon: "Table",
  },
  googlecalendar: {
    label: "Google Calendar",
    category: "crm",
    icon: "Calendar",
  },
  googlesheets: {
    label: "Google Sheets",
    category: "database",
    icon: "Table",
  },
  googledocs: {
    label: "Google Docs",
    category: "database",
    icon: "FileText",
  },
  googledrive: {
    label: "Google Drive",
    category: "database",
    icon: "FileText",
  },
  twilio: {
    label: "Twilio",
    category: "communication",
    icon: "MessageSquare",
  },
  gmail: {
    label: "Gmail",
    category: "communication",
    icon: "Mail",
  },
  emailsend: {
    label: "Send Email",
    category: "communication",
    icon: "Mail",
  },
  slack: {
    label: "Slack",
    category: "communication",
    icon: "Bell",
  },
  telegram: {
    label: "Telegram",
    category: "communication",
    icon: "MessageCircle",
  },
  if: {
    label: "If",
    category: "logic",
    icon: "GitBranch",
  },
  switch: {
    label: "Switch",
    category: "logic",
    icon: "Shuffle",
  },
  merge: {
    label: "Merge",
    category: "logic",
    icon: "GitBranch",
  },
  splitinbatches: {
    label: "Loop Over Items",
    category: "logic",
    icon: "Shuffle",
  },
  splitout: {
    label: "Split Out",
    category: "logic",
    icon: "GitBranch",
  },
  aggregate: {
    label: "Aggregate",
    category: "logic",
    icon: "Sliders",
  },
  filter: {
    label: "Filter",
    category: "logic",
    icon: "GitBranch",
  },
  set: {
    label: "Edit Fields (Set)",
    category: "logic",
    icon: "Sliders",
  },
  code: {
    label: "Code",
    category: "logic",
    icon: "Code",
  },
  wait: {
    label: "Wait",
    category: "logic",
    icon: "Hourglass",
  },
  datetime: {
    label: "Date & Time",
    category: "logic",
    icon: "Clock",
  },
  hubspot: {
    label: "HubSpot",
    category: "crm",
    icon: "Users",
  },
  highlevel: {
    label: "HighLevel",
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
    const maxLen = isLongField ? 12000 : 500;

    if (typeof v === "string" && v.trim() !== "") {
      safe[k] = scrubBrandStrings(v).slice(0, maxLen);
    } else if (typeof v === "number" || typeof v === "boolean") {
      safe[k] = v;
    } else if (Array.isArray(v) && v.length > 0) {
      safe[k] = scrubBrandStrings(JSON.stringify(v)).slice(0, 600);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      // Handle n8n Resource Locator objects ({ __rl: true, value: "...", cachedResultName: "..." })
      if ("__rl" in obj && (obj.cachedResultName || obj.value !== undefined)) {
        const displayVal = String(obj.cachedResultName || obj.value || "");
        if (displayVal.trim()) {
          safe[k] = scrubBrandStrings(displayVal).slice(0, maxLen);
        }
        continue;
      }
      // Extract nested n8n options such as parameters.options.systemMessage on AI Agent nodes
      for (const [subK, subV] of Object.entries(obj)) {
        const lowerSub = subK.toLowerCase();
        if (blockedKeys.some((b) => lowerSub.includes(b))) continue;
        if (typeof subV === "string" && subV.trim() !== "") {
          const subMax = longTextKeys.some((lk) => lowerSub.includes(lk))
            ? 12000
            : 500;
          safe[subK] = scrubBrandStrings(subV).slice(0, subMax);
        } else if (typeof subV === "number" || typeof subV === "boolean") {
          safe[subK] = subV;
        } else if (Array.isArray(subV) && subV.length > 0) {
          safe[subK] = scrubBrandStrings(JSON.stringify(subV)).slice(0, 600);
        } else if (subV && typeof subV === "object" && "value" in (subV as Record<string, unknown>)) {
          const inner = subV as Record<string, unknown>;
          const innerVal = String(inner.cachedResultName || inner.value || "");
          if (innerVal.trim()) {
            safe[subK] = scrubBrandStrings(innerVal).slice(0, 500);
          }
        }
      }
    }
  }
  return safe;
}

/**
 * Normalizes arbitrary n8n canvas coordinates (which can be negative or large)
 * so they always fit cleanly in the portal's visual canvas without overlapping.
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
    Math.round((xs[i] - minX) * 1.22 + 70),
    Math.round((ys[i] - minY) * 1.1 + 70),
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
