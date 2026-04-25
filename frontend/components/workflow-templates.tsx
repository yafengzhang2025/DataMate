"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  Video,
  WandSparkles,
  Lightbulb,
  LayoutGrid,
  ArrowRight,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  MoreHorizontal,
  Trash2,
  Copy,
  Pencil,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  workflowTemplates,
  type WorkflowTemplate,
  type SavedWorkflow,
} from "@/lib/workflows";
import { useWorkflows } from "@/hooks/use-workflows";
import { adaptWorkflow } from "@/lib/adapters";

const templateIconMap: Record<string, React.ElementType> = {
  FileText, Image, Video, WandSparkles, Lightbulb, LayoutGrid,
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  draft: { label: "草稿", icon: FileEdit, color: "text-muted-foreground", bg: "bg-muted" },
  running: { label: "运行中", icon: Play, color: "text-cyber-orange", bg: "bg-cyber-orange/10" },
  completed: { label: "已完成", icon: CheckCircle2, color: "text-cyber-neon", bg: "bg-cyber-neon/10" },
  error: { label: "异常", icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

interface WorkflowTemplatesProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
  onCreateNew: () => void;
  onOpenWorkflow: (workflow: SavedWorkflow) => void;
}

export function WorkflowTemplates({
  onSelectTemplate,
  onCreateNew,
  onOpenWorkflow,
}: WorkflowTemplatesProps) {
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const { workflows: rawWorkflows, loading, remove } = useWorkflows();
  const savedWorkflows = rawWorkflows.map(adaptWorkflow);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${h}:${m}`;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-6xl mx-auto w-full px-8 py-8 space-y-10">

        {/* Section: My Workflows */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">我的工作流</h2>
              <p className="text-xs text-muted-foreground mt-0.5">管理和运行已创建的数据处理流水线</p>
            </div>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              新建工作流
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-sm">加载中...</span>
            </div>
          ) : savedWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Create new card */}
              <button
                onClick={onCreateNew}
                className="group flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border bg-card/50 hover:border-primary/40 hover:bg-primary/[0.02] transition-all min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">从空白创建</span>
              </button>

              {savedWorkflows.map((wf) => {
                const st = statusConfig[wf.status] || statusConfig.draft;
                const StIcon = st.icon;
                return (
                  <div
                    key={wf.id}
                    className="group relative flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,150,150,0.06)] transition-all cursor-pointer"
                    onClick={() => onOpenWorkflow(wf as unknown as SavedWorkflow)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{wf.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{wf.description}</p>
                      </div>
                      <div className="relative ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu === wf.id ? null : wf.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {contextMenu === wf.id && (
                          <div className="absolute right-0 top-7 z-10 w-32 py-1 rounded-lg border border-border bg-card shadow-lg">
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}>
                              <Pencil className="h-3 w-3" /> 编辑
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}>
                              <Copy className="h-3 w-3" /> 复制
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenu(null); remove(wf.id); }}>
                              <Trash2 className="h-3 w-3" /> 删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border/60">
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", st.bg, st.color)}>
                        <StIcon className="h-3 w-3" />
                        {st.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{wf.nodeCount} 个算子</span>
                      <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(wf.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg bg-card/50">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">还没有创建工作流</p>
              <button
                onClick={onCreateNew}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                创建第一个工作流
              </button>
            </div>
          )}
        </section>

        {/* Section: Templates */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">工作流模板</h2>
            <p className="text-xs text-muted-foreground mt-0.5">从预构建的模板快速开始，可直接使用或自定义修改</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {workflowTemplates.map((template) => {
              const Icon = templateIconMap[template.icon] || FileText;
              return (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="group relative flex items-start gap-4 p-5 rounded-lg border border-border bg-card text-left transition-all duration-200 hover:border-primary/40 hover:shadow-[0_2px_12px_rgba(0,150,150,0.06)]"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/[0.06] border border-primary/15 group-hover:bg-primary/10 group-hover:border-primary/25 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-medium text-primary/80 bg-primary/[0.06] px-1.5 py-0.5 rounded">{template.categoryLabel}</span>
                      <span className="text-[10px] text-muted-foreground">{template.operatorCount} 个算子</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{template.description}</p>
                  </div>
                  <ArrowRight className="flex-shrink-0 h-4 w-4 text-muted-foreground/0 group-hover:text-primary/60 transition-all mt-3 -translate-x-1 group-hover:translate-x-0" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
