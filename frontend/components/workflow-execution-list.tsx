"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  History,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedWorkflow } from "@/lib/workflows";
import type { WorkflowExecution } from "@/lib/api";
import { useWorkflowExecutions } from "@/hooks/use-workflows";

interface WorkflowExecutionListProps {
  workflow: SavedWorkflow;
  onBack: () => void;
  onSelectExecution: (execution: WorkflowExecution) => void;
}

const statusConfig = {
  completed: {
    label: "已完成",
    color: "text-cyber-neon",
    bg: "bg-cyber-neon/10",
    border: "border-cyber-neon/30",
    icon: CheckCircle2,
    dotColor: "bg-cyber-neon",
  },
  failed: {
    label: "失败",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    icon: XCircle,
    dotColor: "bg-destructive",
  },
  running: {
    label: "运行中",
    color: "text-cyber-orange",
    bg: "bg-cyber-orange/10",
    border: "border-cyber-orange/30",
    icon: Loader2,
    dotColor: "bg-cyber-orange",
  },
  pending: {
    label: "等待中",
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    icon: Clock,
    dotColor: "bg-muted-foreground",
  },
};

export function WorkflowExecutionList({
  workflow,
  onBack,
  onSelectExecution,
}: WorkflowExecutionListProps) {
  const { executions, loading } = useWorkflowExecutions(workflow.id);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-6xl mx-auto w-full px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回工作流列表
        </button>

        {/* Workflow Header */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {workflow.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {workflow.description}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>{workflow.nodeCount} 个算子</span>
                <span>{"创建于 "}
                  {new Date(workflow.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Play className="h-3.5 w-3.5" />
              运行工作流
            </button>
          </div>
        </div>

        {/* Execution History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              执行历史
            </h2>
            <span className="text-xs text-muted-foreground ml-1">
              {"共 "}
              {executions.length}
              {" 次执行"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">加载执行记录…</span>
            </div>
          ) : executions.length > 0 ? (
            <div className="space-y-3">
              {executions.map((exec) => {
                const statusKey = exec.status === "error" ? "failed" : (exec.status as keyof typeof statusConfig);
                const st = statusConfig[statusKey] ?? statusConfig.pending;
                const StIcon = st.icon;

                // 计算耗时
                const duration = (() => {
                  if (!exec.started_at) return "—";
                  const end = exec.finished_at ? new Date(exec.finished_at) : new Date();
                  const secs = Math.round((end.getTime() - new Date(exec.started_at).getTime()) / 1000);
                  if (secs < 60) return `${secs}s`;
                  const mins = Math.floor(secs / 60);
                  return `${mins}m ${secs % 60}s`;
                })();

                const startDisplay = exec.started_at
                  ? new Date(exec.started_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : new Date(exec.created_at).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });

                return (
                  <button
                    key={exec.id}
                    onClick={() => onSelectExecution(exec)}
                    className="w-full text-left group rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,150,150,0.06)] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0",
                          st.bg,
                          st.border
                        )}
                      >
                        <StIcon
                          className={cn(
                            "h-5 w-5",
                            st.color,
                            exec.status === "running" && "animate-spin"
                          )}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                              st.bg,
                              st.color
                            )}
                          >
                            {st.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            {exec.id.slice(0, 8)}…
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {startDisplay}
                          </span>
                          {exec.started_at && (
                            <span>耗时 {duration}</span>
                          )}
                          {exec.error && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              {exec.error.slice(0, 40)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg bg-card/50">
              <History className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                暂无执行记录
              </p>
              <p className="text-xs text-muted-foreground/60">
                点击上方"运行工作流"开始第一次执行
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
