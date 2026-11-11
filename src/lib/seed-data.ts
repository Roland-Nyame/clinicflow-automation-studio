import {
  Clinic,
  EngineSettings,
  SanitizedWorkflow,
  UserAccount,
  WorkflowExecution,
} from "./types";
import {
  createDefaultKnowledgeBaseForClinic,
  formatKbAsN8nSystemPrompt,
  INITIAL_KNOWLEDGE_BASES,
} from "./knowledge-base";

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: "clinic-prodent",
    name: "Prodent Dental Clinic",
    slug: "prodent",
    brandColor: "#0ea5e9", // Sky Blue
    logoText: "PD",
    contactEmail: "prodent@prodentdental.com",
    location: "Prodent Main Branch",
    automationTag: "clinic:prodent",
    createdAt: "2026-09-15T10:00:00Z",
  },
  {
    id: "clinic-omabod",
    name: "Omabod Dental Clinic",
    slug: "omabod",
    brandColor: "#10b981", // Emerald
    logoText: "OD",
    contactEmail: "omabod@omaboddental.com",
    location: "Omabod Dental Center",
    automationTag: "clinic:omabod",
    createdAt: "2026-09-18T11:00:00Z",
  },
  {
    id: "clinic-busybite",
    name: "BusyBite Dental Studio",
    slug: "busybite",
    brandColor: "#f59e0b", // Amber / Orange
    logoText: "BB",
    contactEmail: "busybite@busybitedental.com",
    location: "BusyBite Dental Plaza",
    automationTag: "clinic:busybite",
    createdAt: "2026-09-20T14:30:00Z",
  },
  {
    id: "clinic-reign",
    name: "Reign Dental Clinic",
    slug: "reign",
    brandColor: "#8b5cf6", // Royal Violet
    logoText: "RD",
    contactEmail: "reign@reigndental.com",
    location: "Reign Dental Headquarters",
    automationTag: "clinic:reign",
    createdAt: "2026-09-25T09:15:00Z",
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: "user-super-admin",
    email: "admin@clinicflow.io",
    passwordHash: "admin123",
    name: "Agency Super Admin",
    role: "super_admin",
    clinicId: null,
    createdAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "user-prodent",
    email: "prodent@prodentdental.com",
    passwordHash: "prodent123",
    name: "Prodent Dental Admin",
    role: "clinic_admin",
    clinicId: "clinic-prodent",
    createdAt: "2026-09-15T10:05:00Z",
  },
  {
    id: "user-omabod",
    email: "omabod@omaboddental.com",
    passwordHash: "omabod123",
    name: "Omabod Dental Admin",
    role: "clinic_admin",
    clinicId: "clinic-omabod",
    createdAt: "2026-09-18T11:05:00Z",
  },
  {
    id: "user-busybite",
    email: "busybite@busybitedental.com",
    passwordHash: "busybite123",
    name: "BusyBite Dental Admin",
    role: "clinic_admin",
    clinicId: "clinic-busybite",
    createdAt: "2026-09-20T14:35:00Z",
  },
  {
    id: "user-reign",
    email: "reign@reigndental.com",
    passwordHash: "reign123",
    name: "Reign Dental Admin",
    role: "clinic_admin",
    clinicId: "clinic-reign",
    createdAt: "2026-09-25T09:20:00Z",
  },
];

/**
 * Generates the complete isolated n8n-style AI Agent workflow suite
 * (WhatsApp AI Agent, Facebook Messenger & Lead Ad Agent, Instagram DM Agent,
 * and 24h Appointment Reminder Agent) for a given dental clinic.
 */
