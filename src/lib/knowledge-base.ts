import { SanitizedWorkflow, WorkflowExecution } from "./types";
import { RawN8nExecution, RawN8nWorkflow } from "./sanitizer";

export interface ClinicServiceItem {
  service: string;
  price: string;
  duration: string;
  details: string;
}

export interface N8nKnowledgeBaseSource {
  workflowId: string;
  workflowName: string;
  kbNodeNames: string[];
  vectorStoreCollection: string;
  rawSystemPrompt: string;
  rawKbDocuments: string[];
  syncedFromN8nAt: string;
  liveEngineConnected: boolean;
}

export interface ClinicKnowledgeBase {
  clinicId: string;
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  workingHours: string;
  leadDentists: string[];
  acceptedInsurance: string[];
  availableSlotsTomorrow: string[];
  services: ClinicServiceItem[];
  faqs: Array<{ question: string; answer: string }>;
  customNotes: string;
  updatedAt: string;
  n8nSource?: N8nKnowledgeBaseSource;
}

export const INITIAL_KNOWLEDGE_BASES: Record<string, ClinicKnowledgeBase> = {
  "clinic-prodent": {
    clinicId: "clinic-prodent",
    clinicName: "Prodent Dental Clinic",
    tagline: "Advanced Cosmetic, Implant & Family Dentistry",
    address: "14 Prodent Avenue, East Legon, Accra",
    phone: "+233 24 555 0101",
    workingHours: "Mon – Fri: 8:00 AM – 6:00 PM | Sat: 9:00 AM – 4:00 PM",
    leadDentists: [
      "Dr. Marcus Vance (Lead Implantologist)",
      "Dr. Nana Ama Mensah (Cosmetic & Veneer Specialist)",
    ],
    acceptedInsurance: [
      "Nationwide Medical",
      "Acacia Health Insurance",
      "Cosmopolitan Health",
      "Apex Health",
      "Private / Cash / MoMo / Visa",
    ],
    availableSlotsTomorrow: ["9:30 AM", "11:30 AM", "2:00 PM", "4:30 PM"],
    services: [
      {
        service: "General Dental Consultation & Digital X-Ray",
        price: "GHS 250",
        duration: "30 mins",
        details: "Comprehensive oral exam, intraoral camera scan, and treatment plan.",
      },
      {
        service: "Scaling & Polishing (Teeth Cleaning)",
        price: "GHS 450",
        duration: "45 mins",
        details: "Ultrasonic plaque/tartar removal, airflow stain polishing, and fluoride treatment.",
      },
      {
        service: "In-Office Laser Teeth Whitening",
        price: "GHS 1,800",
        duration: "60 mins",
        details: "Philips Zoom / Laser whitening up to 8 shades brighter in a single visit.",
      },
      {
        service: "Root Canal Treatment",
        price: "GHS 1,500 – GHS 2,200",
        duration: "60 – 90 mins",
        details: "Painless rotary endodontics for anterior or molar teeth.",
      },
      {
        service: "Titanium Dental Implant (Complete with Crown)",
        price: "GHS 8,500",
        duration: "2 stages",
        details: "Swiss-grade titanium implant fixture + custom zirconia crown.",
      },
      {
        service: "Porcelain Veneers / Hollywood Smile",
        price: "GHS 3,200 per tooth",
        duration: "2 visits",
        details: "Ultra-thin E-Max porcelain veneers custom-designed for your smile.",
      },
      {
        service: "Tooth Extraction (Simple / Surgical Wisdom Tooth)",
        price: "GHS 400 – GHS 1,200",
        duration: "30 – 60 mins",
        details: "Atraumatic extraction under local anesthesia with post-op care kit.",
      },
    ],
    faqs: [
      {
        question: "Do you handle dental emergencies?",
        answer:
          "Yes! Prodent Dental Clinic reserves same-day emergency slots for severe toothache, swelling, or broken teeth. Call +233 24 555 0101 or book directly here.",
      },
      {
        question: "Can I pay in installments for braces or implants?",
        answer:
          "Yes, Prodent offers a 3-to-6 month flexible 0% interest payment plan for Dental Implants, Braces, and Veneer packages after a 40% initial deposit.",
      },
    ],
    customNotes:
      "Prodent Dental Clinic specializes in painless laser dentistry and same-day digital crowns. Free parking is available on-site.",
    updatedAt: "2026-11-11T08:00:00Z",
  },

  "clinic-omabod": {
    clinicId: "clinic-omabod",
    clinicName: "Omabod Dental Clinic",
    tagline: "Trusted Family, Restorative & Preventive Dental Care",
    address: "28 Omabod Plaza, Osu Ringway, Accra",
    phone: "+233 20 555 0202",
    workingHours: "Mon – Sat: 8:30 AM – 5:30 PM (Closed Sundays)",
    leadDentists: [
      "Dr. Kwame Omabod (Senior Dental Surgeon)",
      "Dr. Abena Osei (Restorative & Pediatric Dentist)",
    ],
    acceptedInsurance: [
      "Premier Health Insurance",
      "Glico Healthcare",
      "Phoenix Health Insurance",
      "Metropolitan Health",
      "MoMo & Card Payments",
    ],
    availableSlotsTomorrow: ["10:00 AM", "1:00 PM", "3:30 PM"],
    services: [
      {
        service: "Dental Consultation & Checkup",
        price: "GHS 200",
        duration: "30 mins",
        details: "Full dental examination and personalized oral hygiene plan.",
      },
      {
        service: "Scaling & Polishing (Deep Cleaning)",
        price: "GHS 400",
        duration: "45 mins",
        details: "Complete ultrasonic scaling and polishing for healthy gums.",
      },
      {
        service: "Professional Teeth Whitening",
        price: "GHS 1,500",
        duration: "60 mins",
        details: "Safe, sensitivity-free clinical whitening + take-home maintenance gel.",
      },
      {
        service: "Composite Tooth Filling (Tooth-Colored)",
        price: "GHS 350 – GHS 550",
        duration: "30 mins",
        details: "High-strength aesthetic composite restoration for cavities.",
      },
      {
        service: "Metal & Ceramic Orthodontic Braces",
        price: "GHS 6,500 (Full Arch)",
        duration: "12 – 18 months",
        details: "Includes initial orthodontic records, brackets, and monthly adjustments.",
      },
      {
        service: "Zirconia / Porcelain Dental Crown",
        price: "GHS 2,500",
        duration: "2 visits",
        details: "High-durability custom crown for cracked or root-treated teeth.",
      },
    ],
    faqs: [
      {
        question: "Is Omabod Dental child-friendly?",
        answer:
          "Absolutely! Dr. Abena Osei leads our dedicated pediatric dental bay with gentle fluoride varnish and fissure sealants for children.",
      },
      {
        question: "How do I book an appointment at Omabod Dental?",
        answer:
          "You can reply with your preferred time slot right here in the chat, or call our Osu Ringway front desk at +233 20 555 0202.",
      },
    ],
    customNotes:
      "Omabod Dental Clinic offers a 10% family discount when 3 or more family members book scaling & polishing together.",
    updatedAt: "2026-11-11T08:00:00Z",
  },

  "clinic-busybite": {
    clinicId: "clinic-busybite",
    clinicName: "BusyBite Dental Studio",
    tagline: "Express Modern Dentistry & Clear Aligner Studio",
    address: "Suite 4B, BusyBite Tower, Airport Residential, Accra",
    phone: "+233 55 555 0303",
    workingHours: "Mon – Fri: 7:30 AM – 8:00 PM | Sat – Sun: 10:00 AM – 5:00 PM",
    leadDentists: [
      "Dr. Kofi Boateng (Clear Aligner & Ortho Director)",
      "Dr. Sophia Tetteh (Express Cosmetic Dentist)",
    ],
    acceptedInsurance: [
      "Bupa Global",
      "Cigna International",
      "Acacia Health",
      "Nationwide Medical",
      "All Major Cards & Mobile Money",
    ],
    availableSlotsTomorrow: ["8:00 AM", "12:30 PM", "3:00 PM", "6:00 PM"],
    services: [
      {
        service: "Express 3D Smile Scan & Consultation",
        price: "GHS 300",
        duration: "25 mins",
        details: "iTero 3D digital mouth scan showing your future smile simulation.",
      },
      {
        service: "AirFlow Spa Scaling & Polishing",
        price: "GHS 550",
        duration: "40 mins",
        details: "Swiss EMS Guided Biofilm Therapy with warm water — zero pain.",
      },
      {
        service: "BusyBite Clear Aligners (Invisible Braces)",
        price: "GHS 12,000",
        duration: "6 – 14 months",
        details: "Custom transparent removable aligners with bi-weekly digital tracking.",
      },
      {
        service: "Express Lunch-Hour Teeth Whitening",
        price: "GHS 2,000",
        duration: "45 mins",
        details: "Rapid LED whitening designed for busy professionals.",
      },
      {
        service: "Composite Bonding (Edge Repair / Gap Closure)",
        price: "GHS 900 per tooth",
        duration: "45 mins",
        details: "Single-visit aesthetic sculpting without drilling natural enamel.",
      },
    ],
    faqs: [
      {
        question: "Are you open in the evenings and on Sundays?",
        answer:
          "Yes! BusyBite Dental Studio is built for busy schedules — we stay open until 8:00 PM on weekdays and 10:00 AM – 5:00 PM on Saturdays and Sundays.",
      },
    ],
    customNotes:
      "BusyBite Dental Studio guarantees zero waiting time — if we keep you waiting more than 10 minutes past your booked time, your consultation is complimentary.",
    updatedAt: "2026-11-11T08:00:00Z",
  },

  "clinic-reign": {
    clinicId: "clinic-reign",
    clinicName: "Reign Dental Clinic",
    tagline: "Luxury Aesthetic, Implant & Full-Mouth Rehabilitation",
    address: "7 Reign Boulevard, Cantonments, Accra",
    phone: "+233 50 555 0404",
    workingHours: "Mon – Sat: 9:00 AM – 6:30 PM",
    leadDentists: [
      "Dr. Desmond Reign (Chief Prosthodontist & Implant Surgeon)",
      "Dr. Nadia Owusu (Periodontist & Laser Gum Specialist)",
    ],
    acceptedInsurance: [
      "Aetna International",
      "Allianz Care",
      "Cosmopolitan Health",
      "Premier Health",
      "VIP Concierge Billing",
    ],
    availableSlotsTomorrow: ["10:30 AM", "1:30 PM", "4:00 PM"],
    services: [
      {
        service: "VIP Executive Dental Assessment & 3D CBCT Scan",
        price: "GHS 350",
        duration: "45 mins",
        details: "Full 3D cone-beam CT scan, digital smile design, and specialist consult.",
      },
      {
        service: "Royal Ultrasonic Scaling & Diamond Polish",
        price: "GHS 500",
        duration: "45 mins",
        details: "Deep periodontal cleaning + diamond paste enamel polish.",
      },
      {
        service: "Reign Signature Porcelain Veneers",
        price: "GHS 3,500 per tooth",
        duration: "2 visits",
        details: "Hand-layered master ceramist veneers with a 10-year warranty.",
      },
      {
        service: "All-on-4 / Full-Arch Dental Implants",
        price: "GHS 42,000 per arch",
        duration: "Same-day provisional teeth",
        details: "Guided implant surgery restoring a full arch of fixed teeth.",
      },
      {
        service: "Laser Gum Depigmentation & Contouring",
        price: "GHS 2,800",
        duration: "60 mins",
        details: "Painless water-laser treatment for dark or uneven gums.",
      },
      {
        service: "Sapphire & Self-Ligating Braces",
        price: "GHS 9,000",
        duration: "12 – 15 months",
        details: "Low-friction crystal-clear brackets for faster, comfortable alignment.",
      },
    ],
    faqs: [
      {
        question: "Do you offer sedation for nervous patients?",
        answer:
          "Yes, Reign Dental Clinic offers both laughing gas (nitrous oxide) and IV conscious sedation for completely stress-free dental procedures.",
      },
    ],
    customNotes:
      "Reign Dental Clinic features private VIP treatment suites in Cantonments with complimentary valet service.",
    updatedAt: "2026-11-11T08:00:00Z",
  },
};

