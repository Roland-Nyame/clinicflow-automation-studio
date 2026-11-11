"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  Database,
  FileText,
  GitBranch,
  Globe,
  Hourglass,
  LayoutGrid,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Shuffle,
  Sliders,
  Sparkles,
  Table,
  Terminal,
  Trash2,
  Users,
  Webhook,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  ExecutionStepLog,
  SanitizedWorkflow,
  WhiteLabelNode,
  WhiteLabelNodeCategory,
  WorkflowEdge,
} from "@/lib/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Webhook,
  Clock,
  FileText,
  Play,
  Globe,
  Database,
  Calendar,
  Table,
  MessageSquare,
  MessageCircle,
  Mail,
  Bell,
  Sparkles,
  Bot,
  GitBranch,
  Shuffle,
  Sliders,
  Code,
  Hourglass,
  Users,
  Cpu,
};

const NODE_PALETTE_TEMPLATES: Array<{
  name: string;
  typeLabel: string;
  category: WhiteLabelNodeCategory;
  icon: string;
  description: string;
  defaultConfig: Record<string, string | number | boolean>;
  isSubNode?: "Model" | "Memory" | "Tools";
}> = [
  {
    name: "WhatsApp Cloud Trigger",
    typeLabel: "WhatsApp Incoming Trigger",
    category: "trigger",
    icon: "MessageCircle",
    description: "Triggers when a patient sends a WhatsApp message or voice note",
    defaultConfig: { channel: "WhatsApp Business API", events: "messages.text, messages.audio" },
  },
  {
    name: "Facebook Messenger Trigger",
    typeLabel: "Facebook Messenger Webhook",
    category: "trigger",
    icon: "Globe",
    description: "Triggers on new Facebook Page messages or Lead Ad submissions",
    defaultConfig: { platform: "Meta Graph API", events: "messages, leadgen" },
  },
  {
    name: "Instagram DM Trigger",
    typeLabel: "Instagram Direct Gateway",
    category: "trigger",
    icon: "Webhook",
    description: "Triggers when a follower sends an Instagram DM or keyword comment",
    defaultConfig: { platform: "Instagram Graph", keyword: "SMILE" },
  },
  {
    name: "Autonomous AI Agent",
    typeLabel: "Autonomous AI Agent",
    category: "ai",
    icon: "Bot",
    description: "Central reasoning agent with Model, Memory, and Clinic Tool ports",
    defaultConfig: {
      agentType: "Tools Agent",
      systemPrompt: "You are a helpful clinic receptionist assistant.",
      temperature: 0.2,
    },
  },
  {
    name: "OpenAI Chat Model",
    typeLabel: "AI Language Model (OpenAI)",
    category: "ai",
    icon: "Sparkles",
    description: "Connects as a Language Model sub-node to the AI Agent",
    defaultConfig: { model: "gpt-4o", maxTokens: 2048 },
    isSubNode: "Model",
  },
  {
    name: "Window Buffer Memory",
    typeLabel: "Conversation Buffer Memory",
    category: "database",
    icon: "Database",
    description: "Remembers patient chat history across messages",
    defaultConfig: { sessionKey: "sender_phone", contextWindowLength: 15 },
    isSubNode: "Memory",
  },
  {
    name: "Clinic Calendar Tool",
    typeLabel: "Clinic Appointment Calendar Tool",
    category: "crm",
    icon: "Calendar",
    description: "Allows the AI Agent to check free slots and book appointments",
    defaultConfig: { calendar: "Main Clinic Chairs", slotDurationMins: 30 },
    isSubNode: "Tools",
  },
  {
    name: "Send WhatsApp Reply",
    typeLabel: "WhatsApp Business Gateway",
    category: "communication",
    icon: "MessageCircle",
    description: "Sends an automated WhatsApp message back to the patient",
    defaultConfig: { operation: "sendText", previewUrl: false },
  },
  {
    name: "Send Facebook Reply",
    typeLabel: "Facebook Graph Connector",
    category: "communication",
    icon: "MessageSquare",
    description: "Replies to the patient on Facebook Messenger",
    defaultConfig: { messagingType: "RESPONSE" },
  },
  {
    name: "Sync Patient to CRM",
    typeLabel: "Patient CRM Sync",
    category: "crm",
    icon: "Users",
    description: "Creates or updates the patient lead record in the clinic CRM",
    defaultConfig: { pipeline: "Inbound Patient Inquiries", stage: "AI Qualified" },
  },
  {
    name: "Conditional IF Router",
    typeLabel: "Conditional Decision Router",
    category: "logic",
    icon: "GitBranch",
    description: "Routes the workflow along True or False branches based on conditions",
    defaultConfig: { condition: "{{ $json.qualified === true }}" },
  },
];

const CATEGORY_COLORS: Record<
  WhiteLabelNodeCategory,
  {
    accentHex: string;
    iconBg: string;
    ring: string;
    badge: string;
  }
