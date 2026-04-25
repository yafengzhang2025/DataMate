/**
 * API 数据 → 前端组件类型适配器
 */
import type { OperatorItem, OperatorCategoryItem, WorkflowItem, DatasetItem, KnowledgeBaseItem } from "@/lib/api";
import type { Operator, OperatorCategory } from "@/lib/operators";

// 根据 category 推断图标
const categoryIconMap: Record<string, { icon: string; color: string }> = {
  cleaning:       { icon: "Brush",        color: "text-cyber-glow" },
  filtering:      { icon: "ScanSearch",   color: "text-cyber-neon" },
  annotation:     { icon: "Tags",         color: "text-cyber-orange" },
  formatting:     { icon: "FileText",     color: "text-cyber-purple" },
  mapping:        { icon: "Merge",        color: "text-cyber-pink" },
  deduplication:  { icon: "Combine",      color: "text-cyber-glow" },
  slicing:        { icon: "Layers",       color: "text-cyber-neon" },
};

const modalIconMap: Record<string, { icon: string; color: string }> = {
  text:       { icon: "FileText",  color: "text-cyber-glow" },
  image:      { icon: "Image",     color: "text-cyber-orange" },
  audio:      { icon: "Headphones",color: "text-cyber-neon" },
  video:      { icon: "Video",     color: "text-cyber-pink" },
  multimodal: { icon: "LayoutGrid",color: "text-cyber-purple" },
  json:       { icon: "FileText",  color: "text-cyber-glow" },
};

export function adaptOperator(item: OperatorItem): Operator {
  const catMeta = categoryIconMap[item.category] ||
    modalIconMap[item.input_modal] ||
    { icon: "Puzzle", color: "text-muted-foreground" };

  return {
    id: item.id,
    name: item.name,
    version: `v${item.version}`,
    description: item.description || "",
    category: item.category as OperatorCategory,
    tags: (item.tags || []) as Operator["tags"],
    inputs: item.input_count,
    outputs: item.output_count,
    installed: !!item.installed,
    icon: catMeta.icon,
    iconColor: catMeta.color,
  };
}

// 后端返回的分类（功能 children）→ 侧边栏分类
const funcCategoryIconMap: Record<string, string> = {
  cleaning:      "Brush",
  filtering:     "ScanSearch",
  annotation:    "Tags",
  formatting:    "FileText",
  mapping:       "Merge",
  deduplication: "Combine",
  slicing:       "Layers",
};

export interface SidebarCategory {
  id: string;       // value, e.g. "cleaning"
  label: string;    // 中文名
  icon: string;
  count: number;
}

export function adaptCategories(
  apiCats: OperatorCategoryItem[],
  operators: Operator[]
): SidebarCategory[] {
  // 取 功能 子分类（parent 不是 '0'，有 value，value 匹配算子 category）
  const funcValues = new Set<string>(operators.map((op) => op.category));
  return apiCats
    .filter((c) => c.parent_id !== "0" && funcValues.has(c.value))
    .map((c) => ({
      id: c.value,
      label: c.name,
      icon: funcCategoryIconMap[c.value] || "Layers",
      count: operators.filter((op) => op.category === c.value).length,
    }));
}

// 工作流适配 — 保留 SavedWorkflow 兼容结构
export function adaptWorkflow(item: WorkflowItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    status: (item.status || "draft") as "draft" | "running" | "completed" | "error",
    nodeCount: (item.nodes || []).length,
  };
}

// 数据集适配
export function adaptDataset(item: DatasetItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    type: (item.modal || "text") as "text" | "image" | "audio" | "video" | "multimodal",
    status: "ready" as "ready" | "processing" | "error",
    fileCount: item.record_count || 0,
    totalSize: formatBytes(item.size_bytes || 0),
    createdAt: item.created_at?.slice(0, 10) || "",
    updatedAt: item.updated_at?.slice(0, 10) || "",
    creator: "system",
    tags: [],
    usedByWorkflows: [],
    linkedKnowledgeBases: [],
    files: [],
    columns: item.columns || [],
  };
}

// 知识库适配
export function adaptKnowledgeBase(item: KnowledgeBaseItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    type: "embedding" as "graph" | "embedding",
    status: "active" as "active" | "building" | "error" | "archived",
    documentCount: item.document_count,
    entityCount: 0,
    relationCount: 0,
    totalSize: `${item.chunk_count} chunks`,
    embeddingModel: item.embed_model,
    createdAt: item.created_at?.slice(0, 10) || "",
    updatedAt: item.created_at?.slice(0, 10) || "",
    chunkCount: item.chunk_count,
    chunkSize: item.chunk_size,
    chunkOverlap: item.chunk_overlap,
    vectorStore: item.vector_store,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
