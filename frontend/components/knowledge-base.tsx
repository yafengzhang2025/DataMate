"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Network,
  FileText,
  Clock,
  HardDrive,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Brain,
  File,
  Zap,
  ChevronRight,
  GitBranch,
  Tag,
  Database,
  Workflow,
  MessageSquare,
  List,
  BarChart3,
  Globe,
  Link2,
  XCircle,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useKnowledgeBases } from "@/hooks/use-knowledge";
import { adaptKnowledgeBase } from "@/lib/adapters";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---
type KBStatus = "active" | "building" | "error" | "archived";
type KBType = "graph" | "embedding";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: KBType;
  status: KBStatus;
  documentCount: number;
  entityCount: number;
  relationCount: number;
  totalSize: string;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
  creator: string;
  tags: string[];
  sourceDatasets: string[];
  sourceWorkflows: string[];
}

interface KBGraphNode {
  id: string;
  label: string;
  type: string;
  count: number;
}

interface KBGraphRelation {
  from: string;
  to: string;
  label: string;
  count: number;
}

interface OntologyConcept {
  id: string;
  name: string;
  code: string;
  parent: string | null;
  status: "draft" | "published";
  properties: string[];
  instances: number;
}

interface OntologyRelation {
  id: string;
  name: string;
  from: string;
  to: string;
  cardinality: string;
  status: "draft" | "published";
}

type OntologyMainTab = "knowledge-bases" | "ontology";

// --- Config ---
const typeConfig: Record<KBType, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  graph: { label: "知识图谱", icon: Network, color: "text-cyber-purple", bg: "bg-cyber-purple/10", description: "基于实体-关系的结构化知识表示，支持复杂推理查询" },
  embedding: { label: "向量知识库", icon: Brain, color: "text-cyber-neon", bg: "bg-cyber-neon/10", description: "基于向量嵌入的语义检索，支持相似度搜索和 RAG 应用" },
};

