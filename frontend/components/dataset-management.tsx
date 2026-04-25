"use client";

import { useState, useMemo } from "react";
import {
  Database,
  Search,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  FileText,
  Image,
  Headphones,
  Video,
  LayoutGrid,
  Clock,
  HardDrive,
  File,
  Trash2,
  Pencil,
  Eye,
  FolderOpen,
  ArrowUpDown,
  ArrowLeft,
  Tag,
  Workflow,
  BookOpen,
  ChevronRight,
  Link2,
  BarChart3,
  List,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDatasets } from "@/hooks/use-datasets";
import { adaptDataset } from "@/lib/adapters";
import { datasetApi } from "@/lib/api";

type DatasetType = "text" | "image" | "audio" | "video" | "multimodal";
type DatasetStatus = "ready" | "processing" | "error";

interface DatasetFile {
  id: string;
  name: string;
  type: string;
  size: string;
  createdAt: string;
  status: "ready" | "processing" | "error";
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  status: DatasetStatus;
  fileCount: number;
  totalSize: string;
  createdAt: string;
  updatedAt: string;
  creator: string;
  tags: string[];
  usedByWorkflows: string[];
  linkedKnowledgeBases: string[];
  files: DatasetFile[];
}

const typeConfig: Record<DatasetType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  text: { label: "文本", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  image: { label: "图像", icon: Image, color: "text-cyber-orange", bg: "bg-cyber-orange/10" },
  audio: { label: "音频", icon: Headphones, color: "text-cyber-neon", bg: "bg-cyber-neon/10" },
  video: { label: "视频", icon: Video, color: "text-cyber-pink", bg: "bg-cyber-pink/10" },
  multimodal: { label: "多模态", icon: LayoutGrid, color: "text-cyber-purple", bg: "bg-cyber-purple/10" },
};

const statusConfig: Record<DatasetStatus, { label: string; color: string; dot: string }> = {
  ready: { label: "就绪", color: "text-cyber-neon", dot: "bg-cyber-neon" },
  processing: { label: "处理中", color: "text-cyber-orange", dot: "bg-cyber-orange animate-pulse" },
  error: { label: "异常", color: "text-destructive", dot: "bg-destructive" },
};

const generateFiles = (prefix: string, type: string, count: number): DatasetFile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `file-${i}`,
    name: `${prefix}_${String(i + 1).padStart(4, "0")}.${type}`,
    type: type.toUpperCase(),
    size: `${(Math.random() * 10 + 0.5).toFixed(1)} KB`,
    createdAt: "2026-03-01",
    status: (Math.random() > 0.05 ? "ready" : "error") as DatasetFile["status"],
  }));