> = {
  trigger: {
    accentHex: "#f97316",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white",
    ring: "border-orange-500/50",
    badge: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  },
  ai: {
    accentHex: "#a855f7",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white",
    ring: "border-purple-500/50",
    badge: "text-purple-300 bg-purple-500/10 border-purple-500/30",
  },
  communication: {
    accentHex: "#10b981",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    ring: "border-emerald-500/50",
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  },
  crm: {
    accentHex: "#0ea5e9",
    iconBg: "bg-gradient-to-br from-sky-500 to-blue-600 text-white",
    ring: "border-sky-500/50",
    badge: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  },
  database: {
    accentHex: "#06b6d4",
    iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
    ring: "border-cyan-500/50",
    badge: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
  },
  logic: {
    accentHex: "#f43f5e",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-600 text-white",
    ring: "border-rose-500/50",
    badge: "text-rose-300 bg-rose-500/10 border-rose-500/30",
  },
  integration: {
    accentHex: "#64748b",
    iconBg: "bg-gradient-to-br from-slate-600 to-slate-700 text-white",
    ring: "border-slate-600",
    badge: "text-slate-300 bg-slate-500/10 border-slate-500/30",
  },
};

interface KnowledgeBaseHit {
  clinicName: string;
  matchedSection: string;
  retrievedFacts: Record<string, unknown>;
  agentReply: string;
}

interface WorkflowCanvasProps {
  workflow: SanitizedWorkflow;
  clinicName?: string;
  activeStepNodeId?: string | null;
  completedNodeIds?: string[];
  latestStepLogs?: ExecutionStepLog[];
  brandColor?: string;
  onUpdateWorkflow?: (updated: Partial<SanitizedWorkflow>) => void;
  onRunWorkflow?: (customMessage?: string) => Promise<KnowledgeBaseHit | null | void> | void;
  onSyncKbFromN8n?: () => Promise<void> | void;
  isRunning?: boolean;
}

