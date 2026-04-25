"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Image,
  Headphones,
  Video,
  LayoutGrid,
  Download,
  Tags,
  ScanSearch,
  TextSearch,
  ScanEye,
  AudioLines,
  Film,
  Merge,
  ShieldCheck,
  Combine,
  RadioTower,
  WandSparkles,
  Volume2,
  PenTool,
  Lightbulb,
  MessageSquare,
  FileVideo,
  BookOpen,
  Brush,
  Check,
  Plus,
  Clock,
  GitBranch,
  Code2,
  BookMarked,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Operator } from "@/lib/operators";
import { categories } from "@/lib/operators";
import { operatorConfigFields } from "@/lib/workflows";

const iconMap: Record<string, React.ElementType> = {
  FileText, Image, Headphones, Video, LayoutGrid, Download, Tags,
  ScanSearch, TextSearch, ScanEye, AudioLines, Film, Merge, ShieldCheck,
  Combine, RadioTower, WandSparkles, Volume2, PenTool, Lightbulb,
  MessageSquare, FileVideo, BookOpen, Brush,
};

type DetailTab = "overview" | "specs" | "docs" | "changelog";

// Extended operator info for detail page
const operatorExtendedInfo: Record<string, {
  inputFormats: string[];
  outputFormats: string[];
  author: string;
  license: string;
  dependencies: string[];
  changelog: { version: string; date: string; changes: string[] }[];
  documentation: string;
}> = {
  default: {
    inputFormats: [".txt", ".md", ".json", ".csv", ".doc", ".docx", ".pdf"],
    outputFormats: [".txt", ".md", ".json", ".csv", ".doc", ".docx", ".pdf"],
    author: "DataMate Team",
    license: "Apache 2.0",
    dependencies: ["Python 3.10+", "DataMate SDK"],
    changelog: [
      { version: "1.0.0", date: "2026-02-24", changes: ["初始版本发布", "支持基本功能"] },
    ],
    documentation: "该算子提供高效的数据处理能力，支持多种输入输出格式。可通过配置参数自定义处理逻辑。",
  },
};

const categoryTagColors: Record<string, string> = {
  input: "bg-primary/10 text-primary border-primary/20",
  output: "bg-cyber-neon/10 text-cyber-neon border-cyber-neon/20",
  annotation: "bg-cyber-orange/10 text-cyber-orange border-cyber-orange/20",
  "feature-extraction": "bg-cyber-neon/10 text-cyber-neon border-cyber-neon/20",
  evaluation: "bg-primary/10 text-primary border-primary/20",
  "data-aggregation": "bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20",
  "data-synthesis": "bg-cyber-pink/10 text-cyber-pink border-cyber-pink/20",
  "knowledge-generation": "bg-primary/10 text-primary border-primary/20",
  "image-construction": "bg-cyber-orange/10 text-cyber-orange border-cyber-orange/20",
};

interface OperatorDetailProps {
  operator: Operator;
  onBack: () => void;
}