export function buildClinicWorkflows(
  clinic: Clinic,
  baseExternalId: number
): SanitizedWorkflow[] {
  const shortName = clinic.name.replace(/\s+(Clinic|Studio)$/i, "");
  const slug = clinic.slug;
  const clinicKb =
    INITIAL_KNOWLEDGE_BASES[clinic.id] ||
    createDefaultKnowledgeBaseForClinic(clinic.id, clinic.name, clinic.location);
  const fullN8nKbPrompt = formatKbAsN8nSystemPrompt(clinicKb);

  return [
    {
      id: `wf-${slug}-whatsapp-agent`,
      externalId: String(baseExternalId + 1),
      clinicId: clinic.id,
      name: `${shortName} — WhatsApp AI Agent`,
      description: `Dedicated WhatsApp Business AI Agent for ${clinic.name}. Receives incoming patient WhatsApp messages & voice notes, consults ${shortName}'s treatment & pricing knowledge base, checks real-time chair availability, books appointments, and replies on WhatsApp.`,
      category: "WhatsApp Agent",
      active: true,
      triggerType: "Webhook",
      webhookPath: `/webhooks/${slug}/whatsapp-agent`,
      nodes: [
        {
          id: `${slug}-wa-1`,
          name: "WhatsApp Cloud Trigger",
          typeLabel: "WhatsApp Incoming Trigger",
          category: "trigger",
          icon: "MessageCircle",
          position: [60, 125],
          configSummary: {
            channel: "WhatsApp Business Cloud API",
            clinicAccount: `${clinic.name} Official WhatsApp`,
            events: "messages.text, messages.audio",
          },
        },
        {
          id: `${slug}-wa-2`,
          name: "Switch (Text / Voice Note)",
          typeLabel: "Multi-Path Logic Router",
          category: "logic",
          icon: "Shuffle",
          position: [310, 125],
          configSummary: {
            route1: "Text Message",
            route2: "Audio -> Whisper Transcriber",
          },
        },
        {
          id: `${slug}-wa-3`,
          name: `${shortName} WhatsApp AI Agent`,
          typeLabel: "Autonomous AI Agent",
          category: "ai",
          icon: "Bot",
          position: [570, 110],
          configSummary: {
            agentRole: `${clinic.name} Virtual Receptionist`,
            systemPrompt: fullN8nKbPrompt,
            temperature: 0.2,
          },
        },
        {
          id: `${slug}-wa-4`,
          name: "OpenAI Chat Model",
          typeLabel: "AI Language Model (OpenAI)",
          category: "ai",
          icon: "Sparkles",
          position: [440, 295],
          configSummary: {
            model: "gpt-4o",
            contextWindow: "128k tokens",
          },
        },
        {
          id: `${slug}-wa-5`,
          name: "Postgres Chat Memory",
          typeLabel: "Conversation Buffer Memory",
          category: "database",
          icon: "Database",
          position: [595, 295],
          configSummary: {
            tableName: `${slug}_whatsapp_chat_histories`,
            sessionKey: "whatsapp_sender_phone",
            windowLength: 15,
          },
        },
        {
          id: `${slug}-wa-6`,
          name: `${shortName} Calendar & KB Tool`,
          typeLabel: "Clinic Appointment Calendar Tool",
          category: "crm",
          icon: "Calendar",
          position: [750, 295],
          configSummary: {
            calendar: `${shortName} Dental Chairs 1-4`,
            knowledgeBase: `${slug}_dental_kb_vector_store`,
            kbContent: `Address: ${clinicKb.address} | Hours: ${clinicKb.workingHours} | Phone: ${clinicKb.phone} | Dentists: ${clinicKb.leadDentists.join(", ")} | Services: ${clinicKb.services.map((s) => `${s.service} (${s.price})`).join("; ")}`,
          },
        },
        {
          id: `${slug}-wa-7`,
          name: "Send WhatsApp Reply",
          typeLabel: "WhatsApp Business Gateway",
          category: "communication",
          icon: "MessageCircle",
          position: [860, 125],
          configSummary: {
            senderName: clinic.name,
            operation: "sendText",
            typingIndicator: true,
          },
        },
      ],
      edges: [
        { id: "e1", source: `${slug}-wa-1`, target: `${slug}-wa-2` },
        {
          id: "e2",
          source: `${slug}-wa-2`,
          target: `${slug}-wa-3`,
          label: "Normalized",
        },
        {
          id: "e3",
          source: `${slug}-wa-4`,
          target: `${slug}-wa-3`,
          label: "Model",
        },
        {
          id: "e4",
          source: `${slug}-wa-5`,
          target: `${slug}-wa-3`,
          label: "Memory",
        },
        {
          id: "e5",
          source: `${slug}-wa-6`,
          target: `${slug}-wa-3`,
          label: "Tools",
        },
        {
          id: "e6",
          source: `${slug}-wa-3`,
          target: `${slug}-wa-7`,
          label: "AI Reply",
        },
      ],
      metrics: {
        totalRuns: 1840 + (baseExternalId % 400),
        successRate: 99.7,
        avgDurationMs: 1210,
        lastRunAt: "2026-11-11T07:30:00Z",
        timeSavedMinutesPerRun: 8,
      },
      updatedAt: "2026-11-11T07:30:00Z",
    },
    {
      id: `wf-${slug}-facebook-agent`,
      externalId: String(baseExternalId + 2),
      clinicId: clinic.id,
      name: `${shortName} — Facebook Agent (Messenger & Lead Ads)`,
      description: `Responds instantly to ${clinic.name}'s Facebook Page Messenger inquiries and Facebook Lead Ad submissions. Qualifies dental implant, braces & whitening leads, captures phone numbers, syncs to ${shortName} CRM, and books consultations.`,
      category: "Facebook Agent",
      active: true,
      triggerType: "Webhook",
      webhookPath: `/webhooks/${slug}/facebook-agent`,
      nodes: [
        {
          id: `${slug}-fb-1`,
          name: "Facebook Page & Lead Trigger",
          typeLabel: "Facebook Messenger Webhook",
          category: "trigger",
          icon: "Globe",
          position: [60, 125],
          configSummary: {
            pageName: `${clinic.name} Official Page`,
            triggers: "messages, messaging_postbacks, leadgen",
          },
        },
        {
          id: `${slug}-fb-2`,
          name: `${shortName} Facebook AI Agent`,
          typeLabel: "Autonomous AI Agent",
          category: "ai",
          icon: "Bot",
          position: [370, 110],
          configSummary: {
            agentRole: `${shortName} Facebook Messenger Concierge`,
            goal: "Qualify dental inquiry, answer pricing & book consultation",
          },
        },
        {
          id: `${slug}-fb-3`,
          name: "OpenAI Chat Model",
          typeLabel: "AI Language Model (OpenAI)",
          category: "ai",
          icon: "Sparkles",
          position: [280, 295],
          configSummary: {
            model: "gpt-4o-mini",
            responseStyle: "Warm & Conversational",
          },
        },
        {
          id: `${slug}-fb-4`,
          name: "Messenger Thread Memory",
          typeLabel: "Conversation Buffer Memory",
          category: "database",
          icon: "Database",
          position: [450, 295],
          configSummary: {
            sessionKey: `${slug}_fb_sender_psid`,
            historyCount: 12,
          },
        },
        {
          id: `${slug}-fb-5`,
          name: `Sync Lead to ${shortName} CRM`,
          typeLabel: "Patient CRM Sync",
          category: "crm",
          icon: "Users",
          position: [690, 65],
          configSummary: {
            pipeline: `${shortName} Facebook Ad Leads`,
            autoTag: "FB-Messenger-Qualified",
          },
        },
        {
          id: `${slug}-fb-6`,
          name: "Send Facebook Messenger Reply",
          typeLabel: "Facebook Graph Connector",
          category: "communication",
          icon: "MessageSquare",
          position: [690, 195],
          configSummary: {
            pageId: `${slug}-fb-official`,
            quickReplies: "Book Visit, Check Pricing, Speak to Dentist",
          },
        },
      ],
      edges: [
        { id: "e1", source: `${slug}-fb-1`, target: `${slug}-fb-2` },
        {
          id: "e2",
          source: `${slug}-fb-3`,
          target: `${slug}-fb-2`,
          label: "Model",
        },
        {
          id: "e3",
          source: `${slug}-fb-4`,
          target: `${slug}-fb-2`,
          label: "Memory",
        },
        {
          id: "e4",
          source: `${slug}-fb-2`,
          target: `${slug}-fb-5`,
          label: "Save Lead",
        },
        {
          id: "e5",
          source: `${slug}-fb-2`,
          target: `${slug}-fb-6`,
          label: "Send Reply",
        },
      ],
      metrics: {
        totalRuns: 1120 + (baseExternalId % 300),
        successRate: 99.5,
        avgDurationMs: 1140,
        lastRunAt: "2026-11-11T07:15:00Z",
        timeSavedMinutesPerRun: 10,
      },
      updatedAt: "2026-11-11T07:15:00Z",
    },
    {
      id: `wf-${slug}-instagram-agent`,
      externalId: String(baseExternalId + 3),
      clinicId: clinic.id,
      name: `${shortName} — Instagram DM & Comment AI Agent`,
      description: `Monitors ${clinic.name}'s Instagram DMs and post comments, automatically replies to followers asking about veneers, whitening, or braces, and books appointments into ${shortName}'s calendar.`,
      category: "Instagram Agent",
      active: true,
      triggerType: "Webhook",
      webhookPath: `/webhooks/${slug}/instagram-agent`,
      nodes: [
        {
          id: `${slug}-ig-1`,
          name: "Instagram DM / Comment Trigger",
          typeLabel: "Instagram Direct Gateway",
          category: "trigger",
          icon: "Webhook",
          position: [70, 130],
          configSummary: {
            account: `@${slug}dental`,
            events: "direct_messages, media_comments",
          },
        },
        {
          id: `${slug}-ig-2`,
          name: `${shortName} Instagram AI Agent`,
          typeLabel: "Autonomous AI Agent",
          category: "ai",
          icon: "Bot",
          position: [360, 120],
          configSummary: {
            persona: `${shortName} Aesthetic Dentistry Specialist`,
            keywordTriggers: "SMILE, WHITENING, BOOK",
          },
        },
        {
          id: `${slug}-ig-3`,
          name: "OpenAI Chat Model",
          typeLabel: "AI Language Model (OpenAI)",
          category: "ai",
          icon: "Sparkles",
          position: [360, 295],
          configSummary: {
            model: "gpt-4o",
          },
        },
        {
          id: `${slug}-ig-4`,
          name: `Book ${shortName} Slot`,
          typeLabel: "Clinic Appointment Calendar",
          category: "crm",
          icon: "Calendar",
          position: [660, 75],
          configSummary: {
            calendar: `${shortName} Consultations`,
          },
        },
        {
          id: `${slug}-ig-5`,
          name: "Reply via Instagram DM",
          typeLabel: "Instagram Direct Gateway",
          category: "communication",
          icon: "MessageCircle",
          position: [660, 200],
          configSummary: {
            includeBookingButton: true,
          },
        },
      ],
      edges: [
        { id: "e1", source: `${slug}-ig-1`, target: `${slug}-ig-2` },
        {
          id: "e2",
          source: `${slug}-ig-3`,
          target: `${slug}-ig-2`,
          label: "Model",
        },
        {
          id: "e3",
          source: `${slug}-ig-2`,
          target: `${slug}-ig-4`,
          label: "Check Slot",
        },
        {
          id: "e4",
          source: `${slug}-ig-2`,
          target: `${slug}-ig-5`,
          label: "Send DM",
        },
      ],
      metrics: {
        totalRuns: 790 + (baseExternalId % 200),
        successRate: 99.6,
        avgDurationMs: 1030,
        lastRunAt: "2026-11-11T06:50:00Z",
        timeSavedMinutesPerRun: 9,
      },
      updatedAt: "2026-11-11T06:50:00Z",
    },
    {
      id: `wf-${slug}-reminder-agent`,
      externalId: String(baseExternalId + 4),
      clinicId: clinic.id,
      name: `${shortName} — 24h Appointment Reminder & Recall Agent`,
      description: `Runs every 30 minutes for ${clinic.name}. Fetches unconfirmed patient bookings for tomorrow, sends personalized WhatsApp & SMS reminders, and updates ${shortName}'s appointment calendar.`,
      category: "Appointment Agent",
      active: true,
      triggerType: "Schedule",
      scheduleDescription: "Every 30 minutes (8:00 AM – 8:00 PM)",
      nodes: [
        {
          id: `${slug}-rem-1`,
          name: "30m Schedule Trigger",
          typeLabel: "Scheduled Cron Trigger",
          category: "trigger",
          icon: "Clock",
          position: [70, 140],
          configSummary: { interval: "Every 30 mins", clinic: clinic.name },
        },
        {
          id: `${slug}-rem-2`,
          name: `Fetch ${shortName} Bookings`,
          typeLabel: "Clinic SQL Database",
          category: "database",
          icon: "Database",
          position: [330, 140],
          configSummary: {
            query: `SELECT * FROM ${slug}_appointments WHERE confirmed = false`,
          },
        },
        {
          id: `${slug}-rem-3`,
          name: "AI Reminder Personalizer",
          typeLabel: "AI Clinical Assistant",
          category: "ai",
          icon: "Sparkles",
          position: [590, 140],
          configSummary: { brandVoice: clinic.name },
        },
        {
          id: `${slug}-rem-4`,
          name: "Send WhatsApp Reminder",
          typeLabel: "WhatsApp Business Gateway",
          category: "communication",
          icon: "MessageCircle",
          position: [850, 140],
          configSummary: { template: `${slug}_24h_appointment_reminder` },
        },
      ],
      edges: [
        { id: "e1", source: `${slug}-rem-1`, target: `${slug}-rem-2` },
        { id: "e2", source: `${slug}-rem-2`, target: `${slug}-rem-3` },
        { id: "e3", source: `${slug}-rem-3`, target: `${slug}-rem-4` },
      ],
      metrics: {
        totalRuns: 1410 + (baseExternalId % 250),
        successRate: 99.8,
        avgDurationMs: 890,
        lastRunAt: "2026-11-11T07:00:00Z",
        timeSavedMinutesPerRun: 6,
      },
      updatedAt: "2026-11-11T07:00:00Z",
    },
  ];
}

