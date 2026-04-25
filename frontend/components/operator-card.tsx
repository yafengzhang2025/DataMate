"use client";

import { useState } from "react";
import {
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
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Operator } from "@/lib/operators";

const iconMap: Record<string, React.ElementType> = {
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
};

const tagColorMap: Record<string, string> = {
  LLM: "bg-cyber-glow/15 text-cyber-glow border-cyber-glow/25",
  "LOCAL CPU": "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/25",
  "LOCAL GPU": "bg-cyber-orange/15 text-cyber-orange border-cyber-orange/25",
  输入: "bg-cyber-glow/15 text-cyber-glow border-cyber-glow/25",
  输出: "bg-cyber-neon/15 text-cyber-neon border-cyber-neon/25",
  标注: "bg-cyber-orange/15 text-cyber-orange border-cyber-orange/25",
  特征提取: "bg-cyber-neon/15 text-cyber-neon border-cyber-neon/25",
  评估: "bg-cyber-glow/15 text-cyber-glow border-cyber-glow/25",
  数据聚合: "bg-cyber-purple/15 text-cyber-purple border-cyber-purple/25",
  数据合成: "bg-cyber-pink/15 text-cyber-pink border-cyber-pink/25",
  知识生成: "bg-cyber-glow/15 text-cyber-glow border-cyber-glow/25",
  图像构建: "bg-cyber-orange/15 text-cyber-orange border-cyber-orange/25",
};

interface OperatorCardProps {
  operator: Operator;
}

export function OperatorCard({ operator }: OperatorCardProps) {
  const [isInstalled, setIsInstalled] = useState(operator.installed);
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[operator.icon];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex flex-col rounded-lg border transition-all duration-300 overflow-hidden",
        "bg-card backdrop-blur-sm",
        isHovered
          ? "border-primary/50 shadow-[0_2px_16px_rgba(0,150,150,0.10)]"
          : "border-border hover:border-border/80"
      )}
    >
      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
          "bg-[radial-gradient(ellipse_at_top,var(--cyber-glow)_0%,transparent_70%)]",
          isHovered && "opacity-[0.04]"
        )}
      />

      <div className="relative p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                "bg-muted/80 border border-border",
                isHovered && "border-primary/40 bg-primary/5"
              )}
            >
              {Icon && (
                <Icon className={cn("h-4 w-4", operator.iconColor)} />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-foreground leading-tight">
                {operator.name}
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">
                {operator.version}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsInstalled(!isInstalled)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all",
              isInstalled
                ? "text-primary bg-primary/10 border border-primary/25"
                : "text-muted-foreground bg-muted border border-border hover:border-primary/40 hover:text-primary"
            )}
          >
            {isInstalled ? (
              <>
                <Check className="h-3 w-3" />
                <span>已安装</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                <span>安装</span>
              </>
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {operator.description}
        </p>

        {/* Tags & IO */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {operator.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-normal rounded",
                  tagColorMap[tag] || "bg-secondary/50 text-muted-foreground border-border/40"
                )}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-shrink-0 ml-2">
            <span className="flex items-center gap-0.5">
              <ArrowRight className="h-2.5 w-2.5" />
              {operator.inputs}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowLeft className="h-2.5 w-2.5" />
              {operator.outputs}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