export function OperatorDetail({ operator, onBack }: OperatorDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [isInstalled, setIsInstalled] = useState(operator.installed);

  const Icon = iconMap[operator.icon];
  const extInfo = operatorExtendedInfo.default;
  const categoryLabel = categories.find((c) => c.id === operator.category)?.label || "";
  const configFields = operatorConfigFields[operator.id] || [];

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "概览" },
    { id: "specs", label: "系统规格" },
    { id: "docs", label: "文档" },
    { id: "changelog", label: "更新日志" },
  ];

  const inputTypeLabel = operator.category.includes("image") ? "image" : operator.category.includes("audio") ? "audio" : operator.category.includes("video") ? "video" : "text";
  const outputTypeLabel = inputTypeLabel;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-5xl mx-auto w-full px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            onClick={onBack}
            className="hover:text-foreground transition-colors"
          >
            算子市场
          </button>
          <span>/</span>
          <span className="text-foreground">{operator.name}</span>
        </div>

        {/* Header Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center border bg-primary/[0.06] border-primary/20"
              )}
            >
              {Icon && <Icon className={cn("h-7 w-7", operator.iconColor)} />}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {operator.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {operator.description}
                  </p>
                </div>
                <button
                  onClick={() => setIsInstalled(!isInstalled)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    isInstalled
                      ? "text-primary bg-primary/10 border border-primary/25"
                      : "text-muted-foreground bg-muted border border-border hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {isInstalled ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      已安装
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      安装
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-primary" />
                  {operator.version}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  2026-02-24 17:27:05
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-lg border border-border bg-card">
          <div className="px-6 pt-4 border-b border-border">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative pb-3 text-xs font-medium transition-colors",
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[400px]">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    基本信息
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">版本</span>
                      <span className="text-foreground font-mono">{operator.version.replace("v", "")}</span>
                    </div>
                    <div className="flex items-start justify-between text-xs">
                      <span className="text-muted-foreground">分类</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[inputTypeLabel === "text" ? "文本" : inputTypeLabel === "image" ? "图像" : inputTypeLabel === "audio" ? "音频" : "视频", "Python", categoryLabel, "系统预置", "DataMate"].map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground border-border"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">输入类型</span>
                      <span className="text-foreground">{inputTypeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">创建时间</span>
                      <span className="text-foreground">2026-02-24 17:27:05</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">输出类型</span>
                      <span className="text-foreground">{outputTypeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">最后修改</span>
                      <span className="text-foreground">2026-02-24 17:27:05</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    描述
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {operator.description}{"。"}
                  </p>
                </div>

                {/* Supported Formats */}
                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    支持格式
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-3">
                        输入格式
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {extInfo.inputFormats.map((fmt) => (
                          <span
                            key={fmt}
                            className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-mono bg-primary/[0.06] text-primary border border-primary/15"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-3">
                        输出格式
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {extInfo.outputFormats.map((fmt) => (
                          <span
                            key={fmt}
                            className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-mono bg-primary/[0.06] text-primary border border-primary/15"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-6">
                {/* System Info */}
                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    系统要求
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-12 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">运行环境</span>
                      <span className="text-foreground">
                        {operator.tags.includes("LLM") ? "云端 (LLM API)" :
                         operator.tags.includes("LOCAL GPU") ? "本地 (GPU)" : "本地 (CPU)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">依赖</span>
                      <span className="text-foreground">{extInfo.dependencies.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">作者</span>
                      <span className="text-foreground">{extInfo.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">许可证</span>
                      <span className="text-foreground">{extInfo.license}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">输入端口</span>
                      <span className="text-foreground font-mono">{operator.inputs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">输出端口</span>
                      <span className="text-foreground font-mono">{operator.outputs}</span>
                    </div>
                  </div>
                </div>

                {/* Config Fields */}
                {configFields.length > 0 && (
                  <div className="rounded-lg border border-border p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      配置参数
                    </h3>
                    <div className="space-y-3">
                      {configFields.map((field) => (
                        <div
                          key={field.key}
                          className="flex items-start justify-between py-2 border-b border-border/50 last:border-0"
                        >
                          <div>
                            <span className="text-xs font-medium text-foreground">
                              {field.label}
                            </span>
                            {field.description && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {field.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {field.type}
                            </span>
                            <p className="text-[11px] text-foreground mt-0.5 font-mono">
                              {"默认: "}
                              {String(field.defaultValue) || "--"}
                            </p>
                            {field.options && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {"可选: "}
                                {field.options.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    使用说明
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {extInfo.documentation}
                    </p>
                    <h4 className="text-xs font-semibold text-foreground mb-2">快速开始</h4>
                    <div className="rounded-md bg-[oklch(0.15_0.01_260)] p-4 font-mono text-[11px] text-[oklch(0.85_0.005_260)] leading-6">
                      <div className="text-[oklch(0.6_0.01_260)]"># 在工作流中添加该算子</div>
                      <div>
                        {"from datamate.ops import "}
                        {operator.id.replace(/-/g, "_")}
                      </div>
                      <div className="mt-2 text-[oklch(0.6_0.01_260)]"># 配置参数</div>
                      <div>
                        {"op = "}
                        {operator.id.replace(/-/g, "_")}
                        {"("}
                      </div>
                      {configFields.slice(0, 3).map((f) => (
                        <div key={f.key} className="pl-4">
                          {f.key}
                          {"="}
                          {typeof f.defaultValue === "string" ? `"${f.defaultValue}"` : String(f.defaultValue)}
                          {","}
                        </div>
                      ))}
                      <div>{")"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    注意事项
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      确保输入数据格式与算子支持的格式匹配
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      大文件处理时建议启用批处理模式以优化性能
                    </li>
                    <li className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {operator.tags.includes("LLM") ? "使用 LLM 功能需要配置有效的 API Key" : "确保运行环境满足系统要求"}
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "changelog" && (
              <div className="space-y-4">
                {extInfo.changelog.map((entry) => (
                  <div
                    key={entry.version}
                    className="rounded-lg border border-border p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-semibold text-foreground">
                        v{entry.version}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.date}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {entry.changes.map((change, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
