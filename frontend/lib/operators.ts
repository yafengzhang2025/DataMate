export type OperatorCategory =
  | "input"
  | "output"
  | "annotation"
  | "feature-extraction"
  | "evaluation"
  | "data-aggregation"
  | "data-synthesis"
  | "knowledge-generation"
  | "image-construction";

export type OperatorTag =
  | "LLM"
  | "LOCAL CPU"
  | "LOCAL GPU"
  | "输入"
  | "输出"
  | "标注"
  | "特征提取"
  | "评估"
  | "数据聚合"
  | "数据合成"
  | "知识生成"
  | "图像构建";

export interface Operator {
  id: string;
  name: string;
  version: string;
  description: string;
  category: OperatorCategory;
  tags: OperatorTag[];
  inputs: number;
  outputs: number;
  installed: boolean;
  icon: string;
  iconColor: string;
}

export interface CategoryInfo {
  id: OperatorCategory;
  label: string;
  count: number;
  icon: string;
}

export const categories: CategoryInfo[] = [
  { id: "input", label: "输入", count: 5, icon: "ArrowDownToLine" },
  { id: "output", label: "输出", count: 1, icon: "ArrowUpFromLine" },
  { id: "annotation", label: "标注", count: 2, icon: "Tag" },
  { id: "feature-extraction", label: "特征提取", count: 5, icon: "Scan" },
  { id: "evaluation", label: "评估", count: 1, icon: "ShieldCheck" },
  { id: "data-aggregation", label: "数据聚合", count: 2, icon: "Layers" },
  { id: "data-synthesis", label: "数据合成", count: 3, icon: "Sparkles" },
  { id: "knowledge-generation", label: "知识生成", count: 4, icon: "Brain" },
  { id: "image-construction", label: "图像构建", count: 1, icon: "ImagePlus" },
];