const statusConfig: Record<KBStatus, { label: string; color: string; dot: string }> = {
  active: { label: "活跃", color: "text-cyber-neon", dot: "bg-cyber-neon" },
  building: { label: "构建中", color: "text-cyber-orange", dot: "bg-cyber-orange animate-pulse" },
  error: { label: "异常", color: "text-destructive", dot: "bg-destructive" },
  archived: { label: "已归档", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

// --- Demo Data ---
const demoKnowledgeBases: KnowledgeBase[] = [
  {
    id: "kb-1",
    name: "电商领域知识图谱",
    description: "从电商评论和产品描述中构建的领域知识图谱，涵盖产品、品牌、属性、情感等实体关系",
    type: "graph",
    status: "active",
    documentCount: 12500,
    entityCount: 8640,
    relationCount: 23500,
    totalSize: "1.8 GB",
    embeddingModel: "bge-large-zh",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-01",
    creator: "张工",
    tags: ["电商", "知识图谱", "NER"],
    sourceDatasets: ["电商评论数据集", "产品图片集-V2"],
    sourceWorkflows: ["电商评论情感分析"],
  },
  {
    id: "kb-2",
    name: "企业培训向量库",
    description: "从培训视频和文档中提取的语义向量表示，支持智能检索和相似度匹配",
    type: "embedding",
    status: "active",
    documentCount: 580,
    entityCount: 0,
    relationCount: 0,
    totalSize: "420 MB",
    embeddingModel: "text-embedding-3-small",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-28",
    creator: "赵工",
    tags: ["培训", "向量", "RAG"],
    sourceDatasets: ["培训视频素材库", "会议纪要数据集"],
    sourceWorkflows: ["培训视频内容提取"],
  },
  {
    id: "kb-3",
    name: "医学影像知识图谱",
    description: "基于医学影像标注数据构建的领域知识图谱，涵盖疾病、症状、诊断等实体关系",
    type: "graph",
    status: "building",
    documentCount: 420,
    entityCount: 3560,
    relationCount: 8900,
    totalSize: "2.3 GB",
    embeddingModel: "m3e-base",
    createdAt: "2026-02-20",
    updatedAt: "2026-03-01",
    creator: "王工",
    tags: ["医疗", "知识图谱", "影像"],
    sourceDatasets: ["医学影像标注集"],
    sourceWorkflows: [],
  },
  {
    id: "kb-4",
    name: "新闻语义向量库",
    description: "新闻文章的高维向量表示，支持语义检索和相似文章推荐",
    type: "embedding",
    status: "active",
    documentCount: 28000,
    entityCount: 0,
    relationCount: 0,
    totalSize: "3.6 GB",
    embeddingModel: "text-embedding-3-large",
    createdAt: "2026-02-22",
    updatedAt: "2026-03-01",
    creator: "李工",
    tags: ["新闻", "向量检索", "语义"],
    sourceDatasets: ["新闻文章合集"],
    sourceWorkflows: [],
  },
  {
    id: "kb-5",
    name: "客服对话意图图谱",
    description: "从客服对话中提取的意图-实体-动作关系图谱，用于智能客服系统",
    type: "graph",
    status: "error",
    documentCount: 3200,
    entityCount: 4100,
    relationCount: 9800,
    totalSize: "680 MB",
    embeddingModel: "bge-large-zh",
    createdAt: "2026-02-25",
    updatedAt: "2026-03-01",
    creator: "王工",
    tags: ["客服", "意图识别", "图谱"],
    sourceDatasets: ["客服对话录音"],
    sourceWorkflows: [],
  },
];

// Demo graph data for knowledge graph visualization
const demoGraphNodes: KBGraphNode[] = [
  { id: "product", label: "产品", type: "entity", count: 2340 },
  { id: "brand", label: "品牌", type: "entity", count: 450 },
  { id: "category", label: "品类", type: "entity", count: 128 },
  { id: "attribute", label: "属性", type: "attribute", count: 3200 },
  { id: "sentiment", label: "情感", type: "label", count: 890 },
  { id: "user", label: "用户", type: "entity", count: 1632 },
];

const demoGraphRelations: KBGraphRelation[] = [
  { from: "product", to: "brand", label: "属于品牌", count: 2340 },
  { from: "product", to: "category", label: "归属品类", count: 2340 },
  { from: "product", to: "attribute", label: "具有属性", count: 8500 },
  { from: "user", to: "product", label: "评价了", count: 12500 },
  { from: "user", to: "sentiment", label: "表达情感", count: 12500 },
  { from: "attribute", to: "sentiment", label: "关联情感", count: 4200 },
];

const ontologyConcepts: OntologyConcept[] = [
  { id: "c-1", name: "商品", code: "Product", parent: null, status: "published", properties: ["商品ID", "名称", "品牌", "价格", "类目"], instances: 6230 },
  { id: "c-2", name: "品牌", code: "Brand", parent: null, status: "published", properties: ["品牌ID", "品牌名", "国家", "成立时间"], instances: 420 },
  { id: "c-3", name: "用户", code: "User", parent: null, status: "published", properties: ["用户ID", "等级", "地域"], instances: 15800 },
  { id: "c-4", name: "评价", code: "Review", parent: null, status: "draft", properties: ["评分", "情感极性", "文本", "时间"], instances: 0 },
  { id: "c-5", name: "手机", code: "MobilePhone", parent: "商品", status: "draft", properties: ["屏幕尺寸", "电池容量", "存储", "芯片型号"], instances: 0 },
];

const ontologyRelations: OntologyRelation[] = [
  { id: "r-1", name: "属于品牌", from: "商品", to: "品牌", cardinality: "N:1", status: "published" },
  { id: "r-2", name: "发布评价", from: "用户", to: "评价", cardinality: "1:N", status: "published" },
  { id: "r-3", name: "评价对象", from: "评价", to: "商品", cardinality: "N:1", status: "draft" },
  { id: "r-4", name: "子类", from: "手机", to: "商品", cardinality: "N:1", status: "draft" },
];

const ontologyRules = [
  { id: "rule-1", name: "唯一标识约束", level: "error", desc: "所有核心概念必须包含唯一标识属性。" },
  { id: "rule-2", name: "域值枚举约束", level: "warn", desc: "品牌国家建议使用标准国家编码（ISO-3166）。" },
  { id: "rule-3", name: "关系连通性检查", level: "error", desc: "每个业务核心概念至少连接一条业务关系。" },
  { id: "rule-4", name: "版本兼容检查", level: "info", desc: "删除属性前需确认下游流程无引用。" },
];

// --- Sub Components ---
type FilterType = "all" | KBType;

interface KnowledgeBaseDetailProps {
  kb: KnowledgeBase;
  onBack: () => void;
}

type KBDetailTab = "overview" | "entities" | "associations" | "settings";

function KnowledgeBaseDetail({ kb, onBack }: KnowledgeBaseDetailProps) {
  const [activeTab, setActiveTab] = useState<KBDetailTab>("overview");
  const tc = typeConfig[kb.type];
  const sc = statusConfig[kb.status];
  const TypeIcon = tc.icon;

  const tabs: { id: KBDetailTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "概览", icon: BarChart3 },
    { id: "entities", label: kb.type === "graph" ? "实体与关系" : "文档列表", icon: kb.type === "graph" ? Network : List },
    { id: "associations", label: "关联资源", icon: Link2 },
    { id: "settings", label: "配置", icon: Zap },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-6xl mx-auto w-full px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回知识库列表
        </button>

        {/* Header */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-border", tc.bg)}>
                <TypeIcon className={cn("h-6 w-6", tc.color)} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{kb.name}</h1>
                <p className="text-xs text-muted-foreground mt-1">{kb.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className={cn("inline-flex items-center gap-1", sc.color)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                    {sc.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {"更新于 "}{kb.updatedAt}
                  </span>
                  <span>{kb.creator}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                <Share2 className="h-3.5 w-3.5" />
                分享
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Brain className="h-3.5 w-3.5" />
                重新构建
              </button>
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
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-primary font-mono">{kb.documentCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground">文档数</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <Globe className="h-5 w-5 text-cyber-purple" />
                  <span className="text-lg font-bold text-cyber-purple font-mono">{kb.entityCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground">实体数</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <Link2 className="h-5 w-5 text-cyber-orange" />
                  <span className="text-lg font-bold text-cyber-orange font-mono">{kb.relationCount.toLocaleString()}</span>
                  <span className="text-[11px] text-muted-foreground">关系数</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-2">
                  <HardDrive className="h-5 w-5 text-cyber-neon" />
                  <span className="text-lg font-bold text-cyber-neon font-mono">{kb.totalSize}</span>
                  <span className="text-[11px] text-muted-foreground">总大小</span>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">基本信息</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-12 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">知识库类型</span>
                    <span className={cn("font-medium", tc.color)}>{tc.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">嵌入模型</span>
                    <span className="text-foreground font-mono">{kb.embeddingModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建时间</span>
                    <span className="text-foreground">{kb.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后更新</span>
                    <span className="text-foreground">{kb.updatedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建者</span>
                    <span className="text-foreground">{kb.creator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">标签</span>
                    <div className="flex gap-1">
                      {kb.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded bg-secondary/50 text-muted-foreground border-border/40">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Graph Visualization placeholder for graph type */}
              {kb.type === "graph" && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">图谱概览</h3>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                        <Plus className="h-3 w-3" />
                        添加实体
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                        <Network className="h-3 w-3" />
                        全屏查看
                      </button>
                    </div>
                  </div>
                  {/* Simple visual representation */}
                  <div className="relative bg-muted/30 rounded-lg p-6 min-h-[280px]">
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                      {demoGraphNodes.map((node, i) => {
                        const colors = ["bg-primary/15 text-primary border-primary/30", "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/30", "bg-cyber-orange/15 text-cyber-orange border-cyber-orange/30", "bg-cyber-neon/15 text-cyber-neon border-cyber-neon/30", "bg-cyber-pink/15 text-cyber-pink border-cyber-pink/30", "bg-primary/15 text-primary border-primary/30"];
                        return (
                          <div
                            key={node.id}
                            className={cn(
                              "flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border-2 transition-transform hover:scale-105 cursor-pointer",
                              colors[i % colors.length]
                            )}
                          >
                            <span className="text-sm font-semibold">{node.label}</span>
                            <span className="text-[10px] opacity-80">{node.count.toLocaleString()} 个</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6">
                      <h4 className="text-xs font-medium text-foreground mb-3">主要关系</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {demoGraphRelations.map((rel, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-card rounded-md px-3 py-2 border border-border/60 hover:border-primary/30 cursor-pointer transition-colors">
                            <span className="text-foreground font-medium">{demoGraphNodes.find(n => n.id === rel.from)?.label}</span>
                            <ChevronRight className="h-3 w-3 text-primary" />
                            <span className="text-primary">{rel.label}</span>
                            <ChevronRight className="h-3 w-3 text-primary" />
                            <span className="text-foreground font-medium">{demoGraphNodes.find(n => n.id === rel.to)?.label}</span>
                            <span className="ml-auto font-mono text-[10px]">{rel.count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vector Space Visualization for embedding type */}
              {kb.type === "embedding" && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Brain className="h-4 w-4 text-cyber-neon" />
                      向量空间概览
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                        <Search className="h-3 w-3" />
                        向量检索
                      </button>
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                        <Download className="h-3 w-3" />
                        导出向量
                      </button>
                    </div>
                  </div>
                  
                  {/* Vector Space Stats */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <div className="text-[10px] text-muted-foreground mb-1">向量维度</div>
                      <div className="text-sm font-bold text-cyber-neon font-mono">1536</div>
                    </div>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <div className="text-[10px] text-muted-foreground mb-1">总向量数</div>
                      <div className="text-sm font-bold text-primary font-mono">{kb.documentCount.toLocaleString()}</div>
                    </div>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <div className="text-[10px] text-muted-foreground mb-1">索引类型</div>
                      <div className="text-sm font-bold text-foreground">HNSW</div>
                    </div>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                      <div className="text-[10px] text-muted-foreground mb-1">平均检索延迟</div>
                      <div className="text-sm font-bold text-cyber-orange font-mono">12ms</div>
                    </div>
                  </div>

                  {/* Vector Space 2D Projection Visualization */}
                  <div className="relative bg-[oklch(0.15_0.01_260)] rounded-lg p-4 min-h-[240px] overflow-hidden">
                    {/* Grid background */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: "linear-gradient(oklch(0.4_0.01_260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.4_0.01_260) 1px, transparent 1px)",
                      backgroundSize: "30px 30px"
                    }} />
                    
                    {/* Cluster labels */}
                    <div className="absolute top-4 left-4 text-[9px] text-muted-foreground">t-SNE 2D 投影</div>
                    
                    {/* Simulated vector points - Cluster 1: News */}
                    <div className="absolute" style={{ top: "25%", left: "20%" }}>
                      <div className="relative">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <div
                            key={`c1-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-primary/70 hover:bg-primary hover:scale-150 transition-all cursor-pointer"
                            style={{
                              top: `${Math.sin(i * 0.8) * 25 + Math.random() * 15}px`,
                              left: `${Math.cos(i * 0.8) * 25 + Math.random() * 15}px`,
                            }}
                          />
                        ))}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium whitespace-nowrap">
                          财经新闻
                        </div>
                      </div>
                    </div>

                    {/* Cluster 2: Tech */}
                    <div className="absolute" style={{ top: "35%", left: "55%" }}>
                      <div className="relative">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                          <div
                            key={`c2-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-cyber-purple/70 hover:bg-cyber-purple hover:scale-150 transition-all cursor-pointer"
                            style={{
                              top: `${Math.sin(i * 0.6) * 30 + Math.random() * 20}px`,
                              left: `${Math.cos(i * 0.6) * 30 + Math.random() * 20}px`,
                            }}
                          />
                        ))}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple text-[9px] font-medium whitespace-nowrap">
                          科技资讯
                        </div>
                      </div>
                    </div>

                    {/* Cluster 3: Sports */}
                    <div className="absolute" style={{ top: "60%", left: "30%" }}>
                      <div className="relative">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={`c3-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-cyber-orange/70 hover:bg-cyber-orange hover:scale-150 transition-all cursor-pointer"
                            style={{
                              top: `${Math.sin(i * 1.0) * 20 + Math.random() * 10}px`,
                              left: `${Math.cos(i * 1.0) * 20 + Math.random() * 10}px`,
                            }}
                          />
                        ))}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-cyber-orange/20 text-cyber-orange text-[9px] font-medium whitespace-nowrap">
                          体育新闻
                        </div>
                      </div>
                    </div>

                    {/* Cluster 4: Entertainment */}
                    <div className="absolute" style={{ top: "55%", left: "70%" }}>
                      <div className="relative">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={`c4-${i}`}
                            className="absolute w-2 h-2 rounded-full bg-cyber-neon/70 hover:bg-cyber-neon hover:scale-150 transition-all cursor-pointer"
                            style={{
                              top: `${Math.sin(i * 0.9) * 22 + Math.random() * 12}px`,
                              left: `${Math.cos(i * 0.9) * 22 + Math.random() * 12}px`,
                            }}
                          />
                        ))}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-cyber-neon/20 text-cyber-neon text-[9px] font-medium whitespace-nowrap">
                          娱乐资讯
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />财经</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyber-purple" />科技</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyber-orange" />体育</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyber-neon" />娱乐</span>
                    </div>
                  </div>

                  {/* Similarity Search Demo */}
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <h4 className="text-xs font-medium text-foreground mb-3">语义相似度检索</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="输入查询文本，检索相似向量..."
                          className="pl-9 h-8 bg-muted/50 border-border text-xs"
                        />
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        检索
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { text: "央行宣布降准0.25个百分点，释放长期资金约5000亿元", similarity: 0.92, cluster: "财经新闻" },
                        { text: "A股三大指数集体收涨，沪指重返3000点", similarity: 0.89, cluster: "财经新闻" },
                        { text: "美联储维持利率不变，市场预期年内降息", similarity: 0.85, cluster: "财经新闻" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/60 bg-muted/20 hover:border-primary/30 cursor-pointer transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">{item.text}</p>
                            <span className="text-[10px] text-muted-foreground">{item.cluster}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-cyber-neon rounded-full" style={{ width: `${item.similarity * 100}%` }} />
                            </div>
                            <span className="text-xs font-mono text-cyber-neon">{(item.similarity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "entities" && (
            <div className="space-y-4">
              {kb.type === "graph" ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">实体列表</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{"共 "}{kb.entityCount.toLocaleString()}{" 个实体"}</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="搜索实体..." className="pl-9 h-8 w-48 bg-muted/50 border-border text-xs" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">实体名称</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">关联实体数</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">出现频次</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">来源文档</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "iPhone 15 Pro", type: "产品", relations: 156, freq: 2340, source: 680 },
                          { name: "Apple", type: "品牌", relations: 89, freq: 4520, source: 1200 },
                          { name: "电池续航", type: "属性", relations: 234, freq: 1890, source: 540 },
                          { name: "显示效果", type: "属性", relations: 189, freq: 1560, source: 420 },
                          { name: "正面评价", type: "情感", relations: 445, freq: 8900, source: 3200 },
                          { name: "Samsung Galaxy", type: "产品", relations: 120, freq: 1890, source: 520 },
                          { name: "性价比", type: "属性", relations: 310, freq: 3400, source: 890 },
                          { name: "华为", type: "品牌", relations: 95, freq: 3200, source: 980 },
                        ].map((entity, idx) => (
                          <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                            <td className="px-4 py-3 text-primary font-medium">{entity.name}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded">
                                {entity.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 font-mono">{entity.relations}</td>
                            <td className="px-4 py-3 font-mono">{entity.freq.toLocaleString()}</td>
                            <td className="px-4 py-3 font-mono">{entity.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">文档列表</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{"共 "}{kb.documentCount.toLocaleString()}{" 个文档"}</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="搜索文档..." className="pl-9 h-8 w-48 bg-muted/50 border-border text-xs" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">文档名称</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">大小</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">Chunks</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">索引时间</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "培训手册_2026Q1.pdf", type: "PDF", size: "2.4 MB", chunks: 156, time: "2026-02-28 10:30", status: "active" as KBStatus },
                          { name: "产品知识库_v3.docx", type: "DOCX", size: "1.8 MB", chunks: 89, time: "2026-02-27 14:20", status: "active" as KBStatus },
                          { name: "技术规范说明.md", type: "MD", size: "340 KB", chunks: 42, time: "2026-02-26 09:15", status: "active" as KBStatus },
                          { name: "FAQ常见问题.json", type: "JSON", size: "120 KB", chunks: 200, time: "2026-02-25 16:45", status: "active" as KBStatus },
                          { name: "会议纪要_0301.txt", type: "TXT", size: "45 KB", chunks: 18, time: "2026-03-01 11:00", status: "building" as KBStatus },
                        ].map((doc, idx) => {
                          const dsc = statusConfig[doc.status];
                          return (
                            <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 text-primary font-medium">{doc.name}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded">{doc.type}</Badge>
                              </td>
                              <td className="px-4 py-3 font-mono">{doc.size}</td>
                              <td className="px-4 py-3 font-mono">{doc.chunks}</td>
                              <td className="px-4 py-3">{doc.time}</td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", dsc.color)}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", dsc.dot)} />
                                  {dsc.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "associations" && (
            <div className="space-y-6">
              {/* Source Datasets */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  关联数据集
                </h3>
                {kb.sourceDatasets.length > 0 ? (
                  <div className="space-y-2">
                    {kb.sourceDatasets.map((ds) => (
                      <div key={ds} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60 bg-muted/20 hover:border-primary/30 cursor-pointer transition-colors">
                        <Database className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-foreground font-medium">{ds}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无关联数据集</p>
                )}
              </div>

              {/* Source Workflows */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-cyber-orange" />
                  关联工作流
                </h3>
                {kb.sourceWorkflows.length > 0 ? (
                  <div className="space-y-2">
                    {kb.sourceWorkflows.map((wf) => (
                      <div key={wf} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60 bg-muted/20 hover:border-primary/30 cursor-pointer transition-colors">
                        <Workflow className="h-4 w-4 text-cyber-orange flex-shrink-0" />
                        <span className="text-xs text-foreground font-medium">{wf}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">暂无关联工作流</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">构建配置</h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-12 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">嵌入模型</span>
                    <span className="text-foreground font-mono">{kb.embeddingModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">分块策略</span>
                    <span className="text-foreground">RecursiveCharacterTextSplitter</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chunk 大小</span>
                    <span className="text-foreground font-mono">512 tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chunk 重叠</span>
                    <span className="text-foreground font-mono">64 tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">向量维度</span>
                    <span className="text-foreground font-mono">1024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">索引类型</span>
                    <span className="text-foreground">HNSW</span>
                  </div>
                </div>
              </div>
              {kb.type === "graph" && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">图谱配置</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-12 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NER 模型</span>
                      <span className="text-foreground font-mono">gpt-4o</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">关系抽取模型</span>
                      <span className="text-foreground font-mono">gpt-4o</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">实体消歧</span>
                      <span className="text-foreground">启用</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">图数据库</span>
                      <span className="text-foreground">Neo4j</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OntologyModelingTab() {
  const [conceptSearch, setConceptSearch] = useState("");
  const [selectedConceptId, setSelectedConceptId] = useState<string>(ontologyConcepts[0]?.id ?? "");

  const concepts = useMemo(() => {
    if (!conceptSearch) return ontologyConcepts;
    return ontologyConcepts.filter((c) =>
      c.name.includes(conceptSearch) || c.code.toLowerCase().includes(conceptSearch.toLowerCase())
    );
  }, [conceptSearch]);

  const selectedConcept = concepts.find((c) => c.id === selectedConceptId) ?? concepts[0] ?? null;
  const publishedConceptCount = ontologyConcepts.filter((c) => c.status === "published").length;
  const publishedRelationCount = ontologyRelations.filter((r) => r.status === "published").length;

  return (
    <>
      <div className="flex-shrink-0 px-6 py-3 border-b border-border/60 flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Workflow className="h-3.5 w-3.5 text-primary" />
            概念 <span className="text-primary font-mono">{ontologyConcepts.length}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 text-cyber-purple" />
            关系 <span className="font-mono">{ontologyRelations.length}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-cyber-neon" />
            已发布 <span className="font-mono">{publishedConceptCount + publishedRelationCount}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-cyber-orange" />
            草稿 <span className="font-mono">{ontologyConcepts.length + ontologyRelations.length - publishedConceptCount - publishedRelationCount}</span>
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-3 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <List className="h-4 w-4 text-primary" />
                    概念树
                  </h3>
                  <button className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                    新增概念
                  </button>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={conceptSearch}
                    onChange={(e) => setConceptSearch(e.target.value)}
                    placeholder="搜索概念/编码"
                    className="h-8 pl-8 text-xs bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-1.5 max-h-[360px] overflow-auto pr-1">
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      onClick={() => setSelectedConceptId(concept.id)}
                      className={cn(
                        "w-full text-left rounded-md border px-3 py-2 transition-colors",
                        selectedConcept?.id === concept.id
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{concept.name}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded",
                            concept.status === "published"
                              ? "text-cyber-neon bg-cyber-neon/10"
                              : "text-cyber-orange bg-cyber-orange/10"
                          )}
                        >
                          {concept.status === "published" ? "已发布" : "草稿"}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">{concept.code}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyber-purple" />
                  建模质量
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-muted-foreground">
                      <span>概念覆盖率</span>
                      <span className="font-mono text-foreground">82%</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-muted-foreground">
                      <span>关系完整度</span>
                      <span className="font-mono text-foreground">74%</span>
                    </div>
                    <Progress value={74} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-muted-foreground">
                      <span>约束通过率</span>
                      <span className="font-mono text-foreground">91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-6 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Network className="h-4 w-4 text-primary" />
                    本体结构画布
                  </h3>
                  <div className="flex items-center gap-2">
                    <button className="text-[10px] px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      自动布局
                    </button>
                    <button className="text-[10px] px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                      语义校验
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 border border-border/60 p-4 min-h-[360px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ontologyConcepts.map((concept, idx) => {
                      const colors = [
                        "bg-primary/10 border-primary/30 text-primary",
                        "bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple",
                        "bg-cyber-orange/10 border-cyber-orange/30 text-cyber-orange",
                        "bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon",
                      ];
                      const color = colors[idx % colors.length];

                      return (
                        <div key={concept.id} className={cn("rounded-lg border p-3", color)}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold">{concept.name}</span>
                            <span className="text-[10px] font-mono opacity-80">{concept.code}</span>
                          </div>
                          <div className="text-[10px] opacity-80">属性 {concept.properties.length} / 实例 {concept.instances.toLocaleString()}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 border-t border-border/60 pt-3">
                    <h4 className="text-xs font-medium text-foreground mb-2">关系流</h4>
                    <div className="space-y-1.5">
                      {ontologyRelations.map((rel) => (
                        <div key={rel.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[11px]">
                          <span className="text-foreground font-medium">{rel.from}</span>
                          <ChevronRight className="h-3 w-3 text-primary" />
                          <span className="text-primary">{rel.name}</span>
                          <ChevronRight className="h-3 w-3 text-primary" />
                          <span className="text-foreground font-medium">{rel.to}</span>
                          <span className="ml-auto text-muted-foreground font-mono">{rel.cardinality}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-cyber-orange" />
                  属性与约束
                </h3>
                {selectedConcept ? (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <div className="text-foreground font-medium">{selectedConcept.name}</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">编码：<span className="font-mono">{selectedConcept.code}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedConcept.properties.map((prop) => (
                        <div key={prop} className="rounded-md border border-border px-2.5 py-2 bg-card text-[11px] text-foreground">
                          {prop}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-md border border-cyber-purple/20 bg-cyber-purple/5 px-3 py-2 text-[11px] text-cyber-purple">
                      建议：为关键属性（如 ID、Code）添加唯一约束，并为时间字段添加格式校验。
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">暂无可展示概念。</div>
                )}
              </div>
            </div>

            <div className="xl:col-span-3 space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-cyber-neon" />
                  关系建模
                </h3>
                <div className="space-y-2">
                  {ontologyRelations.map((rel) => (
                    <div key={rel.id} className="rounded-md border border-border px-3 py-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{rel.name}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", rel.status === "published" ? "text-cyber-neon bg-cyber-neon/10" : "text-cyber-orange bg-cyber-orange/10")}>{rel.status === "published" ? "发布" : "草稿"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{rel.from} → {rel.to} · {rel.cardinality}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  发布前检查
                </h3>
                <div className="space-y-2.5">
                  {ontologyRules.map((rule) => (
                    <div key={rule.id} className="rounded-md border border-border px-3 py-2 bg-card text-[11px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("w-1.5 h-1.5 rounded-full", rule.level === "error" ? "bg-destructive" : rule.level === "warn" ? "bg-cyber-orange" : "bg-primary")} />
                        <span className="font-medium text-foreground">{rule.name}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyber-purple" />
                  版本记录
                </h3>
                <div className="space-y-2 text-[11px]">
                  <div className="rounded-md border border-border px-3 py-2 bg-muted/20">
                    <div className="text-foreground font-medium">v1.3.0 · 发布</div>
                    <div className="text-muted-foreground mt-0.5">新增「评价」概念及关系约束，更新 6 项属性定义。</div>
                  </div>
                  <div className="rounded-md border border-border px-3 py-2 bg-muted/20">
                    <div className="text-foreground font-medium">v1.2.1 · 草稿</div>
                    <div className="text-muted-foreground mt-0.5">补充手机子类属性模板，待校验。</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}

// --- Main Component ---
export function KnowledgeBaseManagement() {
  const [mainTab, setMainTab] = useState<OntologyMainTab>("knowledge-bases");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKBType, setNewKBType] = useState<KBType>("embedding");
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");

  const { kbs: rawKbs, loading, remove, create } = useKnowledgeBases();
  const allKbs: KnowledgeBase[] = rawKbs.map((item) => ({
    ...adaptKnowledgeBase(item),
    creator: "system",
    tags: [],
    sourceDatasets: [],
    sourceWorkflows: [],
  } as KnowledgeBase));

  const filtered = useMemo(() => {
    let result = allKbs;
    if (filterType !== "all") result = result.filter((kb) => kb.type === filterType);
    if (search) result = result.filter((kb) => kb.name.includes(search) || kb.description.includes(search));
    return result;
  }, [search, filterType, allKbs]);

  const typeFilters: { id: FilterType; label: string }[] = [
    { id: "all", label: "全部" },
    { id: "graph", label: "知识图谱" },
    { id: "embedding", label: "向量知识库" },
  ];

  const totalStats = {
    total: allKbs.length,
    active: allKbs.filter((k) => k.status === "active").length,
    building: allKbs.filter((k) => k.status === "building").length,
    totalEntities: allKbs.reduce((s, k) => s + k.entityCount, 0),
  };

  if (selectedKB) {
    return <KnowledgeBaseDetail kb={selectedKB} onBack={() => setSelectedKB(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-5 mb-4 border-b border-border/60">
            {[
              { id: "knowledge-bases" as const, label: "知识库管理", icon: Database },
              { id: "ontology" as const, label: "本体建模", icon: Workflow },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 pb-3 text-xs font-medium transition-colors",
                  mainTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {mainTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {mainTab === "knowledge-bases" ? "知识库管理" : "本体建模"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mainTab === "knowledge-bases" ? (
                  <>
                    {"管理知识库和知识图谱，共 "}
                    <span className="text-primary font-mono">{totalStats.total}</span>
                    {" 个知识库"}
                  </>
                ) : (
                  "定义领域概念、关系、属性与约束，支持校验发布与版本演进"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mainTab === "knowledge-bases" ? (
                <>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                    <Download className="h-3.5 w-3.5" />
                    导入知识库
                  </button>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    新建知识库
                  </button>
                </>
              ) : (
                <>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    语义校验
                  </button>
                  <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <GitBranch className="h-3.5 w-3.5" />
                    发布本体
                  </button>
                </>
              )}
            </div>
          </div>

          {mainTab === "knowledge-bases" && (
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
          )}
        </div>
      </header>

      {mainTab === "knowledge-bases" ? (
        <>
          <div className="flex-shrink-0 px-6 py-3 border-b border-border/60 flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                {"共 "}<span className="text-primary font-mono">{totalStats.total}</span>{" 个"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon" />
                {"活跃 "}<span className="font-mono">{totalStats.active}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-orange animate-pulse" />
                {"构建中 "}<span className="font-mono">{totalStats.building}</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                {"共 "}<span className="font-mono">{totalStats.totalEntities.toLocaleString()}</span>{" 个实体"}
              </span>
            </div>
            <div className="ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="搜索知识库..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 w-56 bg-muted/50 border-border focus-visible:ring-primary/30 text-xs placeholder:text-muted-foreground/60" />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filtered.map((kb) => {
                const tc = typeConfig[kb.type];
                const sc = statusConfig[kb.status];
                const TypeIcon = tc.icon;
                return (
                  <div
                    key={kb.id}
                    onClick={() => setSelectedKB(kb)}
                    className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,150,150,0.06)] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border border-border", tc.bg)}>
                          <TypeIcon className={cn("h-4 w-4", tc.color)} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-foreground leading-tight">{kb.name}</h3>
                          <span className="text-[10px] text-muted-foreground">{kb.creator}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === kb.id ? null : kb.id); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {contextMenu === kb.id && (
                          <div className="absolute right-0 top-7 z-10 w-32 py-1 rounded-lg border border-border bg-card shadow-lg">
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); setSelectedKB(kb); }}>
                              <Eye className="h-3 w-3" /> 查看详情
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}>
                              <Pencil className="h-3 w-3" /> 编辑
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); remove(kb.id); }}>
                              <Trash2 className="h-3 w-3" /> 删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{kb.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal rounded border", tc.color, tc.bg.replace("/10", "/5"))}>{tc.label}</Badge>
                      {kb.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded bg-secondary/50 text-muted-foreground border-border/40">{tag}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {kb.documentCount.toLocaleString()} 文档
                        </span>
                        {kb.entityCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {kb.entityCount.toLocaleString()} 实体
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {kb.totalSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", sc.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg bg-card/50">
                  <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">没有匹配的知识库</p>
                  <p className="text-xs text-muted-foreground/60">尝试调整搜索或筛选条件</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <OntologyModelingTab />
      )}

      {/* Create Knowledge Base Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowCreateDialog(false)}
          />
          
          {/* Dialog */}
          <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">新建知识库</h2>
                <p className="text-xs text-muted-foreground mt-0.5">创建向量知识库或知识图谱</p>
              </div>
              <button 
                onClick={() => setShowCreateDialog(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">知识库类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["embedding", "graph"] as KBType[]).map((type) => {
                    const cfg = typeConfig[type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setNewKBType(type)}
                        className={cn(
                          "relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left",
                          newKBType === type 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/40 bg-card"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", cfg.bg)}>
                          <Icon className={cn("h-4.5 w-4.5", cfg.color)} />
                        </div>
                        <span className="text-sm font-medium text-foreground">{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{cfg.description}</span>
                        {newKBType === type && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">知识库名称</label>
                <Input
                  placeholder={newKBType === "embedding" ? "例如：产品文档向量库" : "例如：电商领域知识图谱"}
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  className="h-9 bg-muted/50 border-border"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">描述 (可选)</label>
                <textarea
                  placeholder="简要描述知识库的用途和内容..."
                  value={newKBDescription}
                  onChange={(e) => setNewKBDescription(e.target.value)}
                  className="w-full h-20 px-3 py-2 text-sm rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Embedding Model (only for embedding type) */}
              {newKBType === "embedding" && (
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">向量模型</label>
                  <select className="w-full h-9 px-3 text-sm rounded-md border border-border bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="text-embedding-3-large">OpenAI text-embedding-3-large (3072维)</option>
                    <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536维)</option>
                    <option value="bge-large-zh">BGE-Large-ZH (1024维)</option>
                    <option value="m3e-base">M3E-Base (768维)</option>
                  </select>
                </div>
              )}

              {/* Graph Config (only for graph type) */}
              {newKBType === "graph" && (
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">图数据库</label>
                  <select className="w-full h-9 px-3 text-sm rounded-md border border-border bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="neo4j">Neo4j</option>
                    <option value="nebula">NebulaGraph</option>
                    <option value="janusgraph">JanusGraph</option>
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border hover:border-primary/40 transition-colors"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  await create({
                    name: newKBName.trim(),
                    description: newKBDescription.trim(),
                    vector_store: newKBType === "embedding" ? "chromadb" : "graph",
                  });
                  setShowCreateDialog(false);
                  setNewKBName("");
                  setNewKBDescription("");
                }}
                disabled={!newKBName.trim()}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-md transition-colors",
                  newKBName.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                创建知识库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