const demoDatasets: Dataset[] = [
  {
    id: "ds-1", name: "电商评论数据集", description: "包含 10 万条电商平台用户评论，涵盖多个商品品类，已完成基础清洗和去重",
    type: "text", status: "ready", fileCount: 1250, totalSize: "256 MB", createdAt: "2026-02-20", updatedAt: "2026-03-01", creator: "张工",
    tags: ["NLP", "情感分析", "电商", "评论"],
    usedByWorkflows: ["电商评论情感分析", "文本分析流水线"],
    linkedKnowledgeBases: ["电商领域知识图谱"],
    files: generateFiles("review", "txt", 20),
  },
  {
    id: "ds-2", name: "产品图片集-V2", description: "产品主图和详情图，已完成去重和质量筛选",
    type: "image", status: "ready", fileCount: 8500, totalSize: "12.8 GB", createdAt: "2026-02-15", updatedAt: "2026-02-28", creator: "李工",
    tags: ["计算机视觉", "产品识别", "图像分类"],
    usedByWorkflows: ["产品图片自动标注"],
    linkedKnowledgeBases: ["电商领域知识图谱"],
    files: generateFiles("product", "jpg", 20),
  },
  {
    id: "ds-3", name: "客服对话录音", description: "客户服务中心电话录音，包含语音和转写文本",
    type: "audio", status: "processing", fileCount: 3200, totalSize: "45.6 GB", createdAt: "2026-02-25", updatedAt: "2026-03-01", creator: "王工",
    tags: ["语音识别", "客服质检", "ASR"],
    usedByWorkflows: [],
    linkedKnowledgeBases: ["客服对话意图图谱"],
    files: generateFiles("call", "wav", 20),
  },
  {
    id: "ds-4", name: "培训视频素材库", description: "企业内部培训视频，含讲解和演示内容",
    type: "video", status: "ready", fileCount: 150, totalSize: "89.2 GB", createdAt: "2026-01-10", updatedAt: "2026-02-20", creator: "赵工",
    tags: ["视频理解", "知识提取", "培训"],
    usedByWorkflows: ["培训视频内容提取"],
    linkedKnowledgeBases: ["企业培训知识库"],
    files: generateFiles("training", "mp4", 15),
  },
  {
    id: "ds-5", name: "图文混合语料", description: "包含图片及对应文字描述的多模态数据",
    type: "multimodal", status: "ready", fileCount: 5600, totalSize: "8.4 GB", createdAt: "2026-02-18", updatedAt: "2026-02-27", creator: "张工",
    tags: ["多模态", "图文匹配", "CLIP"],
    usedByWorkflows: [],
    linkedKnowledgeBases: [],
    files: generateFiles("pair", "json", 20),
  },
  {
    id: "ds-6", name: "新闻文章合集", description: "从多个新闻源采集的中文新闻文章，已去重清洗",
    type: "text", status: "ready", fileCount: 28000, totalSize: "1.2 GB", createdAt: "2026-02-22", updatedAt: "2026-03-01", creator: "李工",
    tags: ["NLP", "新闻分类", "摘要生成"],
    usedByWorkflows: [],
    linkedKnowledgeBases: ["新闻语义向量库"],
    files: generateFiles("news", "json", 20),
  },
  {
    id: "ds-7", name: "医学影像标注集", description: "包含 X 光和 CT 扫描图像，附带专家标注",
    type: "image", status: "error", fileCount: 420, totalSize: "34.5 GB", createdAt: "2026-01-05", updatedAt: "2026-02-10", creator: "王工",
    tags: ["医疗", "图像分割", "标注"],
    usedByWorkflows: [],
    linkedKnowledgeBases: ["医学影像问答库"],
    files: generateFiles("scan", "dcm", 20),
  },
  {
    id: "ds-8", name: "会议纪要数据集", description: "内部会议的文字记录和摘要，用于会议总结模型训练",
    type: "text", status: "ready", fileCount: 680, totalSize: "45 MB", createdAt: "2026-02-28", updatedAt: "2026-03-01", creator: "赵工",
    tags: ["NLP", "摘要", "会议"],
    usedByWorkflows: [],
    linkedKnowledgeBases: ["企业培训知识库"],
    files: generateFiles("meeting", "txt", 20),
  },
];

// --- Dataset Detail Component ---
type DSDetailTab = "files" | "tags" | "associations";