export const operators: Operator[] = [
  // 输入类
  {
    id: "text-input",
    name: "文本输入",
    version: "v1.0.0",
    description: "输入文本数据进行处理",
    category: "input",
    tags: ["输入", "LOCAL CPU"],
    inputs: 0,
    outputs: 1,
    installed: true,
    icon: "FileText",
    iconColor: "text-cyber-glow",
  },
  {
    id: "image-input",
    name: "图像输入",
    version: "v1.0.0",
    description: "上传图像文件进行处理",
    category: "input",
    tags: ["输入", "LOCAL CPU"],
    inputs: 0,
    outputs: 1,
    installed: true,
    icon: "Image",
    iconColor: "text-cyber-orange",
  },
  {
    id: "audio-input",
    name: "音频输入",
    version: "v1.0.0",
    description: "上传音频文件进行处理",
    category: "input",
    tags: ["输入", "LOCAL CPU"],
    inputs: 0,
    outputs: 1,
    installed: true,
    icon: "Headphones",
    iconColor: "text-cyber-neon",
  },
  {
    id: "video-input",
    name: "视频输入",
    version: "v1.0.0",
    description: "上传视频文件进行处理",
    category: "input",
    tags: ["输入", "LOCAL CPU"],
    inputs: 0,
    outputs: 1,
    installed: true,
    icon: "Video",
    iconColor: "text-cyber-pink",
  },
  {
    id: "multimodal-input",
    name: "多模态输入",
    version: "v1.0.0",
    description: "同时输入文本和图像数据进行处理",
    category: "input",
    tags: ["输入", "LOCAL CPU"],
    inputs: 0,
    outputs: 2,
    installed: true,
    icon: "LayoutGrid",
    iconColor: "text-cyber-purple",
  },
  // 输出类
  {
    id: "data-output",
    name: "数据输出",
    version: "v1.0.0",
    description: "保存处理后的数据",
    category: "output",
    tags: ["输出", "LOCAL CPU"],
    inputs: 1,
    outputs: 0,
    installed: true,
    icon: "Download",
    iconColor: "text-cyber-glow",
  },
  // 标注类
  {
    id: "text-annotation",
    name: "文本标注",
    version: "v1.0.0",
    description: "使用 LLM 进行文本分类、标记或提取",
    category: "annotation",
    tags: ["标注", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "Tags",
    iconColor: "text-cyber-orange",
  },
  {
    id: "image-annotation",
    name: "图像标注",
    version: "v1.0.0",
    description: "使用视觉 LLM 标注图像",
    category: "annotation",
    tags: ["标注", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "ScanSearch",
    iconColor: "text-cyber-orange",
  },
  // 特征提取类
  {
    id: "text-feature-extraction",
    name: "文本特征提取",
    version: "v1.0.0",
    description: "使用 LLM 或本地模型提取文本特征",
    category: "feature-extraction",
    tags: ["特征提取", "LLM", "LOCAL CPU"],
    inputs: 1,
    outputs: 2,
    installed: true,
    icon: "TextSearch",
    iconColor: "text-cyber-neon",
  },
  {
    id: "image-feature-extraction",
    name: "图像特征提取",
    version: "v1.0.0",
    description: "从图像中提取视觉特征",
    category: "feature-extraction",
    tags: ["特征提取", "LOCAL GPU", "LOCAL CPU"],
    inputs: 1,
    outputs: 2,
    installed: true,
    icon: "ScanEye",
    iconColor: "text-cyber-neon",
  },
  {
    id: "audio-transcription",
    name: "音频转写",
    version: "v1.0.0",
    description: "使用 Whisper 将音频转写为文本",
    category: "feature-extraction",
    tags: ["特征提取", "LLM", "LOCAL GPU"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "AudioLines",
    iconColor: "text-cyber-neon",
  },
  {
    id: "video-frame-extraction",
    name: "视频帧提取",
    version: "v1.0.0",
    description: "从视频中提取帧",
    category: "feature-extraction",
    tags: ["特征提取", "LOCAL CPU"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "Film",
    iconColor: "text-cyber-neon",
  },
  {
    id: "image-text-fusion",
    name: "图文融合",
    version: "v1.0.0",
    description: "使用视觉 AI 结合图像和文本信息进行综合分析",
    category: "feature-extraction",
    tags: ["特征提取", "LLM"],
    inputs: 2,
    outputs: 1,
    installed: true,
    icon: "Merge",
    iconColor: "text-cyber-neon",
  },
  // 评估类
  {
    id: "text-quality-evaluation",
    name: "文本质量评估",
    version: "v1.0.0",
    description: "基于多维度指标评估文本质量",
    category: "evaluation",
    tags: ["评估", "LLM", "LOCAL CPU"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "ShieldCheck",
    iconColor: "text-cyber-glow",
  },
  // 数据聚合类
  {
    id: "text-aggregation",
    name: "文本聚合",
    version: "v1.0.0",
    description: "将多个文本输入合并为一个",
    category: "data-aggregation",
    tags: ["数据聚合", "LOCAL CPU"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "Combine",
    iconColor: "text-cyber-purple",
  },
  {
    id: "av-sync",
    name: "视听同步",
    version: "v1.0.0",
    description: "结合视频帧与同步音频转写",
    category: "data-aggregation",
    tags: ["数据聚合", "LOCAL CPU"],
    inputs: 2,
    outputs: 1,
    installed: true,
    icon: "RadioTower",
    iconColor: "text-cyber-purple",
  },
  // 数据合成类
  {
    id: "text-synthesis",
    name: "文本生成合成",
    version: "v1.0.0",
    description: "使用 LLM 生成合成文本数据",
    category: "data-synthesis",
    tags: ["数据合成", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "WandSparkles",
    iconColor: "text-cyber-pink",
  },
  {
    id: "tts-synthesis",
    name: "语音合成 (TTS)",
    version: "v1.0.0",
    description: "将文本转换为语音",
    category: "data-synthesis",
    tags: ["数据合成", "LLM", "LOCAL CPU"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "Volume2",
    iconColor: "text-cyber-pink",
  },
  {
    id: "content-generation",
    name: "内容生成",
    version: "v1.0.0",
    description: "基于多模态输入生成新内容（文本、描述、摘要等）",
    category: "data-synthesis",
    tags: ["数据合成", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "PenTool",
    iconColor: "text-cyber-pink",
  },
  // 知识生成类
  {
    id: "knowledge-generation",
    name: "知识生成",
    version: "v1.0.0",
    description: "从文本中生成知识（问答对、摘要、见解）",
    category: "knowledge-generation",
    tags: ["知识生成", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "Lightbulb",
    iconColor: "text-cyber-glow",
  },
  {
    id: "image-description",
    name: "图像描述生成",
    version: "v1.0.0",
    description: "为图像生成描述文字",
    category: "knowledge-generation",
    tags: ["知识生成", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "MessageSquare",
    iconColor: "text-cyber-glow",
  },
  {
    id: "video-summary",
    name: "视频摘要",
    version: "v1.0.0",
    description: "生成视频内容摘要",
    category: "knowledge-generation",
    tags: ["知识生成", "LLM"],
    inputs: 1,
    outputs: 2,
    installed: true,
    icon: "FileVideo",
    iconColor: "text-cyber-glow",
  },
  {
    id: "document-understanding",
    name: "文档理解",
    version: "v1.0.0",
    description: "从文档图像中提取并理解内容",
    category: "knowledge-generation",
    tags: ["知识生成", "LLM"],
    inputs: 1,
    outputs: 1,
    installed: true,
    icon: "BookOpen",
    iconColor: "text-cyber-glow",
  },
  // 图像构建类
  {
    id: "image-generation",
    name: "图像生成",
    version: "v1.0.0",
    description: "使用 DALL-E 或本地模型生成图像",
    category: "image-construction",
    tags: ["图像构建", "LLM", "LOCAL GPU"],
    inputs: 1,
    outputs: 1,
    installed: false,
    icon: "Brush",
    iconColor: "text-cyber-orange",
  },
];
