import {
  MindMapContextChatInput,
  MindMapContextChatOutput,
} from "@/ai/flows/mindmap-context-chat";
export interface HierarchicalMapNode {
  id: string;
  label: string;
  children?: HierarchicalMapNode[];
  parentId?: string;
}

export interface MapNode {
  nodeId: string;
  label: string;
  type: "definition" | "warning" | "formula" | "concept";
  shape: "hexagon" | "circle" | "square" | "rounded";
  color: string;
  importanceScore: number;
  confidence: number;
  tl_dr: string;
  detailed: string;
  analogy: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  sourceRefs: {
    type: string;
    page?: number;
    location?: string;
  }[];
}

export interface MapEdge {
  from: string;
  to: string;
  relation: "cause" | "supports" | "contradicts" | "example";
  weight: number;
}

export interface GenerateMindMapOutput {
  mapId: string;
  title: string;
  createdAt: string;
  nodes: {
    id: string;
    label: string;
    parentId?: string;
  }[];
  exportMeta: {
    exportedBy: string;
    mode: "oneday" | "full";
    oneDayModeApplied?: boolean;
  };
  isSaved?: boolean;
  userId?: string;
  nodeCount?: number;
}

export interface MindMapData extends GenerateMindMapOutput {
  root: HierarchicalMapNode;
}

export interface Note {
  id: string;
  nodeId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
export interface SummarizeSelectedNodeOutput {
  nodeId: string;
  tl_dr: string;
  detailed: string;
  analogy: string;
  // imageUrl: string | null; <--- REMOVED
}
export type { MindMapContextChatInput, MindMapContextChatOutput };