export function buildClinicExecutions(clinic: Clinic): WorkflowExecution[] {
  const shortName = clinic.name.replace(/\s+(Clinic|Studio)$/i, "");
  const slug = clinic.slug;

  return [
    {
      id: `exec-${slug}-wa-1`,
      workflowId: `wf-${slug}-whatsapp-agent`,
      workflowName: `${shortName} — WhatsApp AI Agent`,
      clinicId: clinic.id,
      status: "success",
      triggerMode: "Webhook",
      startedAt: "2026-11-11T07:30:00Z",
      finishedAt: "2026-11-11T07:30:01Z",
      durationMs: 1180,
      inputPayload: {
        clinic: clinic.name,
        from: "+233 24 555 0192",
        message: `Hi ${shortName}, how much is scaling & polishing and do you have an afternoon slot tomorrow?`,
      },
      steps: [
        {
          nodeId: `${slug}-wa-1`,
          nodeName: "WhatsApp Cloud Trigger",
          typeLabel: "WhatsApp Incoming Trigger",
          status: "success",
          durationMs: 19,
          timestamp: "2026-11-11T07:30:00Z",
          outputPreview: {
            clinic: clinic.name,
            messageType: "text",
            text: `Hi ${shortName}, how much is scaling & polishing and do you have an afternoon slot tomorrow?`,
          },
        },
        {
          nodeId: `${slug}-wa-2`,
          nodeName: "Switch (Text / Voice Note)",
          typeLabel: "Multi-Path Logic Router",
          status: "success",
          durationMs: 11,
          timestamp: "2026-11-11T07:30:00Z",
          outputPreview: { routeSelected: "Text Message" },
        },
        {
          nodeId: `${slug}-wa-5`,
          nodeName: "Postgres Chat Memory",
          typeLabel: "Conversation Buffer Memory",
          status: "success",
          durationMs: 54,
          timestamp: "2026-11-11T07:30:00Z",
          outputPreview: { sessionLoaded: true, historyMessages: 3 },
        },
        {
          nodeId: `${slug}-wa-6`,
          nodeName: `${shortName} Calendar & KB Tool`,
          typeLabel: "Clinic Appointment Calendar Tool",
          status: "success",
          durationMs: 280,
          timestamp: "2026-11-11T07:30:00Z",
          outputPreview: {
            clinicVerified: clinic.name,
            availableSlotsTomorrow: ["2:00 PM", "4:00 PM"],
          },
        },
        {
          nodeId: `${slug}-wa-4`,
          nodeName: "OpenAI Chat Model",
          typeLabel: "AI Language Model (OpenAI)",
          status: "success",
          durationMs: 520,
          timestamp: "2026-11-11T07:30:01Z",
          outputPreview: { model: "gpt-4o", tokensUsed: 294 },
        },
        {
          nodeId: `${slug}-wa-3`,
          nodeName: `${shortName} WhatsApp AI Agent`,
          typeLabel: "Autonomous AI Agent",
          status: "success",
          durationMs: 112,
          timestamp: "2026-11-11T07:30:01Z",
          outputPreview: {
            replyDraft: `Welcome to ${clinic.name}! We have openings tomorrow at 2:00 PM and 4:00 PM for your Scaling & Polishing visit. Which time works best for you?`,
          },
        },
        {
          nodeId: `${slug}-wa-7`,
          nodeName: "Send WhatsApp Reply",
          typeLabel: "WhatsApp Business Gateway",
          status: "success",
          durationMs: 184,
          timestamp: "2026-11-11T07:30:01Z",
          outputPreview: { deliveryStatus: "DELIVERED", sender: clinic.name },
        },
      ],
    },
    {
      id: `exec-${slug}-fb-1`,
      workflowId: `wf-${slug}-facebook-agent`,
      workflowName: `${shortName} — Facebook Agent (Messenger & Lead Ads)`,
      clinicId: clinic.id,
      status: "success",
      triggerMode: "Webhook",
      startedAt: "2026-11-11T07:15:00Z",
      finishedAt: "2026-11-11T07:15:01Z",
      durationMs: 1090,
      inputPayload: {
        clinic: clinic.name,
        platform: "Facebook Messenger",
        message: `Saw ${clinic.name}'s Facebook post! Can I book a teeth whitening consultation this Friday?`,
      },
      steps: [
        {
          nodeId: `${slug}-fb-1`,
          nodeName: "Facebook Page & Lead Trigger",
          typeLabel: "Facebook Messenger Webhook",
          status: "success",
          durationMs: 21,
          timestamp: "2026-11-11T07:15:00Z",
          outputPreview: { page: `${clinic.name} Official Page` },
        },
        {
          nodeId: `${slug}-fb-2`,
          nodeName: `${shortName} Facebook AI Agent`,
          typeLabel: "Autonomous AI Agent",
          status: "success",
          durationMs: 650,
          timestamp: "2026-11-11T07:15:00Z",
          outputPreview: { intent: "Teeth Whitening Consultation", qualified: true },
        },
        {
          nodeId: `${slug}-fb-5`,
          nodeName: `Sync Lead to ${shortName} CRM`,
          typeLabel: "Patient CRM Sync",
          status: "success",
          durationMs: 210,
          timestamp: "2026-11-11T07:15:01Z",
          outputPreview: { pipeline: `${shortName} Facebook Leads`, status: "Synced" },
        },
        {
          nodeId: `${slug}-fb-6`,
          nodeName: "Send Facebook Messenger Reply",
          typeLabel: "Facebook Graph Connector",
          status: "success",
          durationMs: 209,
          timestamp: "2026-11-11T07:15:01Z",
          outputPreview: { messengerStatus: "SENT" },
        },
      ],
    },
  ];
}

export const INITIAL_WORKFLOWS: SanitizedWorkflow[] = INITIAL_CLINICS.flatMap(
  (clinic, idx) => buildClinicWorkflows(clinic, (idx + 1) * 1000)
);

export const INITIAL_EXECUTIONS: WorkflowExecution[] = INITIAL_CLINICS.flatMap(
  (clinic) => buildClinicExecutions(clinic)
);

export const INITIAL_ENGINE_SETTINGS: EngineSettings = {
  engineUrl:
    process.env.N8N_BASE_URL || "https://n8n.srv1163909.hstgr.cloud",
  apiKeyConfigured: Boolean(process.env.N8N_API_KEY),
  apiKeyMasked: process.env.N8N_API_KEY
    ? "••••••••••••"
    : "Not configured (Hybrid Mode)",
  syncMode: "hybrid",
  lastSyncedAt: "2026-11-11T07:30:00Z",
  portalBrandName: "ClinicFlow Automation Studio",
};