export function createDefaultKnowledgeBaseForClinic(
  clinicId: string,
  clinicName: string,
  location: string
): ClinicKnowledgeBase {
  return {
    clinicId,
    clinicName,
    tagline: `Official Patient Knowledge Base for ${clinicName}`,
    address: location || "Main Clinic Branch",
    phone: "+233 24 000 0000",
    workingHours: "Mon – Sat: 8:00 AM – 6:00 PM",
    leadDentists: [`Lead Dental Surgeon (${clinicName})`],
    acceptedInsurance: ["Major Health Insurance & Mobile Money / Card"],
    availableSlotsTomorrow: ["10:00 AM", "2:00 PM", "4:00 PM"],
    services: [
      {
        service: "Dental Consultation & Checkup",
        price: "GHS 250",
        duration: "30 mins",
        details: "Comprehensive dental examination and treatment plan.",
      },
      {
        service: "Scaling & Polishing (Teeth Cleaning)",
        price: "GHS 450",
        duration: "45 mins",
        details: "Full ultrasonic teeth cleaning and polishing.",
      },
      {
        service: "Teeth Whitening",
        price: "GHS 1,600",
        duration: "60 mins",
        details: "Professional in-office teeth whitening.",
      },
    ],
    faqs: [
      {
        question: `How do I book a visit at ${clinicName}?`,
        answer: `Reply here with your preferred day and time, and our AI Agent will book your slot directly into ${clinicName}'s calendar.`,
      },
    ],
    customNotes: `All inquiries are answered strictly using ${clinicName}'s verified clinical protocols.`,
    updatedAt: new Date().toISOString(),
  };
}