export default function WorkflowCanvas({
  workflow,
  clinicName,
  activeStepNodeId,
  completedNodeIds = [],
  latestStepLogs = [],
  onUpdateWorkflow,
  onRunWorkflow,
  onSyncKbFromN8n,
  isRunning = false,
}: WorkflowCanvasProps) {
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Node Dragging State (n8n-style interactive node dragging)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  // n8n 3-Pane Node Inspector Modal (Input | Parameters | Output)
  const [inspectingNodeId, setInspectingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState("");
  const [editingConfig, setEditingConfig] = useState<
    Record<string, string | number | boolean>
  >({});
  const [newParamKey, setNewParamKey] = useState("");
  const [newParamVal, setNewParamVal] = useState("");

  // n8n Right Slide-Over Node Creator Drawer
  const [showNodeCreator, setShowNodeCreator] = useState(false);
  const [connectFromNodeId, setConnectFromNodeId] = useState<string | null>(
    null
  );
  const [creatorSearch, setCreatorSearch] = useState("");

  // n8n Bottom Chat Panel & Logs Console
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isQueryingKb, setIsQueryingKb] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "agent";
      text: string;
      time: string;
      kbSource?: string;
      kbClinic?: string;
    }>
  >([
    {
      role: "agent",
      text: `Connected to ${workflow.name}. Ask any question about ${
        clinicName || "this clinic"
      } (pricing, services, location, opening hours, insurance, doctors, or open slots) and I will visit the clinic's Knowledge Base and provide feedback!`,
      time: "Just now",
      kbSource: "Clinic Knowledge Base Connected",
      kbClinic: clinicName,
    },
  ]);

  useEffect(() => {
    setChatMessages([
      {
        role: "agent",
        text: `Connected to ${workflow.name}. Ask any question about ${
          clinicName || "this clinic"
        } (pricing, services, location, opening hours, insurance, doctors, or open slots) and I will visit the clinic's Knowledge Base and provide feedback!`,
        time: "Just now",
        kbSource: "Clinic Knowledge Base Connected",
        kbClinic: clinicName,
      },
    ]);
  }, [workflow.id, workflow.name, clinicName]);

  // Identify which nodes are AI Agent sub-nodes (connected via Model, Memory, Tools)
  const subNodeEdgeBySource = new Map<string, WorkflowEdge>();
  workflow.edges.forEach((e) => {
    if (e.label === "Model" || e.label === "Memory" || e.label === "Tools") {
      subNodeEdgeBySource.set(e.source, e);
    }
  });

  const openNodeModal = (node: WhiteLabelNode) => {
    setInspectingNodeId(node.id);
    setEditingNodeName(node.name);
    setEditingConfig({ ...node.configSummary });
  };

  const handleSaveNodeModal = () => {
    if (!inspectingNodeId || !onUpdateWorkflow) {
      setInspectingNodeId(null);
      return;
    }
    const updatedNodes = workflow.nodes.map((n) =>
      n.id === inspectingNodeId
        ? {
            ...n,
            name: editingNodeName.trim() || n.name,
            configSummary: editingConfig,
          }
        : n
    );
    onUpdateWorkflow({ nodes: updatedNodes });
    setInspectingNodeId(null);
  };

  const handleDeleteNode = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onUpdateWorkflow) return;
    const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = workflow.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );
    onUpdateWorkflow({ nodes: updatedNodes, edges: updatedEdges });
    if (inspectingNodeId === nodeId) setInspectingNodeId(null);
  };

  const handleAddNodeFromPalette = (
    template: (typeof NODE_PALETTE_TEMPLATES)[number]
  ) => {
    if (!onUpdateWorkflow) return;
    const newId = `node-${Date.now().toString().slice(-5)}`;
    const sourceNode = connectFromNodeId
      ? workflow.nodes.find((n) => n.id === connectFromNodeId)
      : workflow.nodes[workflow.nodes.length - 1];

    const newPos: [number, number] = template.isSubNode
      ? [
          (sourceNode?.position[0] || 400) +
            (template.isSubNode === "Model"
              ? -90
              : template.isSubNode === "Memory"
              ? 30
              : 150),
          (sourceNode?.position[1] || 130) + 190,
        ]
      : [
          (sourceNode?.position[0] || 100) + 270,
          sourceNode?.position[1] || 150,
        ];

    const newNode: WhiteLabelNode = {
      id: newId,
      name: template.name,
      typeLabel: template.typeLabel,
      category: template.category,
      icon: template.icon,
      position: newPos,
      configSummary: { ...template.defaultConfig },
      status: "idle",
    };

    const nextEdges = [...workflow.edges];
    if (sourceNode) {
      if (template.isSubNode) {
        // Sub-node connects UP into the AI Agent node
        nextEdges.push({
          id: `edge-${Date.now()}`,
          source: newId,
          target: sourceNode.id,
          label: template.isSubNode,
        });
      } else {
        nextEdges.push({
          id: `edge-${Date.now()}`,
          source: sourceNode.id,
          target: newId,
        });
      }
    }

    onUpdateWorkflow({
      nodes: [...workflow.nodes, newNode],
      edges: nextEdges,
    });
    setShowNodeCreator(false);
    setConnectFromNodeId(null);
  };

  const handleTidyUpLayout = () => {
    if (!onUpdateWorkflow) return;
    let mainIdx = 0;
    let subIdx = 0;
    const tidied = workflow.nodes.map((node) => {
      if (subNodeEdgeBySource.has(node.id)) {
        const pos: [number, number] = [360 + subIdx * 165, 310];
        subIdx++;
        return { ...node, position: pos };
      }
      const pos: [number, number] = [80 + mainIdx * 270, 125];
      mainIdx++;
      return { ...node, position: pos };
    });
    onUpdateWorkflow({ nodes: tidied });
    setZoom(0.95);
    setPan({ x: 30, y: 20 });
  };

  // Canvas & Node Mouse Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-node-interactive]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    node: WhiteLabelNode
  ) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    hasMovedRef.current = false;
    dragOffsetRef.current = {
      x: e.clientX / zoom - node.position[0],
      y: e.clientY / zoom - node.position[1],
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNodeId && onUpdateWorkflow) {
      hasMovedRef.current = true;
      const newX = Math.round(e.clientX / zoom - dragOffsetRef.current.x);
      const newY = Math.round(e.clientY / zoom - dragOffsetRef.current.y);
      const updated = workflow.nodes.map((n) =>
        n.id === draggingNodeId
          ? { ...n, position: [newX, newY] as [number, number] }
          : n
      );
      onUpdateWorkflow({ nodes: updated });
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const submitLiveChatPrompt = async (rawMessage: string) => {
    const msg = rawMessage.trim();
    if (!msg || isRunning || isQueryingKb) return;
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: msg,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setIsQueryingKb(true);
    let kbHit: KnowledgeBaseHit | null | void = null;
    try {
      if (onRunWorkflow) {
        kbHit = await onRunWorkflow(msg);
      }
    } finally {
      setIsQueryingKb(false);
    }

    if (kbHit && typeof kbHit === "object" && "agentReply" in kbHit) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: kbHit.agentReply,
          kbSource: kbHit.matchedSection,
          kbClinic: kbHit.clinicName,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: `[${workflow.name}] Visited ${
            clinicName || "clinic"
          } Knowledge Base and processed your message through all ${
            workflow.nodes.length
          } nodes!`,
          kbSource: "Knowledge Base Lookup",
          kbClinic: clinicName,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLiveChatPrompt(chatInput);
  };

  const AI_AGENT_WIDTH = 220;
  const AI_AGENT_HEIGHT = 92;
  const SQUARE_NODE_SIZE = 96;
  const SUB_NODE_SIZE = 74;

  const isNodeAiAgent = (node: WhiteLabelNode) => {
    const isSub = subNodeEdgeBySource.has(node.id);
    if (isSub) return false;
    const tl = node.typeLabel.toLowerCase();
    return (
      tl.includes("agent") ||
      tl.includes("chain") ||
      node.icon === "Bot"
    );
  };

  const getNodeWidth = (node: WhiteLabelNode) =>
    subNodeEdgeBySource.has(node.id)
      ? SUB_NODE_SIZE
      : isNodeAiAgent(node)
      ? AI_AGENT_WIDTH
      : SQUARE_NODE_SIZE;

  const getNodeHeight = (node: WhiteLabelNode) =>
    subNodeEdgeBySource.has(node.id)
      ? SUB_NODE_SIZE
      : isNodeAiAgent(node)
      ? AI_AGENT_HEIGHT
      : SQUARE_NODE_SIZE;

  const maxNodeX = workflow.nodes.reduce(
    (max, n) => Math.max(max, (n.position?.[0] || 0) + 320),
    1800
  );
  const maxNodeY = workflow.nodes.reduce(
    (max, n) => Math.max(max, (n.position?.[1] || 0) + 260),
    950
  );

  const triggerNodes = workflow.nodes.filter((n) => n.category === "trigger");

  const focusOnNode = (targetNode: WhiteLabelNode, targetZoom = 0.85) => {
    setZoom(targetZoom);
    setPan({
      x: Math.round(90 - targetNode.position[0] * targetZoom),
      y: Math.round(180 - targetNode.position[1] * targetZoom),
    });
  };

  const fitAllNodesInView = () => {
    if (workflow.nodes.length === 0) return;
    const xs = workflow.nodes.map((n) => n.position[0]);
    const ys = workflow.nodes.map((n) => n.position[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + 220;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + 180;
    const spanX = Math.max(600, maxX - minX);
    const spanY = Math.max(400, maxY - minY);
    const fitZoom = Math.max(
      0.24,
      Math.min(0.95, Math.min(1120 / spanX, 560 / spanY))
    );
    setZoom(+fitZoom.toFixed(2));
    setPan({
      x: Math.round(45 - minX * fitZoom),
      y: Math.round(55 - minY * fitZoom),
    });
  };

  // Auto-focus on the primary trigger flow whenever the selected workflow changes
  useEffect(() => {
    if (workflow.nodes.length === 0) return;
    const primaryTrigger =
      workflow.nodes.find(
        (n) =>
          n.category === "trigger" &&
          n.name.toLowerCase().includes("whatsapp")
      ) ||
      workflow.nodes.find((n) => n.category === "trigger") ||
      workflow.nodes[0];

    if (workflow.nodes.length <= 20) {
      fitAllNodesInView();
    } else if (primaryTrigger) {
      focusOnNode(primaryTrigger, 0.82);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow.id]);

  const inspectingNode = workflow.nodes.find((n) => n.id === inspectingNodeId);
  const inspectingStepLog = latestStepLogs.find(
    (s) => s.nodeId === inspectingNodeId
  );

  return (
    <div className="relative flex flex-col w-full h-[calc(100vh-122px)] min-h-[580px] bg-[#141720] rounded-2xl border border-slate-800/90 overflow-hidden select-none shadow-2xl">
      {/* ==================== N8N DOT GRID CANVAS SURFACE ==================== */}
      <div
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        className={`relative flex-1 w-full overflow-hidden ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {/* Characteristic n8n Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle, #475569 1.35px, transparent 1.35px)",
            backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Top-Left Trigger Flow & Exact Node Navigator Bar */}
        <div
          data-node-interactive="true"
          className="absolute top-3.5 left-4 z-20 flex flex-wrap items-center gap-1.5 max-w-[82%]"
        >
          {triggerNodes.map((trig) => (
            <button
              key={trig.id}
              type="button"
              onClick={() => focusOnNode(trig, 0.85)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e2230]/95 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700/90 shadow-lg transition cursor-pointer"
              title={`Center canvas on ${trig.name}`}
            >
              <Zap className="w-3 h-3 text-orange-400 fill-current shrink-0" />
              <span className="truncate max-w-[160px]">{trig.name}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={fitAllNodesInView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/95 hover:bg-slate-700 text-[11px] font-semibold text-sky-300 border border-sky-500/30 shadow-lg transition cursor-pointer"
            title="Fit all nodes in workflow onto screen"
          >
            <Maximize2 className="w-3 h-3" />
            Fit All ({workflow.nodes.length} nodes)
          </button>

          <select
            value=""
            onChange={(e) => {
              const target = workflow.nodes.find((n) => n.id === e.target.value);
              if (target) {
                focusOnNode(target, 0.9);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#1e2230]/95 hover:bg-slate-800 text-[11px] font-medium text-slate-200 border border-slate-700/90 shadow-lg focus:outline-none cursor-pointer max-w-[210px]"
          >
            <option value="">Jump to exact node ({workflow.nodes.length})...</option>
            {workflow.nodes.map((n, idx) => (
              <option key={n.id} value={n.id}>
                {idx + 1}. {n.name} ({n.typeLabel})
              </option>
            ))}
          </select>
        </div>

        {/* Top-Right Floating '+' Add Node Button (exact n8n placement) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConnectFromNodeId(null);
              setShowNodeCreator(true);
            }}
            className="w-10 h-10 rounded-xl bg-slate-800/95 hover:bg-slate-700 text-white border border-slate-700 shadow-xl flex items-center justify-center transition cursor-pointer"
            title="Add Node to Canvas (+)"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Pan & Zoom Transformed Layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: `${maxNodeX}px`,
            height: `${maxNodeY}px`,
          }}
          className="relative"
        >
          {/* SVG Connection Edges Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {workflow.edges.map((edge) => {
              const sourceNode = workflow.nodes.find(
                (n) => n.id === edge.source
              );
              const targetNode = workflow.nodes.find(
                (n) => n.id === edge.target
              );
              if (!sourceNode || !targetNode) return null;

              const isSubNodeEdge =
                edge.label === "Model" ||
                edge.label === "Memory" ||
                edge.label === "Tools";

              let startX: number;
              let startY: number;
              let endX: number;
              let endY: number;
              let pathData: string;

              if (isSubNodeEdge) {
                // Sub-node is circular (74x74), connects from its top center up to the bottom diamond port of the AI Agent node
                startX = sourceNode.position[0] + SUB_NODE_SIZE / 2;
                startY = sourceNode.position[1];
                const portOffset =
                  edge.label === "Model"
                    ? 45
                    : edge.label === "Memory"
                    ? 110
                    : 175;
                endX = targetNode.position[0] + portOffset;
                endY = targetNode.position[1] + getNodeHeight(targetNode) + 8;
                const deltaY = Math.max(35, Math.abs(startY - endY) * 0.5);
                pathData = `M ${startX} ${startY} C ${startX} ${
                  startY - deltaY
                }, ${endX} ${endY + deltaY}, ${endX} ${endY}`;
              } else {
                const srcW = getNodeWidth(sourceNode);
                const srcH = getNodeHeight(sourceNode);
                const tgtH = getNodeHeight(targetNode);
                startX = sourceNode.position[0] + srcW;
                startY =
                  edge.label === "true"
                    ? sourceNode.position[1] + srcH * 0.34
                    : edge.label === "false"
                    ? sourceNode.position[1] + srcH * 0.68
                    : sourceNode.position[1] + srcH / 2;
                endX = targetNode.position[0];
                endY = targetNode.position[1] + tgtH / 2;
                const deltaX = Math.max(55, Math.abs(endX - startX) * 0.45);
                pathData = `M ${startX} ${startY} C ${
                  startX + deltaX
                } ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
              }

              const isEdgeDone =
                completedNodeIds.includes(edge.source) &&
                (completedNodeIds.includes(edge.target) ||
                  activeStepNodeId === edge.target);

              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;

              return (
                <g key={edge.id}>
                  {/* Connection Line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={
                      isEdgeDone
                        ? "#10b981"
                        : isSubNodeEdge
                        ? "#64748b"
                        : "#64748b"
                    }
                    strokeWidth={isEdgeDone ? 2.8 : 2}
                    strokeDasharray={isSubNodeEdge ? "5 5" : "none"}
                  />

                  {/* Animated flow pulse when running */}
                  {activeStepNodeId === edge.target && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      strokeDasharray="8 10"
                      className="animate-[dash_1s_linear_infinite]"
                    />
                  )}

                  {/* n8n Item Count Pill on Executed Edges ("1 item") */}
                  {isEdgeDone && !isSubNodeEdge && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-26}
                        y={-10}
                        width={52}
                        height={19}
                        rx={5}
                        fill="#064e3b"
                        stroke="#10b981"
                        strokeWidth={1}
                      />
                      <text
                        textAnchor="middle"
                        y={3}
                        fill="#6ee7b7"
                        fontSize={10}
                        fontWeight={600}
                      >
                        1 item
                      </text>
                    </g>
                  )}

                  {/* Branch Label if not executed yet */}
                  {!isEdgeDone && edge.label && !isSubNodeEdge && (
                    <g transform={`translate(${midX}, ${midY - 10})`}>
                      <rect
                        x={-32}
                        y={-9}
                        width={64}
                        height={18}
                        rx={4}
                        fill="#1e293b"
                        stroke="#475569"
                      />
                      <text
                        textAnchor="middle"
                        y={3}
                        fill="#cbd5e1"
                        fontSize={9}
                        fontWeight={600}
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ==================== N8N NODES LAYER ==================== */}
          {workflow.nodes.map((node) => {
            const IconComponent = ICON_MAP[node.icon] || Cpu;
            const style =
              CATEGORY_COLORS[node.category] || CATEGORY_COLORS.integration;
            const subEdge = subNodeEdgeBySource.get(node.id);
            const isSubNode = Boolean(subEdge);
            const isTrigger = node.category === "trigger";
            const isAiAgent = isNodeAiAgent(node);
            const isIfNode =
              node.typeLabel.toLowerCase() === "if" ||
              node.name.toLowerCase().startsWith("if");
            const nodeWidth = getNodeWidth(node);
            const nodeHeight = getNodeHeight(node);
            const isRunningNow = activeStepNodeId === node.id;
            const isCompleted = completedNodeIds.includes(node.id);

            // 1. RENDER CIRCULAR N8N AI SUB-NODE (Model, Memory, Tools underneath AI Agent)
            if (isSubNode) {
              return (
                <div
                  key={node.id}
                  data-node-interactive="true"
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={() => {
                    if (!hasMovedRef.current) openNodeModal(node);
                  }}
                  style={{
                    left: `${node.position[0]}px`,
                    top: `${node.position[1]}px`,
                    width: `${SUB_NODE_SIZE}px`,
                  }}
                  className="absolute group flex flex-col items-center cursor-pointer"
                >
                  {/* Hover Quick Toolbar */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 shadow-lg z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNodeModal(node);
                      }}
                      className="text-slate-300 hover:text-white p-0.5"
                      title="Configure Sub-Node"
                    >
                      <Settings2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNode(node.id, e)}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                      title="Delete Sub-Node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Top Connection Pin */}
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-[#141720] -mb-1 z-10" />

                  {/* Circular Sub-Node Body */}
                  <div
                    className={`w-[74px] h-[74px] rounded-full bg-[#1e2230] border-2 flex items-center justify-center shadow-xl transition-all relative ${
                      isRunningNow
                        ? "border-sky-400 ring-4 ring-sky-500/30 scale-105"
                        : isCompleted
                        ? "border-emerald-500"
                        : "border-slate-600 group-hover:border-slate-400"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${style.iconBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {isCompleted && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Sub-Node Title Underneath */}
                  <div className="mt-1.5 text-center w-[135px]">
                    <p className="text-[11px] font-semibold text-slate-100 leading-tight break-words">
                      {node.name}
                    </p>
                    <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                      {node.typeLabel}
                    </p>
                  </div>
                </div>
              );
            }

            // 2. RENDER WIDE N8N AI AGENT / LLM CHAIN NODE (220x92 with bottom Model/Memory/Tool ports)
            if (isAiAgent) {
              return (
                <div
                  key={node.id}
                  data-node-interactive="true"
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={() => {
                    if (!hasMovedRef.current) openNodeModal(node);
                  }}
                  style={{
                    left: `${node.position[0]}px`,
                    top: `${node.position[1]}px`,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                  }}
                  className={`absolute group bg-[#1e2230] border-2 rounded-2xl transition-all cursor-pointer shadow-xl flex flex-col justify-center px-3.5 ${
                    isRunningNow
                      ? "border-sky-400 ring-4 ring-sky-500/25 scale-105"
                      : isCompleted
                      ? "border-emerald-500/90"
                      : "border-slate-700 hover:border-slate-400"
                  }`}
                >
                  {/* Floating n8n Hover Action Bar Above Node */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 shadow-xl z-30">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRunWorkflow) onRunWorkflow();
                      }}
                      className="text-emerald-400 hover:text-emerald-300 p-0.5"
                      title="Execute node"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNodeModal(node);
                      }}
                      className="text-slate-300 hover:text-white p-0.5"
                      title="Open node parameters"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNode(node.id, e)}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                      title="Delete node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Left Input Port */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-[#141720]" />

                  {/* Node Content */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${style.iconBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white leading-snug line-clamp-2">
                        {node.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {node.typeLabel}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {isRunningNow && (
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </div>
                  )}

                  {/* Right Output Port */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-[#141720]" />
                  </div>

                  {/* Bottom Diamond Sub-Node Ports on AI Agent Nodes (Chat Model *, Memory, Tool) */}
                  <div className="absolute -bottom-3.5 left-0 right-0 flex items-center justify-around px-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rotate-45 bg-purple-400 border border-[#141720]" />
                      <span className="text-[8px] text-slate-400 mt-0.5 font-medium">
                        Model *
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rotate-45 bg-cyan-400 border border-[#141720]" />
                      <span className="text-[8px] text-slate-400 mt-0.5 font-medium">
                        Memory
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rotate-45 bg-emerald-400 border border-[#141720]" />
                      <span className="text-[8px] text-slate-400 mt-0.5 font-medium">
                        Tool
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // 3. RENDER AUTHENTIC N8N SQUARE NODE (96x96 icon card with exact node name & type underneath)
            return (
              <div
                key={node.id}
                data-node-interactive="true"
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={() => {
                  if (!hasMovedRef.current) openNodeModal(node);
                }}
                style={{
                  left: `${node.position[0]}px`,
                  top: `${node.position[1]}px`,
                  width: `${nodeWidth}px`,
                }}
                className="absolute group flex flex-col items-center cursor-pointer"
              >
                {/* Floating n8n Hover Action Bar Above Node */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 shadow-xl z-30">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRunWorkflow) onRunWorkflow();
                    }}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5"
                    title="Execute node"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openNodeModal(node);
                    }}
                    className="text-slate-300 hover:text-white p-0.5"
                    title="Open node parameters"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNode(node.id, e)}
                    className="text-rose-400 hover:text-rose-300 p-0.5"
                    title="Delete node"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 96x96 Square Card (or Trigger Pill) */}
                <div
                  style={{
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                  }}
                  className={`relative bg-[#1e2230] border-2 transition-all shadow-xl flex items-center justify-center ${
                    isTrigger
                      ? "rounded-l-[34px] rounded-r-2xl"
                      : "rounded-2xl"
                  } ${
                    isRunningNow
                      ? "border-sky-400 ring-4 ring-sky-500/25 scale-105"
                      : isCompleted
                      ? "border-emerald-500/90"
                      : "border-slate-700 group-hover:border-slate-400"
                  }`}
                >
                  {/* Left Input Port (for non-trigger nodes) */}
                  {!isTrigger && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-[#141720]" />
                  )}

                  {/* Trigger Lightning Icon Indicator */}
                  {isTrigger && (
                    <div
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow"
                      title="Workflow Trigger"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                    </div>
                  )}

                  {/* Centered Node Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${style.iconBg}`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Green Checkmark Badge on Completed Execution (n8n style) */}
                  {isCompleted && (
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Spinning Indicator when Executing */}
                  {isRunningNow && (
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    </div>
                  )}

                  {/* Right Output Port(s) */}
                  {isIfNode ? (
                    <>
                      <div
                        className="absolute -right-2 top-[34%] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#141720]"
                        title="true"
                      />
                      <div
                        className="absolute -right-2 top-[68%] -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-rose-400 border-2 border-[#141720]"
                        title="false"
                      />
                    </>
                  ) : (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-[#141720]" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectFromNodeId(node.id);
                          setShowNodeCreator(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 w-5 h-5 rounded-md bg-slate-700 hover:bg-sky-500 text-white flex items-center justify-center text-xs shadow"
                        title="Add connected node"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Exact n8n Node Name & Subtitle Underneath the Square Card */}
                <div className="mt-2 text-center w-[166px] -mx-[35px]">
                  <p className="text-[11.5px] font-bold text-slate-100 leading-tight break-words">
                    {node.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {node.typeLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== N8N BOTTOM-LEFT CANVAS CONTROLS ==================== */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-[#1e2230]/95 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-xl">
          <button
            type="button"
            onClick={fitAllNodesInView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Zoom to Fit All Nodes"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={handleTidyUpLayout}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Auto-align nodes (Tidy up)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Tidy up
          </button>
          <button
            type="button"
            onClick={() => setShowLogsDrawer((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
              showLogsDrawer
                ? "bg-sky-500/20 text-sky-300"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Logs ({latestStepLogs.length})
          </button>
        </div>

        {/* ==================== N8N BOTTOM-CENTER 'TEST WORKFLOW' & 'CHAT' BAR ==================== */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => onRunWorkflow && onRunWorkflow()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#ff6d5a] hover:bg-[#ff8271] text-white shadow-xl shadow-[#ff6d5a]/25 transition cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Workflow...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Test workflow
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowChatDrawer((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border shadow-xl transition cursor-pointer ${
              showChatDrawer
                ? "bg-sky-600 text-white border-sky-500"
                : "bg-[#1e2230] hover:bg-slate-800 text-white border-slate-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>

      {/* ==================== N8N BOTTOM LOGS / EXECUTION CONSOLE DRAWER ==================== */}
      {showLogsDrawer && (
        <div className="h-52 border-t border-slate-800 bg-[#181b26] p-4 overflow-y-auto z-20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Execution Step Output Console
            </span>
            <button
              type="button"
              onClick={() => setShowLogsDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {latestStepLogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {latestStepLogs.map((step, idx) => (
                <div
                  key={`${step.nodeId}-${idx}`}
                  onClick={() => {
                    const found = workflow.nodes.find(
                      (n) => n.id === step.nodeId
                    );
                    if (found) openNodeModal(found);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white">
                      {idx + 1}. {step.nodeName}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      ✓ {step.durationMs}ms
                    </span>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono truncate">
                    {JSON.stringify(step.outputPreview)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Click &ldquo;Test workflow&rdquo; to execute the pipeline and inspect step
              outputs here.
            </p>
          )}
        </div>
      )}

      {/* ==================== N8N INTERACTIVE AGENT CHAT DRAWER ==================== */}
      {showChatDrawer && (
        <div className="absolute bottom-16 right-4 z-30 w-[430px] max-w-[calc(100vw-2rem)] h-[510px] rounded-2xl border border-slate-700 bg-[#181b26] shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    Live Chat • {clinicName || "Clinic"} KB
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                  <BookOpen className="w-3 h-3 shrink-0" />
                  n8n Instance KB • {clinicName || "Clinic"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {onSyncKbFromN8n && (
                <button
                  type="button"
                  onClick={async () => {
                    await onSyncKbFromN8n();
                    setChatMessages((prev) => [
                      ...prev,
                      {
                        role: "agent",
                        text: `Synced latest Knowledge Base directly from ${
                          clinicName || "this clinic"
                        }'s n8n workflow nodes (AI Agent & Calendar/KB Tool)!`,
                        kbSource: "n8n Instance KB Sync",
                        kbClinic: clinicName,
                        time: new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      },
                    ]);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-sky-300 border border-slate-700 transition cursor-pointer"
                  title="Pull latest Knowledge Base from n8n workflow nodes"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync KB
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowChatDrawer(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Knowledge Base Prompt Chips */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              "How much is teeth whitening?",
              "Where are you located & opening hours?",
              "What insurance do you accept?",
              "Who are your dentists?",
              "Available slots tomorrow?",
            ].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isRunning || isQueryingKb}
                onClick={() => submitLiveChatPrompt(prompt)}
                className="shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-800 hover:border-sky-500/40 transition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {m.role === "agent" && m.kbSource && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span>
                      Visited {m.kbClinic ? `${m.kbClinic} KB` : "KB"}:{" "}
                      {m.kbSource}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-sky-600 text-white rounded-br-xs"
                      : "bg-slate-800/95 text-slate-100 border border-slate-700 rounded-bl-xs"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}

            {isQueryingKb && (
              <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>
                  Searching {clinicName || "Clinic"} Knowledge Base & executing
                  nodes...
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSendChatMessage}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask ${
                clinicName || "clinic"
              } KB (prices, hours, location, slots)...`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={isRunning || isQueryingKb}
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ==================== N8N SLIDE-OVER RIGHT NODE CREATOR DRAWER ==================== */}
      {showNodeCreator && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-[#181b26] border-l border-slate-800 z-30 shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                What happens next?
              </h3>
              <p className="text-[11px] text-slate-400">
                Select a node to add to this clinic workflow
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNodeCreator(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search nodes (WhatsApp, AI, CRM...)"
                value={creatorSearch}
                onChange={(e) => setCreatorSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {NODE_PALETTE_TEMPLATES.filter(
              (t) =>
                t.name.toLowerCase().includes(creatorSearch.toLowerCase()) ||
                t.description
                  .toLowerCase()
                  .includes(creatorSearch.toLowerCase())
            ).map((tpl, idx) => {
              const IconComp = ICON_MAP[tpl.icon] || Cpu;
              const style =
                CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.integration;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddNodeFromPalette(tpl)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition flex items-start gap-3 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.iconBg}`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{tpl.name}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {tpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== N8N 3-PANE NODE EDITOR MODAL (INPUT | PARAMETERS | OUTPUT) ==================== */}
      {inspectingNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-6xl h-[82vh] rounded-2xl border border-slate-700 bg-[#181b26] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Top Header Bar */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    (
                      CATEGORY_COLORS[inspectingNode.category] ||
                      CATEGORY_COLORS.integration
                    ).iconBg
                  }`}
                >
                  {React.createElement(ICON_MAP[inspectingNode.icon] || Cpu, {
                    className: "w-4 h-4",
                  })}
                </div>
                <div>
                  <input
                    type="text"
                    value={editingNodeName}
                    onChange={(e) => setEditingNodeName(e.target.value)}
                    className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    {inspectingNode.typeLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onRunWorkflow && onRunWorkflow()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#ff6d5a] hover:bg-[#ff8271] text-white cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute step
                </button>
                <button
                  type="button"
                  onClick={handleSaveNodeModal}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white cursor-pointer"
                >
                  Save & Close
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingNodeId(null)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 3-Column Body: INPUT | PARAMETERS | OUTPUT */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
              {/* LEFT PANE: INPUT DATA */}
              <div className="lg:col-span-3 p-4 flex flex-col bg-slate-950/50 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    INPUT
                  </span>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    1 item
                  </span>
                </div>
                <pre className="flex-1 text-[11px] font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto">
                  {JSON.stringify(
                    {
                      clinic: workflow.clinicId,
                      workflow: workflow.name,
                      incomingTrigger: "Verified Event",
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* CENTER PANE: NODE PARAMETERS & SETTINGS */}
              <div className="lg:col-span-5 p-5 flex flex-col overflow-y-auto space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-2 text-xs font-bold">
                  <span className="text-sky-400 border-b-2 border-sky-400 pb-2 -mb-2.5">
                    Parameters
                  </span>
                  <span className="text-slate-400">Settings</span>
                </div>

                <div className="space-y-3">
                  {Object.entries(editingConfig).map(([key, val]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-slate-300 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </label>
                      <input
                        type="text"
                        value={String(val)}
                        onChange={(e) =>
                          setEditingConfig((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Add New Parameter Row */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <p className="text-xs font-semibold text-slate-400">
                    + Add Node Parameter
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Parameter name"
                      value={newParamKey}
                      onChange={(e) => setNewParamKey(e.target.value)}
                      className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value or expression"
                      value={newParamVal}
                      onChange={(e) => setNewParamVal(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newParamKey.trim()) return;
                        setEditingConfig((prev) => ({
                          ...prev,
                          [newParamKey.trim()]: newParamVal,
                        }));
                        setNewParamKey("");
                        setNewParamVal("");
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT PANE: OUTPUT DATA */}
              <div className="lg:col-span-4 p-4 flex flex-col bg-slate-950/50 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    OUTPUT
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {inspectingStepLog
                      ? `1 item • ${inspectingStepLog.durationMs}ms`
                      : "Ready"}
                  </span>
                </div>
                <pre className="flex-1 text-[11px] font-mono text-emerald-300 bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-x-auto">
                  {JSON.stringify(
                    inspectingStepLog?.outputPreview || {
                      status: "Node ready",
                      nodeName: inspectingNode.name,
                      parameters: editingConfig,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
