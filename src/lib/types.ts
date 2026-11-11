export type UserRole = "super_admin" | "clinic_admin" | "clinic_viewer";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  logoText: string;
  contactEmail: string;
  location: string;
  /** Tag used in the backend automation engine (e.g. "clinic:prodent") to auto-map workflows */
  automationTag: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // Stored in server DB only, stripped before sending to client
  name: string;
  role: UserRole;
  clinicId: string | null; // null for super_admin, required for clinic users
  createdAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId: string | null;
  clinic?: Clinic | null;
}

export type WhiteLabelNodeCategory =
  | "trigger"
  | "communication"
  | "crm"
  | "ai"
  | "logic"
  | "database"
  | "integration";

export interface WhiteLabelNode {
  id: string;
  name: string;
  /** Sanitized, human-friendly type name (e.g. "Webhook Trigger", "SMS Dispatcher", "AI Patient Triage") — never "n8n-nodes-base.*" */
  typeLabel: string;
  category: WhiteLabelNodeCategory;
  icon: string;
  position: [number, number];
  /** Sanitized configuration summary safe for client viewing */
  configSummary: Record<string, string | number | boolean>;
  status?: "idle" | "running" | "success" | "error";
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface SanitizedWorkflow {
  id: string;
  /** Internal backend workflow ID (mapped on server) */
  externalId: string;
  clinicId: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  triggerType: "Webhook" | "Schedule" | "Event" | "Manual";
  scheduleDescription?: string;
  webhookPath?: string;
  nodes: WhiteLabelNode[];
  edges: WorkflowEdge[];
  metrics: {
    totalRuns: number;
    successRate: number;
    avgDurationMs: number;
    lastRunAt: string | null;
    timeSavedMinutesPerRun: number;
  };
  updatedAt: string;
}

export interface ExecutionStepLog {
  nodeId: string;
  nodeName: string;
  typeLabel: string;
  status: "success" | "error" | "skipped";
  durationMs: number;
  timestamp: string;
  outputPreview: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  clinicId: string;
  status: "success" | "error" | "running";
  triggerMode: "Webhook" | "Schedule" | "Manual Portal Trigger";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  inputPayload?: Record<string, unknown>;
  steps: ExecutionStepLog[];
}

export interface EngineSettings {
  engineUrl: string;
  apiKeyConfigured: boolean;
  apiKeyMasked: string;
  syncMode: "hybrid" | "live_only";
  lastSyncedAt: string | null;
  portalBrandName: string;
}
