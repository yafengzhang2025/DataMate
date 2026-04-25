/**
 * API 客户端 — 统一封装后端请求
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || json.code !== 0) {
    throw new Error(json.message || `请求失败: ${res.status}`);
  }
  return json.data as T;
}

// ── 算子 ──────────────────────────────────────────────────────────────────

export interface OperatorListResult {
  total: number;
  items: OperatorItem[];
}

export const operatorApi = {
  list: async (params?: { category?: string; installed?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.installed !== undefined) q.set("installed", String(params.installed));
    if (params?.search) q.set("keyword", params.search);
    q.set("size", "100");

    // 第一页
    const first = await request<OperatorListResult>(`/operators?${q}&page=1`);
    let items = first.items;
    const total = first.total;

    // 如有更多页，并发拉取剩余页
    if (total > 100) {
      const pages = Math.ceil(total / 100);
      const rest = await Promise.all(
        Array.from({ length: pages - 1 }, (_, i) =>
          request<OperatorListResult>(`/operators?${q}&page=${i + 2}`)
        )
      );
      rest.forEach((r) => { items = items.concat(r.items); });
    }
    return { total, items };
  },
  categories: () => request<OperatorCategoryItem[]>("/operators/categories"),
  get: (id: string) => request<OperatorItem>(`/operators/${id}`),
  install: (id: string) => request<OperatorItem>(`/operators/${id}/install`, { method: "POST" }),
  uninstall: (id: string) => request<OperatorItem>(`/operators/${id}/uninstall`, { method: "POST" }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<OperatorItem>("/operators/upload", {
      method: "POST",
      headers: {},
      body: fd,
    });
  },
};

// ── 工作流 ────────────────────────────────────────────────────────────────

export const workflowApi = {
  list: () => request<{ total: number; items: WorkflowItem[] }>("/workflows?size=100"),
  get: (id: string) => request<WorkflowItem>(`/workflows/${id}`),
  create: (data: WorkflowCreate) =>
    request<WorkflowItem>("/workflows", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<WorkflowCreate>) =>
    request<WorkflowItem>(`/workflows/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ id: string }>(`/workflows/${id}`, { method: "DELETE" }),
  run: (id: string) => request<WorkflowExecution>(`/workflows/${id}/run`, { method: "POST" }),
  executions: (id: string) => request<{ total: number; items: WorkflowExecution[] }>(`/workflows/${id}/executions?size=100`),
  executionDetail: (execId: string) => request<WorkflowExecution>(`/workflows/executions/${execId}`),
};

// ── 数据集 ────────────────────────────────────────────────────────────────

export const datasetApi = {
  list: () => request<{ total: number; items: DatasetItem[] }>("/datasets?size=100"),
  get: (id: string) => request<DatasetItem>(`/datasets/${id}`),
  upload: (file: File, name: string, description?: string, modal?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    if (description) fd.append("description", description);
    if (modal) fd.append("modal", modal);
    return request<DatasetItem>("/datasets/upload", { method: "POST", headers: {}, body: fd });
  },
  preview: (id: string, page = 1, pageSize = 20) =>
    request<DatasetPreview>(`/datasets/${id}/preview?page=${page}&page_size=${pageSize}`),
  delete: (id: string) => request<{ id: string }>(`/datasets/${id}`, { method: "DELETE" }),
  exportUrl: (id: string, format = "jsonl") =>
    `${BASE_URL}/datasets/${id}/export?format=${format}`,
};

// ── 知识库 ────────────────────────────────────────────────────────────────

export const knowledgeApi = {
  list: () => request<KnowledgeBaseItem[]>("/knowledge"),
  get: (id: string) => request<KnowledgeBaseItem>(`/knowledge/${id}`),
  create: (data: KnowledgeBaseCreate) =>
    request<KnowledgeBaseItem>("/knowledge", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ id: string }>(`/knowledge/${id}`, { method: "DELETE" }),
  documents: (id: string) => request<KbDocument[]>(`/knowledge/${id}/documents`),
  uploadDoc: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<KbDocument>(`/knowledge/${id}/documents/upload`, {
      method: "POST",
      headers: {},
      body: fd,
    });
  },
  deleteDoc: (kbId: string, docId: string) =>
    request<{ id: string }>(`/knowledge/${kbId}/documents/${docId}`, { method: "DELETE" }),
  reindex: (id: string) => request<{ message: string }>(`/knowledge/${id}/reindex`, { method: "POST" }),
  search: (id: string, query: string, top_k = 5, threshold = 0.7) =>
    request<SearchResult[]>(`/knowledge/${id}/search`, {
      method: "POST",
      body: JSON.stringify({ query, top_k, threshold }),
    }),
};

// ── 类型定义 ─────────────────────────────────────────────────────────────

export interface OperatorItem {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  input_modal: string;
  output_modal: string;
  input_count: number;
  output_count: number;
  tags: string[];
  runtime: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  installed: boolean;
  is_star: boolean;
  usage_count: number;
  created_at: string;
}

export interface OperatorCategoryItem {
  id: string;
  name: string;
  name_en: string;
  value: string;
  parent_id: string;
  count?: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  operatorId: string;
  position: { x: number; y: number };
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  node_executions: NodeExecution[];
  created_at: string;
}

export interface NodeExecution {
  id: string;
  node_id: string;
  operator_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  logs: string[];
  metrics: Record<string, unknown>;
  error: string | null;
}

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  modal: string;
  format: string;
  record_count: number;
  size_bytes: number;
  columns: string[];
  created_at: string;
  updated_at: string;
}

export interface DatasetPreview {
  total: number;
  page: number;
  page_size: number;
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  embed_model: string;
  vector_store: string;
  chunk_strategy: string;
  chunk_size: number;
  chunk_overlap: number;
  document_count: number;
  chunk_count: number;
  created_at: string;
}

export interface KnowledgeBaseCreate {
  name: string;
  description?: string;
  embed_model?: string;
  vector_store?: string;
  chunk_strategy?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface KbDocument {
  id: string;
  kb_id: string;
  name: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
}

export interface SearchResult {
  chunk_id: string;
  document_name: string;
  content: string;
  score: number;
}