export function formatKbAsN8nSystemPrompt(kb: ClinicKnowledgeBase): string {
  const servicesBlock = kb.services
    .map((s) => `- ${s.service}: ${s.price} (${s.duration}) — ${s.details}`)
    .join("\n");
  const faqBlock = kb.faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  return [
    `# ${kb.clinicName} — Official n8n AI Agent & Vector Store Knowledge Base`,
    `Tagline: ${kb.tagline}`,
    `Address: ${kb.address}`,
    `Phone: ${kb.phone}`,
    `Working Hours: ${kb.workingHours}`,
    `Lead Dentists: ${kb.leadDentists.join(", ")}`,
    `Accepted Insurance: ${kb.acceptedInsurance.join(", ")}`,
    `Available Slots Tomorrow: ${kb.availableSlotsTomorrow.join(", ")}`,
    ``,
    `## Services & Pricing`,
    servicesBlock,
    ``,
    `## FAQs & Policies`,
    faqBlock,
    ``,
    `Notes: ${kb.customNotes}`,
  ].join("\n");
}

/**
 * Extracts and builds a ClinicKnowledgeBase directly from a clinic's n8n workflows
 * (both raw n8n API workflows and sanitized studio workflows) and n8n execution outputs.
 * Reads AI Agent systemMessage/systemPrompt, Vector Store / RAG Tool nodes,
 * Google Docs/Sheets/Supabase/Code KB nodes, and execution runData.
 */
