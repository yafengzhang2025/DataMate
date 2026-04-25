import type { Operator } from "./operators";
import { operators } from "./operators";

export type WorkflowCategory =
  | "text-processing"
  | "image-processing"
  | "video-processing"
  | "data-synthesis"
  | "knowledge-generation"
  | "multimodal";

export type NodeStatus = "idle" | "running" | "success" | "error" | "skipped";

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "toggle";
  defaultValue: string | number | boolean;
  options?: string[]; // for select type
  placeholder?: string;
  description?: string;
}

export interface WorkflowNode {
  id: string;
  operatorId: string;
  position: { x: number; y: number };
  config?: Record<string, string | number | boolean>;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  categoryLabel: string;
  operatorCount: number;
  icon: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface SavedWorkflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "running" | "completed" | "error";
  nodeCount: number;
  templateId?: string;
}

// Per-operator config fields definition
export const operatorConfigFields: Record<string, ConfigField[]> = {
  "text-input": [
    { key: "source", label: "数据来源", type: "select", defaultValue: "upload", options: ["upload", "api", "database"], description: "选择文本数据的来源方式" },
    { key: "encoding", label: "编码格式", type: "select", defaultValue: "utf-8", options: ["utf-8", "gbk", "ascii", "utf-16"] },
    { key: "maxLength", label: "最大字符数", type: "number", defaultValue: 10000, placeholder: "输入最大字符限制" },
    { key: "delimiter", label: "分隔符", type: "text", defaultValue: "\\n", placeholder: "文本分割字符" },
  ],
  "image-input": [
    { key: "source", label: "数据来源", type: "select", defaultValue: "upload", options: ["upload", "url", "database"] },
    { key: "format", label: "图像格式", type: "select", defaultValue: "auto", options: ["auto", "png", "jpg", "webp"] },
    { key: "maxResolution", label: "最大分辨率", type: "text", defaultValue: "1920x1080", placeholder: "宽x高" },
    { key: "batchSize", label: "批处理大小", type: "number", defaultValue: 32 },
  ],
  "audio-input": [
    { key: "source", label: "数据来源", type: "select", defaultValue: "upload", options: ["upload", "url", "stream"] },
    { key: "sampleRate", label: "采样率 (Hz)", type: "select", defaultValue: "16000", options: ["8000", "16000", "22050", "44100", "48000"] },
    { key: "format", label: "音频格式", type: "select", defaultValue: "auto", options: ["auto", "wav", "mp3", "flac", "ogg"] },
  ],
  "video-input": [
    { key: "source", label: "数据来源", type: "select", defaultValue: "upload", options: ["upload", "url", "stream"] },
    { key: "maxDuration", label: "最大时长 (秒)", type: "number", defaultValue: 300, placeholder: "视频最大时长" },
    { key: "resolution", label: "分辨率", type: "select", defaultValue: "auto", options: ["auto", "480p", "720p", "1080p"] },
  ],
  "multimodal-input": [
    { key: "textSource", label: "文本来源", type: "select", defaultValue: "upload", options: ["upload", "api"] },
    { key: "imageSource", label: "图像来源", type: "select", defaultValue: "upload", options: ["upload", "url"] },
    { key: "alignment", label: "对齐策略", type: "select", defaultValue: "index", options: ["index", "timestamp", "filename"] },
  ],
  "data-output": [
    { key: "format", label: "输出格式", type: "select", defaultValue: "json", options: ["json", "csv", "parquet", "jsonl"] },
    { key: "destination", label: "输出目标", type: "select", defaultValue: "file", options: ["file", "database", "api", "s3"] },
    { key: "compression", label: "压缩方式", type: "select", defaultValue: "none", options: ["none", "gzip", "lz4", "snappy"] },
    { key: "overwrite", label: "覆盖已有文件", type: "toggle", defaultValue: false },
  ],
  "text-annotation": [
    { key: "model", label: "模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "qwen-2.5-72b"] },
    { key: "task", label: "标注任务", type: "select", defaultValue: "classify", options: ["classify", "ner", "sentiment", "extract", "custom"] },
    { key: "labels", label: "标签列表", type: "textarea", defaultValue: "", placeholder: "每行一个标签" },
    { key: "prompt", label: "自定义提示词", type: "textarea", defaultValue: "", placeholder: "输入标注指令..." },
    { key: "temperature", label: "Temperature", type: "number", defaultValue: 0.1 },
  ],
  "image-annotation": [
    { key: "model", label: "视觉模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "qwen-vl-max"] },
    { key: "task", label: "标注任务", type: "select", defaultValue: "describe", options: ["describe", "detect", "segment", "ocr", "custom"] },
    { key: "prompt", label: "自定义提示词", type: "textarea", defaultValue: "", placeholder: "输入标注指令..." },
  ],
  "text-feature-extraction": [
    { key: "model", label: "嵌入模型", type: "select", defaultValue: "text-embedding-3-small", options: ["text-embedding-3-small", "text-embedding-3-large", "bge-large-zh", "m3e-base"] },
    { key: "features", label: "提取特征", type: "select", defaultValue: "embedding", options: ["embedding", "keywords", "entities", "topics", "all"] },
    { key: "dimension", label: "向量维度", type: "number", defaultValue: 1536 },
  ],
  "image-feature-extraction": [
    { key: "model", label: "视觉模型", type: "select", defaultValue: "clip-vit-large", options: ["clip-vit-large", "dinov2", "resnet-50", "vit-base"] },
    { key: "features", label: "提取特征", type: "select", defaultValue: "embedding", options: ["embedding", "color", "shape", "texture", "all"] },
    { key: "pooling", label: "池化策略", type: "select", defaultValue: "mean", options: ["mean", "cls", "max"] },
  ],
  "audio-transcription": [
    { key: "model", label: "转写模型", type: "select", defaultValue: "whisper-large-v3", options: ["whisper-large-v3", "whisper-medium", "whisper-small", "paraformer"] },
    { key: "language", label: "语言", type: "select", defaultValue: "auto", options: ["auto", "zh", "en", "ja", "ko", "fr", "de"] },
    { key: "timestamps", label: "时间戳", type: "toggle", defaultValue: true, description: "输出包含时间戳" },
  ],
  "video-frame-extraction": [
    { key: "mode", label: "提取模式", type: "select", defaultValue: "interval", options: ["interval", "keyframe", "scene-change", "uniform"] },
    { key: "fps", label: "帧率 (fps)", type: "number", defaultValue: 1, placeholder: "每秒提取帧数" },
    { key: "outputFormat", label: "帧格式", type: "select", defaultValue: "jpg", options: ["jpg", "png", "webp"] },
    { key: "maxFrames", label: "最大帧数", type: "number", defaultValue: 100 },
  ],
  "image-text-fusion": [
    { key: "model", label: "融合模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "gemini-pro-vision", "qwen-vl-max"] },
    { key: "strategy", label: "融合策略", type: "select", defaultValue: "concat", options: ["concat", "cross-attention", "late-fusion", "early-fusion"] },
    { key: "prompt", label: "融合提示词", type: "textarea", defaultValue: "", placeholder: "描述融合分析任务..." },
  ],
  "text-quality-evaluation": [
    { key: "model", label: "评估模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet"] },
    { key: "metrics", label: "评估维度", type: "select", defaultValue: "all", options: ["all", "fluency", "coherence", "relevance", "accuracy"] },
    { key: "threshold", label: "质量阈值", type: "number", defaultValue: 0.7, placeholder: "0-1之间" },
    { key: "detailedReport", label: "详细报告", type: "toggle", defaultValue: true },
  ],
  "text-aggregation": [
    { key: "strategy", label: "聚合策略", type: "select", defaultValue: "concat", options: ["concat", "merge", "deduplicate", "summarize"] },
    { key: "separator", label: "分隔符", type: "text", defaultValue: "\\n\\n", placeholder: "文本连接符" },
    { key: "maxTokens", label: "最大Token数", type: "number", defaultValue: 4096 },
  ],
  "av-sync": [
    { key: "syncMode", label: "同步模式", type: "select", defaultValue: "timestamp", options: ["timestamp", "index", "duration-split"] },
    { key: "tolerance", label: "容差 (ms)", type: "number", defaultValue: 500, placeholder: "时间对齐容差" },
  ],
  "text-synthesis": [
    { key: "model", label: "生成模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "qwen-2.5-72b"] },
    { key: "template", label: "生成模版", type: "textarea", defaultValue: "", placeholder: "输入文本生成模版..." },
    { key: "count", label: "生成数量", type: "number", defaultValue: 10 },
    { key: "temperature", label: "Temperature", type: "number", defaultValue: 0.7 },
    { key: "diversity", label: "多样性策略", type: "select", defaultValue: "none", options: ["none", "top-p", "penalty", "seed-variation"] },
  ],
  "tts-synthesis": [
    { key: "engine", label: "TTS 引擎", type: "select", defaultValue: "azure", options: ["azure", "openai", "edge-tts", "bark", "fish-speech"] },
    { key: "voice", label: "音色", type: "select", defaultValue: "default", options: ["default", "male-1", "female-1", "child", "elder"] },
    { key: "speed", label: "语速", type: "number", defaultValue: 1.0, placeholder: "0.5-2.0" },
    { key: "format", label: "输出格式", type: "select", defaultValue: "mp3", options: ["mp3", "wav", "ogg"] },
  ],
  "content-generation": [
    { key: "model", label: "模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet"] },
    { key: "contentType", label: "内容类型", type: "select", defaultValue: "article", options: ["article", "summary", "description", "caption", "qa-pair"] },
    { key: "prompt", label: "生成提示词", type: "textarea", defaultValue: "", placeholder: "描述要生成的内容..." },
    { key: "maxTokens", label: "最大Token", type: "number", defaultValue: 2048 },
  ],
  "knowledge-generation": [
    { key: "model", label: "模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet"] },
    { key: "outputType", label: "知识类型", type: "select", defaultValue: "qa-pairs", options: ["qa-pairs", "summary", "insights", "facts", "all"] },
    { key: "count", label: "生成数量", type: "number", defaultValue: 5 },
    { key: "language", label: "输出语言", type: "select", defaultValue: "zh", options: ["zh", "en", "auto"] },
  ],
  "image-description": [
    { key: "model", label: "视觉模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gpt-4o-mini", "gemini-pro-vision"] },
    { key: "detail", label: "描述详细度", type: "select", defaultValue: "standard", options: ["brief", "standard", "detailed"] },
    { key: "language", label: "输出语言", type: "select", defaultValue: "zh", options: ["zh", "en", "auto"] },
  ],
  "video-summary": [
    { key: "model", label: "模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "gemini-pro-vision"] },
    { key: "summaryType", label: "摘要类型", type: "select", defaultValue: "comprehensive", options: ["comprehensive", "brief", "timeline", "chapters"] },
    { key: "maxLength", label: "最大字数", type: "number", defaultValue: 500 },
  ],
  "document-understanding": [
    { key: "model", label: "文档模型", type: "select", defaultValue: "gpt-4o", options: ["gpt-4o", "claude-3.5-sonnet", "qwen-vl-max"] },
    { key: "task", label: "理解任务", type: "select", defaultValue: "extract", options: ["extract", "summarize", "qa", "table-parse", "layout-analysis"] },
    { key: "ocrEngine", label: "OCR 引擎", type: "select", defaultValue: "auto", options: ["auto", "tesseract", "paddleocr", "azure-ocr"] },
  ],
  "image-generation": [
    { key: "model", label: "生成模型", type: "select", defaultValue: "dall-e-3", options: ["dall-e-3", "stable-diffusion-xl", "midjourney", "flux"] },
    { key: "size", label: "图像尺寸", type: "select", defaultValue: "1024x1024", options: ["512x512", "1024x1024", "1792x1024", "1024x1792"] },
    { key: "quality", label: "生成质量", type: "select", defaultValue: "standard", options: ["standard", "hd"] },
    { key: "style", label: "风格", type: "select", defaultValue: "natural", options: ["natural", "vivid"] },
  ],
};

// Demo saved workflows
export const demoSavedWorkflows: SavedWorkflow[] = [
  {
    id: "sw-1",
    name: "电商评论情感分析",
    description: "对电商平台用户评论进行情感分类和关键词提取",
    createdAt: "2026-02-28T10:00:00Z",
    updatedAt: "2026-03-01T14:30:00Z",
    status: "completed",
    nodeCount: 5,
    templateId: "text-analysis-pipeline",
  },
  {
    id: "sw-2",
    name: "产品图片自动标注",
    description: "批量为产品图片生成描述和分类标签",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-03-01T16:00:00Z",
    status: "running",
    nodeCount: 4,
    templateId: "image-captioning",
  },
  {
    id: "sw-3",
    name: "培训视频内容提取",
    description: "从培训视频中提取关键帧和文字摘要",
    createdAt: "2026-02-25T08:00:00Z",
    updatedAt: "2026-02-27T11:00:00Z",
    status: "draft",
    nodeCount: 4,
  },
];

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "text-analysis-pipeline",
    name: "文本分析流水线",
    description: "通过标注、特征提取和质量评估对文本进行深入分析",
    category: "text-processing",
    categoryLabel: "Text Processing",
    operatorCount: 5,
    icon: "FileText",
    nodes: [
      { id: "n1", operatorId: "text-input", position: { x: 50, y: 200 } },
      { id: "n2", operatorId: "text-annotation", position: { x: 300, y: 100 } },
      { id: "n3", operatorId: "text-feature-extraction", position: { x: 300, y: 300 } },
      { id: "n4", operatorId: "text-quality-evaluation", position: { x: 550, y: 200 } },
      { id: "n5", operatorId: "data-output", position: { x: 800, y: 200 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n1", to: "n3" },
      { id: "e3", from: "n2", to: "n4" },
      { id: "e4", from: "n3", to: "n4" },
      { id: "e5", from: "n4", to: "n5" },
    ],
  },
  {
    id: "image-captioning",
    name: "图像描述生成",
    description: "使用视觉 AI 为图像生成描述和标注",
    category: "image-processing",
    categoryLabel: "Image Processing",
    operatorCount: 4,
    icon: "Image",
    nodes: [
      { id: "n1", operatorId: "image-input", position: { x: 50, y: 200 } },
      { id: "n2", operatorId: "image-annotation", position: { x: 300, y: 120 } },
      { id: "n3", operatorId: "image-description", position: { x: 300, y: 280 } },
      { id: "n4", operatorId: "data-output", position: { x: 550, y: 200 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n1", to: "n3" },
      { id: "e3", from: "n2", to: "n4" },
      { id: "e4", from: "n3", to: "n4" },
    ],
  },
  {
    id: "video-analysis-pipeline",
    name: "视频分析流水线",
    description: "提取视频帧并生成视频内容摘要",
    category: "video-processing",
    categoryLabel: "Video Processing",
    operatorCount: 4,
    icon: "Video",
    nodes: [
      { id: "n1", operatorId: "video-input", position: { x: 50, y: 200 } },
      { id: "n2", operatorId: "video-frame-extraction", position: { x: 300, y: 200 } },
      { id: "n3", operatorId: "video-summary", position: { x: 550, y: 200 } },
      { id: "n4", operatorId: "data-output", position: { x: 800, y: 200 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
    ],
  },
  {
    id: "content-synthesis-assistant",
    name: "内容合成助手",
    description: "使用 LLM 根据模版生成合成内容",
    category: "data-synthesis",
    categoryLabel: "Data Synthesis",
    operatorCount: 4,
    icon: "WandSparkles",
    nodes: [
      { id: "n1", operatorId: "text-input", position: { x: 50, y: 200 } },
      { id: "n2", operatorId: "text-synthesis", position: { x: 300, y: 200 } },
      { id: "n3", operatorId: "content-generation", position: { x: 550, y: 200 } },
      { id: "n4", operatorId: "data-output", position: { x: 800, y: 200 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
    ],
  },
  {
    id: "knowledge-extraction-pipeline",
    name: "知识提取流水线",
    description: "从文档中提取知识、问答对和关键见解",
    category: "knowledge-generation",
    categoryLabel: "Knowledge Generation",
    operatorCount: 4,
    icon: "Lightbulb",
    nodes: [
      { id: "n1", operatorId: "text-input", position: { x: 50, y: 200 } },
      { id: "n2", operatorId: "document-understanding", position: { x: 300, y: 200 } },
      { id: "n3", operatorId: "knowledge-generation", position: { x: 550, y: 200 } },
      { id: "n4", operatorId: "data-output", position: { x: 800, y: 200 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
    ],
  },
  {
    id: "multimodal-fusion-analysis",
    name: "多模态融合分析",
    description: "结合文本和图像输入进行综合分析",
    category: "multimodal",
    categoryLabel: "Multimodal",
    operatorCount: 4,
    icon: "LayoutGrid",
    nodes: [
      { id: "n1", operatorId: "text-input", position: { x: 50, y: 120 } },
      { id: "n2", operatorId: "image-input", position: { x: 50, y: 300 } },
      { id: "n3", operatorId: "image-text-fusion", position: { x: 330, y: 210 } },
      { id: "n4", operatorId: "data-output", position: { x: 600, y: 210 } },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n3" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4" },
    ],
  },
];

// Execution history types
export interface ExecutionLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "SUCCESS";
  message: string;
}

export interface OperatorExecution {
  operatorId: string;
  operatorName: string;
  startTime: string;
  endTime: string;
  duration: string;
  filesProcessed: number;
  successRate: string;
  status: "completed" | "failed" | "running" | "pending";
  // 并行分支信息
  branchId?: string; // 所属分支ID
  branchName?: string; // 分支名称
  parallelGroup?: number; // 并行组序号，相同序号的算子并行执行
}

export interface ProcessedFile {
  id: string;
  fileName: string;
  processedFileName: string;
  fileType: string;
  processedFileType: string;
  sizeBefore: string;
  sizeAfter: string;
  status: "completed" | "failed" | "processing";
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "completed" | "failed" | "running" | "pending";
  startTime: string;
  endTime: string;
  totalDuration: string;
  successFiles: number;
  failedFiles: number;
  totalFiles: number;
  successRate: string;
  taskId: string;
  description: string;
  sourceDataset: string;
  targetDataset: string;
  retryCount: number;
  operators: OperatorExecution[];
  processedFiles: ProcessedFile[];
  logs: ExecutionLogEntry[];
}

// Demo execution data
export const demoExecutions: WorkflowExecution[] = [
  {
    id: "exec-1",
    workflowId: "sw-1",
    workflowName: "电商评论情感分析",
    status: "completed",
    startTime: "2026-03-01 14:56:00",
    endTime: "2026-03-01 14:56:20",
    totalDuration: "20 秒",
    successFiles: 25,
    failedFiles: 0,
    totalFiles: 25,
    successRate: "100%",
    taskId: "4341e53f-716b-44f5-bc34-19d21adc2784",
    description: "对电商评论数据进行情感分析和分类",
    sourceDataset: "文本1",
    targetDataset: "文本2",
    retryCount: 0,
    operators: [
      { operatorId: "text-input", operatorName: "文本输入", startTime: "14:56:00", endTime: "14:56:02", duration: "2 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 0 },
      { operatorId: "text-annotation", operatorName: "文本标注", startTime: "14:56:02", endTime: "14:56:08", duration: "6 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 1, branchId: "branch-a", branchName: "标注分支" },
      { operatorId: "text-feature-extraction", operatorName: "文本特征提取", startTime: "14:56:02", endTime: "14:56:10", duration: "8 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 1, branchId: "branch-b", branchName: "特征分支" },
      { operatorId: "text-quality-evaluation", operatorName: "文本质量评估", startTime: "14:56:10", endTime: "14:56:16", duration: "6 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 2 },
      { operatorId: "data-output", operatorName: "数据输出", startTime: "14:56:16", endTime: "14:56:20", duration: "4 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 3 },
    ],
    processedFiles: Array.from({ length: 25 }, (_, i) => ({
      id: `f-${i + 1}`,
      fileName: `330版本规划会议${i === 0 ? "" : `_${i}`}`,
      processedFileName: `330版本规划会议${i === 0 ? "" : `_${i}`}`,
      fileType: "txt",
      processedFileType: "txt",
      sizeBefore: "3.3 KB",
      sizeAfter: "3.3 KB",
      status: "completed" as const,
    })),
    logs: [
      { timestamp: "2026-03-01 14:56:00.260", level: "INFO", message: "datamate.wrappers.executor:__init__:33 - Initing Ray..." },
      { timestamp: "2026-03-01 14:56:00.263", level: "INFO", message: "worker.py:1821 -- Connecting to existing Ray cluster at address: 10.244.100.248:6379..." },
      { timestamp: "2026-03-01 14:56:00.274", level: "INFO", message: "worker.py:1998 -- Connected to Ray cluster. View the dashboard at 10.244.100.248:8265" },
      { timestamp: "2026-03-01 14:56:00.293", level: "INFO", message: "__main__:run:30 - Loading dataset with Ray..." },
      { timestamp: "2026-03-01 14:56:00.407", level: "INFO", message: "__main__:run:41 - Processing data..." },
      { timestamp: "2026-03-01 14:56:00.415", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module AnonymizedIpAddress Success." },
      { timestamp: "2026-03-01 14:56:00.416", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module AnonymizedPhoneNumber Success." },
      { timestamp: "2026-03-01 14:56:00.416", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module AnonymizedUrlCleaner Success." },
      { timestamp: "2026-03-01 14:56:00.416", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module TraditionalChineseCleaner Success." },
      { timestamp: "2026-03-01 14:56:00.475", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module SexualAndViolentWordCleaner Success." },
      { timestamp: "2026-03-01 14:56:00.475", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module UnicodeSpaceCleaner Success." },
      { timestamp: "2026-03-01 14:56:10.803", level: "INFO", message: "datamate.core.dataset:load_ops_module:146 - Import Ops module MinerUFormatter Success." },
      { timestamp: "2026-03-01 14:56:10.811", level: "INFO", message: "__main__:run:45 - All Ops are done in 4.403s." },
      { timestamp: "2026-03-01 14:56:10.851", level: "INFO", message: "logging.py:397 - Registered dataset logger for dataset dataset_220_0" },
      { timestamp: "2026-03-01 14:56:10.861", level: "INFO", message: "streaming_executor.py:178 -- Starting execution of Dataset dataset_220_0." },
      { timestamp: "2026-03-01 14:56:10.861", level: "INFO", message: "streaming_executor.py:179 -- Execution plan: InputDataBuffer[Input] -> ActorPoolMapOperator[MapBatches(process_batch_arrow)->Map(AnonymizedIpAddress)] -> ActorPoolMapOperator[Map(AnonymizedPhoneNumber)]" },
      { timestamp: "2026-03-01 14:56:10.996", level: "INFO", message: "streaming_executor.py:686 -- [dataset]: A new progress UI is available." },
      { timestamp: "2026-03-01 14:56:10.998", level: "WARN", message: "resource_manager.py:136 -- Ray's object store is configured to use only 11.7% of available memory (8.76GiB out of 74.5GiB total)." },
      { timestamp: "2026-03-01 14:56:11.014", level: "WARN", message: "resource_manager.py:761 -- Cluster resources are not enough to run any task from ActorPoolMapOperator." },
      { timestamp: "2026-03-01 14:56:14.720", level: "INFO", message: "ops.mapper.ip_address_cleaner.process:execute:42 - fileName: 330版本规划会议.txt, method: IPAddressCleaner costs 0.000572 s" },
      { timestamp: "2026-03-01 14:56:14.830", level: "INFO", message: "ops.mapper.phone_number_cleaner.process:execute:42 - fileName: 330版本规划会议.txt, method: PhoneNumberCleaner costs 0.000491 s" },
      { timestamp: "2026-03-01 14:56:20.000", level: "SUCCESS", message: "工作流执行完成，共处理 25 个文件，成功率 100%" },
    ],
  },
  {
    id: "exec-2",
    workflowId: "sw-1",
    workflowName: "电商评论情感分析",
    status: "failed",
    startTime: "2026-02-28 10:30:00",
    endTime: "2026-02-28 10:31:15",
    totalDuration: "75 秒",
    successFiles: 18,
    failedFiles: 7,
    totalFiles: 25,
    successRate: "72%",
    taskId: "8a2f1b3c-9d4e-5f6a-7b8c-0d1e2f3a4b5c",
    description: "对电商评论数据进行情感分析和分类",
    sourceDataset: "文本1",
    targetDataset: "文本3",
    retryCount: 1,
    operators: [
      { operatorId: "text-input", operatorName: "文本输入", startTime: "10:30:00", endTime: "10:30:02", duration: "2 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 0 },
      { operatorId: "text-annotation", operatorName: "文本标注", startTime: "10:30:02", endTime: "10:30:35", duration: "33 秒", filesProcessed: 25, successRate: "100%", status: "completed", parallelGroup: 1, branchId: "branch-a", branchName: "标注分支" },
      { operatorId: "text-feature-extraction", operatorName: "文本特征提取", startTime: "10:30:02", endTime: "10:31:05", duration: "63 秒", filesProcessed: 25, successRate: "80%", status: "failed", parallelGroup: 1, branchId: "branch-b", branchName: "特征分支" },
      { operatorId: "text-quality-evaluation", operatorName: "文本质量评估", startTime: "10:31:05", endTime: "10:31:05", duration: "0 秒", filesProcessed: 0, successRate: "0%", status: "pending", parallelGroup: 2 },
      { operatorId: "data-output", operatorName: "数据输出", startTime: "10:31:05", endTime: "10:31:15", duration: "10 秒", filesProcessed: 18, successRate: "72%", status: "completed", parallelGroup: 3 },
    ],
    processedFiles: Array.from({ length: 25 }, (_, i) => ({
      id: `f2-${i + 1}`,
      fileName: `产品评论_${i + 1}`,
      processedFileName: `产品评论_${i + 1}`,
      fileType: "json",
      processedFileType: "json",
      sizeBefore: "5.1 KB",
      sizeAfter: i < 18 ? "4.8 KB" : "0 KB",
      status: (i < 18 ? "completed" : "failed") as const,
    })),
    logs: [
      { timestamp: "2026-02-28 10:30:00.000", level: "INFO", message: "开始执行工作流: 电商评论情感分析" },
      { timestamp: "2026-02-28 10:30:00.120", level: "INFO", message: "初始化 Ray 集群连接..." },
      { timestamp: "2026-02-28 10:30:02.000", level: "SUCCESS", message: "文本输入完成，加载 25 个文件" },
      { timestamp: "2026-02-28 10:30:35.000", level: "SUCCESS", message: "文本标注完成" },
      { timestamp: "2026-02-28 10:30:50.000", level: "ERROR", message: "文本特征提取异常: GPU 内存不足，部分文件处理失败 (7/25)" },
      { timestamp: "2026-02-28 10:31:05.000", level: "WARN", message: "跳过文本质量评估，上游节点存在异常" },
      { timestamp: "2026-02-28 10:31:15.000", level: "INFO", message: "数据输出完成，已保存 18 个文件" },
      { timestamp: "2026-02-28 10:31:15.100", level: "ERROR", message: "工作流执行异常，成功率 72%，7 个文件处理失败" },
    ],
  },
  {
    id: "exec-3",
    workflowId: "sw-2",
    workflowName: "产品图片自动标注",
    status: "running",
    startTime: "2026-03-01 16:00:00",
    endTime: "--",
    totalDuration: "进行中",
    successFiles: 12,
    failedFiles: 0,
    totalFiles: 30,
    successRate: "40%",
    taskId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    description: "批量为产品图片生成描述和分类标签",
    sourceDataset: "图片集1",
    targetDataset: "图片集2",
    retryCount: 0,
    operators: [
      { operatorId: "image-input", operatorName: "图像输入", startTime: "16:00:00", endTime: "16:00:05", duration: "5 秒", filesProcessed: 30, successRate: "100%", status: "completed", parallelGroup: 0 },
      { operatorId: "image-annotation", operatorName: "图像标注", startTime: "16:00:05", endTime: "--", duration: "--", filesProcessed: 12, successRate: "40%", status: "running", parallelGroup: 1, branchId: "branch-a", branchName: "标注分支" },
      { operatorId: "image-description", operatorName: "图像描述生成", startTime: "16:00:05", endTime: "--", duration: "--", filesProcessed: 8, successRate: "27%", status: "running", parallelGroup: 1, branchId: "branch-b", branchName: "描述分支" },
      { operatorId: "data-output", operatorName: "数据输出", startTime: "--", endTime: "--", duration: "--", filesProcessed: 0, successRate: "0%", status: "pending", parallelGroup: 2 },
    ],
    processedFiles: Array.from({ length: 30 }, (_, i) => ({
      id: `f3-${i + 1}`,
      fileName: `product_${String(i + 1).padStart(3, "0")}.jpg`,
      processedFileName: `product_${String(i + 1).padStart(3, "0")}_tagged.json`,
      fileType: "jpg",
      processedFileType: "json",
      sizeBefore: "256 KB",
      sizeAfter: i < 12 ? "1.2 KB" : "0 KB",
      status: (i < 12 ? "completed" : i === 12 ? "processing" : "failed") as const,
    })),
    logs: [
      { timestamp: "2026-03-01 16:00:00.000", level: "INFO", message: "开始执行工作流: 产品图片自动标注" },
      { timestamp: "2026-03-01 16:00:05.000", level: "SUCCESS", message: "图像输入完成，加载 30 个文件" },
      { timestamp: "2026-03-01 16:00:05.100", level: "INFO", message: "开始执行图像标注，使用模型 gpt-4o" },
      { timestamp: "2026-03-01 16:00:10.000", level: "INFO", message: "已处理 5/30 个图像..." },
      { timestamp: "2026-03-01 16:00:15.000", level: "INFO", message: "已处理 10/30 个图像..." },
      { timestamp: "2026-03-01 16:00:18.000", level: "INFO", message: "已处理 12/30 个图像..." },
    ],
  },
];

export function getOperatorById(id: string): Operator | undefined {
  return operators.find((op) => op.id === id);
}

export function getExecutionsByWorkflowId(workflowId: string): WorkflowExecution[] {
  return demoExecutions.filter((e) => e.workflowId === workflowId);
}

export function getExecutionById(executionId: string): WorkflowExecution | undefined {
  return demoExecutions.find((e) => e.id === executionId);
}