function DatasetDetail({ dataset, onBack }: { dataset: Dataset; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<DSDetailTab>("files");
  const [fileSearch, setFileSearch] = useState("");
  const tc = typeConfig[dataset.type];
  const sc = statusConfig[dataset.status];
  const TypeIcon = tc.icon;

  const tabs: { id: DSDetailTab; label: string; icon: React.ElementType }[] = [
    { id: "files", label: "文件列表", icon: List },
    { id: "tags", label: "标签与元数据", icon: Tag },
    { id: "associations", label: "关联资源", icon: Link2 },
  ];

  const filteredFiles = dataset.files.filter(
    (f) => !fileSearch || f.name.includes(fileSearch)
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-6xl mx-auto w-full px-8 py-6 space-y-5">
        {/* Breadcrumb */}
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回数据集列表
        </button>

        {/* Header */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-border", tc.bg)}>
              <TypeIcon className={cn("h-6 w-6", tc.color)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-foreground">{dataset.name}</h1>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", sc.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {sc.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{dataset.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                <Upload className="h-3.5 w-3.5" />
                上传文件
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                <Download className="h-3.5 w-3.5" />
                导出
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs">
              <File className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">文件数</span>
              <span className="font-mono font-medium text-foreground">{dataset.fileCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <HardDrive className="h-3.5 w-3.5 text-cyber-neon" />
              <span className="text-muted-foreground">总大小</span>
              <span className="font-mono font-medium text-foreground">{dataset.totalSize}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal rounded", tc.color)}>{tc.label}</Badge>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {"创建于 "}{dataset.createdAt}{" | 更新于 "}{dataset.updatedAt}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 pb-3 text-xs font-medium transition-colors",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === "associations" && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-0.5">
                    ({dataset.usedByWorkflows.length + dataset.linkedKnowledgeBases.length})
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] pb-8">
          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="pl-9 h-8 bg-muted/50 border-border text-xs"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {"显示 "}{filteredFiles.length}{" / "}{dataset.files.length}{" 个文件"}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">
                        <input type="checkbox" className="rounded border-border" />
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">文件名</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">大小</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">创建时间</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => {
                      const fsc = statusConfig[file.status];
                      return (
                        <tr key={file.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-border" /></td>
                          <td className="px-4 py-3 text-primary font-medium">{file.name}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded">{file.type}</Badge></td>
                          <td className="px-4 py-3 font-mono text-foreground">{file.size}</td>
                          <td className="px-4 py-3 text-foreground">{file.createdAt}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", fsc.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", fsc.dot)} />
                              {fsc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button className="text-primary text-[10px] hover:underline">预览</button>
                              <button className="text-primary text-[10px] hover:underline">下载</button>
                              <button className="text-destructive text-[10px] hover:underline">删除</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {dataset.fileCount > dataset.files.length && (
                <p className="text-center text-[11px] text-muted-foreground">
                  {"仅展示前 "}{dataset.files.length}{" 个文件，共 "}{dataset.fileCount.toLocaleString()}{" 个"}
                </p>
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === "tags" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">标签</h3>
                  <button className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                    <Plus className="h-3 w-3" /> 添加标签
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dataset.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/[0.06] text-primary border border-primary/15 group cursor-default">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">元数据</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-12 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">数据集 ID</span>
                    <span className="text-foreground font-mono">{dataset.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">数据类型</span>
                    <span className={cn("font-medium", tc.color)}>{tc.label}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">创建者</span>
                    <span className="text-foreground">{dataset.creator}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">文件数量</span>
                    <span className="text-foreground font-mono">{dataset.fileCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">总大小</span>
                    <span className="text-foreground font-mono">{dataset.totalSize}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">创建时间</span>
                    <span className="text-foreground">{dataset.createdAt}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">更新时间</span>
                    <span className="text-foreground">{dataset.updatedAt}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">状态</span>
                    <span className={cn("flex items-center gap-1", sc.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                      {sc.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Distribution */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">数据分布</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "文件类型分布", items: [{ name: dataset.type === "text" ? "TXT" : dataset.type === "image" ? "JPG" : dataset.type === "audio" ? "WAV" : dataset.type === "video" ? "MP4" : "JSON", pct: 65 }, { name: "其他", pct: 35 }] },
                    { label: "文件大小分布", items: [{ name: "<1KB", pct: 20 }, { name: "1-10KB", pct: 55 }, { name: ">10KB", pct: 25 }] },
                    { label: "状态分布", items: [{ name: "就绪", pct: 95 }, { name: "异常", pct: 5 }] },
                  ].map((group) => (
                    <div key={group.label}>
                      <h4 className="text-[11px] font-medium text-muted-foreground mb-3">{group.label}</h4>
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div key={item.name}>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-foreground">{item.name}</span>
                              <span className="text-muted-foreground font-mono">{item.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Associations Tab */}
          {activeTab === "associations" && (
            <div className="space-y-6">
              {/* Used by Workflows */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-cyber-orange" />
                  使用该数据集的工作流
                  <span className="text-[10px] text-muted-foreground font-normal">({dataset.usedByWorkflows.length})</span>
                </h3>
                {dataset.usedByWorkflows.length > 0 ? (
                  <div className="space-y-2">
                    {dataset.usedByWorkflows.map((wf) => (
                      <div key={wf} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60 bg-muted/20 hover:border-primary/30 cursor-pointer transition-colors">
                        <Workflow className="h-4 w-4 text-cyber-orange flex-shrink-0" />
                        <span className="text-xs text-foreground font-medium">{wf}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂无工作流使用该数据集</p>
                )}
              </div>

              {/* Linked Knowledge Bases */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyber-purple" />
                  关联的知识库/图谱
                  <span className="text-[10px] text-muted-foreground font-normal">({dataset.linkedKnowledgeBases.length})</span>
                </h3>
                {dataset.linkedKnowledgeBases.length > 0 ? (
                  <div className="space-y-2">
                    {dataset.linkedKnowledgeBases.map((kb) => (
                      <div key={kb} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60 bg-muted/20 hover:border-primary/30 cursor-pointer transition-colors">
                        <BookOpen className="h-4 w-4 text-cyber-purple flex-shrink-0" />
                        <span className="text-xs text-foreground font-medium">{kb}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂无关联的知识库</p>
                )}
              </div>

              {/* Data Lineage */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  数据血缘
                </h3>
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-[10px] text-foreground font-medium">{dataset.name}</span>
                    <span className="text-[9px] text-muted-foreground">源数据集</span>
                  </div>
                  {dataset.usedByWorkflows.length > 0 && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border border-cyber-orange/30 bg-cyber-orange/5">
                        <Workflow className="h-4 w-4 text-cyber-orange" />
                        <span className="text-[10px] text-foreground font-medium">{dataset.usedByWorkflows[0]}</span>
                        <span className="text-[9px] text-muted-foreground">工作流</span>
                      </div>
                    </>
                  )}
                  {dataset.linkedKnowledgeBases.length > 0 && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border border-cyber-purple/30 bg-cyber-purple/5">
                        <BookOpen className="h-4 w-4 text-cyber-purple" />
                        <span className="text-[10px] text-foreground font-medium">{dataset.linkedKnowledgeBases[0]}</span>
                        <span className="text-[9px] text-muted-foreground">知识库</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
type FilterType = "all" | DatasetType;
type SortField = "name" | "updatedAt" | "fileCount" | "totalSize";

export function DatasetManagement() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const { datasets: rawDatasets, loading, remove } = useDatasets();
  const allDatasets: Dataset[] = useMemo(() => rawDatasets.map(adaptDataset), [rawDatasets]);

  const filteredDatasets = useMemo(() => {
    let result = allDatasets;
    if (filterType !== "all") result = result.filter((ds) => ds.type === filterType);
    if (search) result = result.filter((ds) => ds.name.includes(search) || ds.description.includes(search));
    result = [...result].sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name);
      if (sortField === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
      if (sortField === "fileCount") return b.fileCount - a.fileCount;
      return 0;
    });
    return result;
  }, [search, filterType, sortField, allDatasets]);

  const typeFilters: { id: FilterType; label: string }[] = [
    { id: "all", label: "全部" },
    { id: "text", label: "文本" },
    { id: "image", label: "图像" },
    { id: "audio", label: "音频" },
    { id: "video", label: "视频" },
    { id: "multimodal", label: "多模态" },
  ];

  const totalStats = {
    total: allDatasets.length,
    ready: allDatasets.filter((d) => d.status === "ready").length,
    processing: allDatasets.filter((d) => d.status === "processing").length,
    totalFiles: allDatasets.reduce((sum, d) => sum + d.fileCount, 0),
  };

  if (selectedDataset) {
    return <DatasetDetail dataset={selectedDataset} onBack={() => setSelectedDataset(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">数据集管理</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {"管理和浏览所有数据集，共 "}
                <span className="text-primary font-mono">{totalStats.total}</span>
                {" 个数据集"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                <Upload className="h-3.5 w-3.5" />
                导入数据集
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                新建数据集
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {typeFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={cn(
                  "relative pb-3 text-xs font-medium transition-colors",
                  filterType === f.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                {filterType === f.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-border/60 flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-primary" />
            {"共 "}<span className="text-primary font-mono">{totalStats.total}</span>{" 个"}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon" />
            {"就绪 "}<span className="font-mono">{totalStats.ready}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-orange animate-pulse" />
            {"处理中 "}<span className="font-mono">{totalStats.processing}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <File className="h-3.5 w-3.5" />
            {"共 "}<span className="font-mono">{totalStats.totalFiles.toLocaleString()}</span>{" 个文件"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="搜索数据集..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 w-56 bg-muted/50 border-border focus-visible:ring-primary/30 text-xs placeholder:text-muted-foreground/60" />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded text-xs transition-colors", viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("p-1.5 rounded text-xs transition-colors", viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredDatasets.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredDatasets.map((ds) => {
                  const tc2 = typeConfig[ds.type];
                  const sc2 = statusConfig[ds.status];
                  const TypeIcon2 = tc2.icon;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => setSelectedDataset(ds)}
                      className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,150,150,0.06)] transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border border-border", tc2.bg)}>
                            <TypeIcon2 className={cn("h-4 w-4", tc2.color)} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-foreground leading-tight">{ds.name}</h3>
                            <span className="text-[10px] text-muted-foreground">{ds.creator}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === ds.id ? null : ds.id); }}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {contextMenu === ds.id && (
                            <div className="absolute right-0 top-7 z-10 w-32 py-1 rounded-lg border border-border bg-card shadow-lg">
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); setSelectedDataset(ds); }}>
                                <Eye className="h-3 w-3" /> 查看详情
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}>
                                <Pencil className="h-3 w-3" /> 编辑
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); window.open(datasetApi.exportUrl(ds.id), "_blank"); }}>
                                <Download className="h-3 w-3" /> 导出
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); remove(ds.id); }}>
                                <Trash2 className="h-3 w-3" /> 删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{ds.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {ds.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded bg-secondary/50 text-muted-foreground border-border/40">{tag}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><File className="h-3 w-3" />{ds.fileCount.toLocaleString()} 文件</span>
                          <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{ds.totalSize}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", sc2.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc2.dot)} />
                            {sc2.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{ds.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">名称</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">文件数</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">大小</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">创建人</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">更新时间</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDatasets.map((ds) => {
                      const tc2 = typeConfig[ds.type];
                      const sc2 = statusConfig[ds.status];
                      const TypeIcon2 = tc2.icon;
                      return (
                        <tr key={ds.id} onClick={() => setSelectedDataset(ds)} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-7 h-7 rounded flex items-center justify-center", tc2.bg)}>
                                <TypeIcon2 className={cn("h-3.5 w-3.5", tc2.color)} />
                              </div>
                              <div>
                                <span className="text-foreground font-medium">{ds.name}</span>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{ds.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px] font-normal", tc2.color)}>{tc2.label}</Badge></td>
                          <td className="px-4 py-3 font-mono text-foreground">{ds.fileCount.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-foreground">{ds.totalSize}</td>
                          <td className="px-4 py-3 text-foreground">{ds.creator}</td>
                          <td className="px-4 py-3 text-foreground">{ds.updatedAt}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", sc2.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc2.dot)} />
                              {sc2.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button className="text-primary hover:underline text-[11px]" onClick={(e) => { e.stopPropagation(); setSelectedDataset(ds); }}>查看</button>
                              <button className="text-muted-foreground hover:text-foreground text-[11px]" onClick={(e) => e.stopPropagation()}>导出</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">未找到匹配的数据集</p>
              <p className="text-xs mt-1 opacity-60">尝试调整搜索条件或筛选器</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