export function extractKnowledgeBaseFromN8nWorkflows(params: {
  clinicId: string;
  clinicName: string;
  clinicLocation: string;
  sanitizedWorkflows: SanitizedWorkflow[];
  rawWorkflows?: RawN8nWorkflow[];
  rawExecutions?: RawN8nExecution[];
  sanitizedExecutions?: WorkflowExecution[];
  existingKb?: ClinicKnowledgeBase | null;
  liveConnected?: boolean;
}): ClinicKnowledgeBase {
  const baseKb: ClinicKnowledgeBase =
    params.existingKb ||
    INITIAL_KNOWLEDGE_BASES[params.clinicId] ||
    createDefaultKnowledgeBaseForClinic(
      params.clinicId,
      params.clinicName,
      params.clinicLocation
    );

  const clinicWfs = params.sanitizedWorkflows.filter(
    (w) => w.clinicId === params.clinicId
  );

  const kbNodeNames: string[] = [];
  const extractedPrompts: string[] = [];
  const extractedKbDocs: string[] = [];
  let vectorStoreCollection = `${params.clinicId.replace(/^clinic-/, "")}_dental_kb_vector_store`;
  let primaryWfId = clinicWfs[0]?.externalId || clinicWfs[0]?.id || "1001";
  let primaryWfName =
    clinicWfs[0]?.name || `${params.clinicName} — WhatsApp AI Agent`;

  // 1. Inspect Raw n8n API workflows if present
  if (params.rawWorkflows && params.rawWorkflows.length > 0) {
    for (const rawWf of params.rawWorkflows) {
      for (const rawNode of rawWf.nodes || []) {
        const nodeType = String(rawNode.type || "").toLowerCase();
        const nodeName = rawNode.name || "Node";
        const p = (rawNode.parameters || {}) as Record<string, unknown>;
        const opts = (p.options || {}) as Record<string, unknown>;

        // Check AI Agent / LLM nodes for systemMessage / prompt
        if (
          nodeType.includes("agent") ||
          nodeType.includes("chain") ||
          nodeType.includes("openai") ||
          nodeType.includes("llm")
        ) {
          kbNodeNames.push(`${nodeName} (n8n AI Agent)`);
          const candidates = [
            opts.systemMessage,
            p.systemMessage,
            p.systemPrompt,
            p.text,
            p.prompt,
            p.instructions,
          ];
          for (const c of candidates) {
            if (typeof c === "string" && c.trim().length > 15) {
              extractedPrompts.push(c.trim());
            }
          }
        }

        // Check Vector Store / Knowledge Base / Tool / Document / DB nodes
        if (
          nodeType.includes("vector") ||
          nodeType.includes("tool") ||
          nodeType.includes("supabase") ||
          nodeType.includes("pinecone") ||
          nodeType.includes("qdrant") ||
          nodeType.includes("pgvector") ||
          nodeType.includes("googlesheets") ||
          nodeType.includes("googledocs") ||
          nodeType.includes("airtable") ||
          nodeType.includes("notion") ||
          nodeType.includes("postgres") ||
          nodeType.includes("code") ||
          nodeType.includes("set") ||
          nodeName.toLowerCase().includes("kb") ||
          nodeName.toLowerCase().includes("knowledge")
        ) {
          kbNodeNames.push(`${nodeName} (n8n KB Tool)`);
          const indexCand =
            p.tableName ||
            p.indexName ||
            p.collection ||
            p.pineconeIndex ||
            p.qdrantCollection ||
            p.knowledgeBase ||
            p.documentId;
          if (typeof indexCand === "string" && indexCand.trim()) {
            vectorStoreCollection = indexCand.trim();
          }

          for (const key of [
            "description",
            "kbContent",
            "knowledgeBase",
            "content",
            "text",
            "jsCode",
            "query",
          ]) {
            const val = p[key];
            if (typeof val === "string" && val.trim().length > 10) {
              extractedKbDocs.push(`[${nodeName}] ${val.trim()}`);
            }
          }
        }
      }
    }
  }

  // 2. Inspect Sanitized Workflows on Canvas (includes user-edited node parameters & imported n8n JSON)
  for (const wf of clinicWfs) {
    for (const node of wf.nodes) {
      const lower = `${node.name} ${node.typeLabel}`.toLowerCase();
      const cfg = node.configSummary || {};

      if (
        node.category === "ai" ||
        lower.includes("agent") ||
        lower.includes("kb") ||
        lower.includes("knowledge") ||
        lower.includes("calendar") ||
        lower.includes("tool") ||
        lower.includes("vector") ||
        lower.includes("database")
      ) {
        if (!kbNodeNames.includes(node.name)) {
          kbNodeNames.push(node.name);
        }
        if (typeof cfg.knowledgeBase === "string" && cfg.knowledgeBase.trim()) {
          vectorStoreCollection = cfg.knowledgeBase.trim();
        }
        if (typeof cfg.tableName === "string" && cfg.tableName.trim()) {
          vectorStoreCollection = cfg.tableName.trim();
        }

        for (const [k, v] of Object.entries(cfg)) {
          if (typeof v !== "string" || !v.trim()) continue;
          const lk = k.toLowerCase();
          if (
            lk.includes("system") ||
            lk.includes("prompt") ||
            lk.includes("instruction")
          ) {
            if (!extractedPrompts.includes(v.trim())) {
              extractedPrompts.push(v.trim());
            }
          } else if (
            lk.includes("kb") ||
            lk.includes("knowledge") ||
            lk.includes("content") ||
            lk.includes("doc") ||
            lk.includes("service") ||
            lk.includes("price") ||
            lk.includes("faq")
          ) {
            const entry = `[${node.name} • ${k}] ${v.trim()}`;
            if (!extractedKbDocs.includes(entry)) {
              extractedKbDocs.push(entry);
            }
          }
        }
      }
    }
  }

  // 3. Inspect Raw n8n Execution runData for retrieved KB chunks
  if (params.rawExecutions && params.rawExecutions.length > 0) {
    for (const exec of params.rawExecutions.slice(0, 10)) {
      const runData = exec.data?.resultData?.runData || {};
      for (const [nodeName, runs] of Object.entries(runData)) {
        const lowerNode = nodeName.toLowerCase();
        if (
          lowerNode.includes("kb") ||
          lowerNode.includes("knowledge") ||
          lowerNode.includes("vector") ||
          lowerNode.includes("tool") ||
          lowerNode.includes("doc") ||
          lowerNode.includes("sheet")
        ) {
          const firstItem = runs?.[0]?.data?.main?.[0]?.[0]?.json;
          if (firstItem && typeof firstItem === "object") {
            const snippet = JSON.stringify(firstItem);
            if (snippet.length > 15 && snippet.length < 3000) {
              extractedKbDocs.push(`[n8n Execution • ${nodeName}] ${snippet}`);
            }
          }
        }
      }
    }
  }

  // 4. Parse structured overrides from extracted n8n prompt / KB text if present
  const combinedText = [...extractedPrompts, ...extractedKbDocs].join("\n");
  let parsedAddress = baseKb.address;
  let parsedPhone = baseKb.phone;
  let parsedHours = baseKb.workingHours;
  let parsedDentists = [...baseKb.leadDentists];
  let parsedInsurance = [...baseKb.acceptedInsurance];
  let parsedSlots = [...baseKb.availableSlotsTomorrow];
  const parsedServices = [...baseKb.services];
  const parsedFaqs = [...baseKb.faqs];

  if (combinedText.length > 20) {
    const addrMatch = combinedText.match(
      /(?:Address|Location|Branch)\s*:\s*([^\n\r]+)/i
    );
    if (addrMatch?.[1]?.trim()) parsedAddress = addrMatch[1].trim();

    const phoneMatch = combinedText.match(
      /(?:Phone|Tel|Contact|Direct Line)\s*:\s*([^\n\r]+)/i
    );
    if (phoneMatch?.[1]?.trim()) parsedPhone = phoneMatch[1].trim();

    const hoursMatch = combinedText.match(
      /(?:Working Hours|Opening Hours|Hours)\s*:\s*([^\n\r]+)/i
    );
    if (hoursMatch?.[1]?.trim()) parsedHours = hoursMatch[1].trim();

    const dentistsMatch = combinedText.match(
      /(?:Lead Dentists|Dentists|Doctors)\s*:\s*([^\n\r]+)/i
    );
    if (dentistsMatch?.[1]?.trim()) {
      const list = dentistsMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) parsedDentists = list;
    }

    const insMatch = combinedText.match(
      /(?:Accepted Insurance|Insurance)\s*:\s*([^\n\r]+)/i
    );
    if (insMatch?.[1]?.trim()) {
      const list = insMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) parsedInsurance = list;
    }

    const slotsMatch = combinedText.match(
      /(?:Available Slots Tomorrow|Open Slots|Available Slots)\s*:\s*([^\n\r]+)/i
    );
    if (slotsMatch?.[1]?.trim()) {
      const list = slotsMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length > 0) parsedSlots = list;
    }

    // Parse any bulleted service lines formatted like: "- Service Name: GHS 500 (45 mins) — Details"
    const serviceRegex =
      /^[-•*]\s*([^:\n]{3,65}):\s*((?:GHS|\$|USD|EUR|GBP)\s*[\d,]+(?:\s*[–-]\s*(?:GHS|\$|USD|EUR|GBP)?\s*[\d,]+)?(?:\s*per\s+\w+)?)\s*(?:\(([^)]+)\))?\s*(?:[—-]\s*(.+))?$/gim;
    let m: RegExpExecArray | null;
    const newlyFoundServices: ClinicServiceItem[] = [];
    while ((m = serviceRegex.exec(combinedText)) !== null) {
      newlyFoundServices.push({
        service: m[1].trim(),
        price: m[2].trim(),
        duration: (m[3] || "45 mins").trim(),
        details: (
          m[4] || `Clinical procedure at ${params.clinicName}.`
        ).trim(),
      });
    }
    if (newlyFoundServices.length > 0) {
      for (const ns of newlyFoundServices) {
        const idx = parsedServices.findIndex(
          (s) => s.service.toLowerCase() === ns.service.toLowerCase()
        );
        if (idx >= 0) {
          parsedServices[idx] = ns;
        } else {
          parsedServices.push(ns);
        }
      }
    }
  }

  const finalKb: ClinicKnowledgeBase = {
    ...baseKb,
    address: parsedAddress,
    phone: parsedPhone,
    workingHours: parsedHours,
    leadDentists: parsedDentists,
    acceptedInsurance: parsedInsurance,
    availableSlotsTomorrow: parsedSlots,
    services: parsedServices,
    faqs: parsedFaqs,
    updatedAt: new Date().toISOString(),
  };

  const fullN8nPrompt =
    extractedPrompts.find((p) => p.length > 140) ||
    formatKbAsN8nSystemPrompt(finalKb);

  finalKb.n8nSource = {
    workflowId: primaryWfId,
    workflowName: primaryWfName,
    kbNodeNames:
      kbNodeNames.length > 0
        ? kbNodeNames.slice(0, 6)
        : [
            `${params.clinicName.split(" ")[0]} WhatsApp AI Agent`,
            `${params.clinicName.split(" ")[0]} Calendar & KB Tool`,
          ],
    vectorStoreCollection,
    rawSystemPrompt: fullN8nPrompt,
    rawKbDocuments:
      extractedKbDocs.length > 0
        ? extractedKbDocs
        : [
            `[n8n Vector Store • ${vectorStoreCollection}] Indexed ${finalKb.services.length} dental procedures, ${finalKb.faqs.length} clinical FAQs, insurance policies, and live chair availability for ${params.clinicName}.`,
          ],
    syncedFromN8nAt: new Date().toISOString(),
    liveEngineConnected: Boolean(params.liveConnected),
  };

  return finalKb;
}
export function queryClinicKnowledgeBase(
  kb: ClinicKnowledgeBase,
  userMessage: string
): {
  matchedSection: string;
  retrievedFacts: Record<string, unknown>;
  agentReply: string;
} {
  const q = userMessage.toLowerCase();
  const n8nNodeLabel =
    kb.n8nSource?.kbNodeNames?.find(
      (n) =>
        n.toLowerCase().includes("kb") ||
        n.toLowerCase().includes("vector") ||
        n.toLowerCase().includes("calendar") ||
        n.toLowerCase().includes("knowledge")
    ) ||
    kb.n8nSource?.kbNodeNames?.[0] ||
    `${kb.clinicName.split(" ")[0]} Calendar & KB Tool`;
  const n8nVectorStore =
    kb.n8nSource?.vectorStoreCollection ||
    `${kb.clinicId.replace(/^clinic-/, "")}_dental_kb_vector_store`;
  const n8nMeta = {
    n8nWorkflow: kb.n8nSource?.workflowName || `${kb.clinicName} — WhatsApp AI Agent`,
    n8nKbNode: n8nNodeLabel,
    n8nVectorStore,
  };

  // 1. Check for specific dental service / price inquiries
  const STOP_WORDS = new Set([
    "dental",
    "teeth",
    "tooth",
    "hour",
    "hours",
    "with",
    "full",
    "visit",
    "visits",
    "care",
    "express",
    "lunch",
  ]);
  const matchedServices = kb.services.filter((s) => {
    const words = s.service.toLowerCase().split(/[\s()/&-]+/);
    return (
      words.some(
        (w) => w.length >= 5 && !STOP_WORDS.has(w) && q.includes(w)
      ) ||
      (q.includes("clean") && s.service.toLowerCase().includes("scaling")) ||
      (q.includes("whiten") && s.service.toLowerCase().includes("whiten")) ||
      (q.includes("implant") && s.service.toLowerCase().includes("implant")) ||
      (q.includes("veneer") && s.service.toLowerCase().includes("veneer")) ||
      (q.includes("brace") &&
        (s.service.toLowerCase().includes("brace") ||
          s.service.toLowerCase().includes("aligner"))) ||
      (q.includes("aligner") && s.service.toLowerCase().includes("aligner")) ||
      (q.includes("root") && s.service.toLowerCase().includes("root")) ||
      (q.includes("extract") && s.service.toLowerCase().includes("extract")) ||
      (q.includes("toothache") && s.service.toLowerCase().includes("consult")) ||
      (q.includes("fill") && s.service.toLowerCase().includes("fill")) ||
      (q.includes("crown") && s.service.toLowerCase().includes("crown"))
    );
  });

  if (
    matchedServices.length > 0 ||
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("how much") ||
    q.includes("rate") ||
    q.includes("charge") ||
    q.includes("service")
  ) {
    const targetList =
      matchedServices.length > 0 ? matchedServices : kb.services.slice(0, 4);

    const formattedList = targetList
      .map((s) => `• ${s.service}: ${s.price} (${s.duration}) — ${s.details}`)
      .join("\n");

    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Services & Pricing`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} Verified Price List`,
        matchedServices: targetList.map((s) => ({
          service: s.service,
          price: s.price,
          duration: s.duration,
        })),
        availableSlotsTomorrow: kb.availableSlotsTomorrow,
      },
      agentReply: `Here is the official pricing & service information retrieved from **${kb.clinicName}**'s n8n Knowledge Base (${n8nVectorStore}):\n\n${formattedList}\n\nWe currently have open slots tomorrow at **${kb.availableSlotsTomorrow.join(", ")}** at our **${kb.address}** branch. Would you like me to book one of these times for you?`,
    };
  }

  // 2. Check for location / address / working hours / open times / phone contact
  if (
    q.includes("where") ||
    q.includes("location") ||
    q.includes("address") ||
    q.includes("branch") ||
    q.includes("open") ||
    q.includes("hour") ||
    q.includes("time") ||
    q.includes("sunday") ||
    q.includes("saturday") ||
    q.includes("weekend") ||
    q.includes("contact") ||
    q.includes("phone") ||
    q.includes("call")
  ) {
    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Location & Working Hours`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} Facility Directory`,
        address: kb.address,
        workingHours: kb.workingHours,
        phone: kb.phone,
      },
      agentReply: `**${kb.clinicName}** is located at **${kb.address}**.\n\n• **Working Hours:** ${kb.workingHours}\n• **Direct Line:** ${kb.phone}\n• **Next Available Slots Tomorrow:** ${kb.availableSlotsTomorrow.join(", ")}\n\nWould you like me to reserve an appointment slot for you?`,
    };
  }

  // 3. Check for Insurance / Payment Plan inquiries
  if (
    q.includes("insurance") ||
    q.includes("accept") ||
    q.includes("cover") ||
    q.includes("payment") ||
    q.includes("installment") ||
    q.includes("momo") ||
    q.includes("card")
  ) {
    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Insurance & Billing`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} Insurance & Payment Policy`,
        acceptedInsurance: kb.acceptedInsurance,
      },
      agentReply: `At **${kb.clinicName}**, we accept:\n• ${kb.acceptedInsurance.join("\n• ")}\n\n${
        kb.faqs.find((f) => f.question.toLowerCase().includes("installment"))
          ?.answer || kb.customNotes
      }\n\nWould you like to book a consultation (${kb.services[0]?.price || "GHS 250"})?`,
    };
  }

  // 4. Check for Doctor / Dentist / Specialist inquiries
  if (
    q.includes("doctor") ||
    q.includes("dentist") ||
    q.includes("specialist") ||
    q.includes("who") ||
    q.includes("surgeon")
  ) {
    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Clinical Team & Specialists`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} Medical Roster`,
        leadDentists: kb.leadDentists,
      },
      agentReply: `Your care at **${kb.clinicName}** is led by our specialist team:\n• ${kb.leadDentists.join("\n• ")}\n\nWe have consultation openings tomorrow at **${kb.availableSlotsTomorrow.join(", ")}**. Which time works best for you?`,
    };
  }

  // 5. Check for Booking / Appointment / Slot requests
  if (
    q.includes("book") ||
    q.includes("appointment") ||
    q.includes("slot") ||
    q.includes("tomorrow") ||
    q.includes("schedule") ||
    q.includes("visit") ||
    q.includes("am") ||
    q.includes("pm")
  ) {
    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Calendar & Booking Rules`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} Live Chair Availability`,
        availableSlotsTomorrow: kb.availableSlotsTomorrow,
        consultationFee: kb.services[0]?.price,
        location: kb.address,
      },
      agentReply: `I checked **${kb.clinicName}**'s live appointment calendar at **${kb.address}**.\n\n• **Available Slots Tomorrow:** ${kb.availableSlotsTomorrow.join(", ")}\n• **Standard Consultation:** ${kb.services[0]?.price} (${kb.services[0]?.duration})\n• **Scaling & Polishing:** ${kb.services[1]?.price || "GHS 450"}\n\nReply with your preferred time and full name to lock in your booking!`,
    };
  }

  // 6. Check FAQs
  const matchedFaq = kb.faqs.find((f) =>
    f.question
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.length > 4 && q.includes(w))
  );
  if (matchedFaq) {
    return {
      matchedSection: `n8n KB (${n8nNodeLabel}) — Clinical FAQ`,
      retrievedFacts: {
        ...n8nMeta,
        kbSource: `${kb.clinicName} FAQ`,
        question: matchedFaq.question,
        answer: matchedFaq.answer,
      },
      agentReply: `From **${kb.clinicName}**'s n8n Knowledge Base:\n\n${matchedFaq.answer}\n\nWe have openings tomorrow at **${kb.availableSlotsTomorrow.join(", ")}** if you'd like to come in!`,
    };
  }

  // 6.5. Check Raw n8n System Prompt / Vector Store Chunks for any custom lines matching the query
  const rawN8nText = [
    kb.n8nSource?.rawSystemPrompt || "",
    ...(kb.n8nSource?.rawKbDocuments || []),
  ].join("\n");
  if (rawN8nText) {
    const queryWords = q
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
    if (queryWords.length > 0) {
      const matchingLines = rawN8nText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 15 &&
            !l.startsWith("#") &&
            queryWords.some((kw) => l.toLowerCase().includes(kw))
        );
      if (matchingLines.length > 0) {
        const snippet = matchingLines.slice(0, 4).join("\n• ");
        return {
          matchedSection: `n8n KB (${n8nNodeLabel}) — Raw Prompt & Vector Chunks`,
          retrievedFacts: {
            ...n8nMeta,
            matchedN8nLines: matchingLines.slice(0, 4),
          },
          agentReply: `Retrieved directly from **${kb.clinicName}**'s n8n Knowledge Base (${n8nNodeLabel}):\n\n• ${snippet}\n\nOpen slots tomorrow: **${kb.availableSlotsTomorrow.join(", ")}**.`,
        };
      }
    }
  }

  // 7. Comprehensive General Overview from that clinic's KB
  const topServices = kb.services
    .slice(0, 4)
    .map((s) => `• ${s.service}: ${s.price}`)
    .join("\n");

  return {
    matchedSection: `n8n KB (${n8nNodeLabel}) — General Clinic Overview`,
    retrievedFacts: {
      ...n8nMeta,
      kbSource: `${kb.clinicName} Master Knowledge Base`,
      address: kb.address,
      workingHours: kb.workingHours,
      phone: kb.phone,
      highlightedServices: kb.services.slice(0, 3),
    },
    agentReply: `Welcome to **${kb.clinicName}** (${kb.tagline})!\n\n📍 **Location:** ${kb.address}\n🕒 **Hours:** ${kb.workingHours}\n📞 **Phone:** ${kb.phone}\n\n**Popular Treatments & Fees:**\n${topServices}\n\n**Open Slots Tomorrow:** ${kb.availableSlotsTomorrow.join(", ")}\n\nAsk me about any specific treatment price, insurance coverage, our dentists, or tell me what time you'd like to book!`,
  };
}
