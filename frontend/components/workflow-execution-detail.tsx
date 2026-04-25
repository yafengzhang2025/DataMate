"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileText,
  Terminal,
  Download,
  RefreshCw,
  Loader2,
  XCircle,
  ChevronRight,
  Copy,
  Check,
  Search,
  Database,
  GitBranch,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { WorkflowExecution, OperatorExecution } from "@/lib/workflows";

// Normalize raw API execution data (which may be missing mock fields) into the full WorkflowExecution shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeExecution(e: any): WorkflowExecution {
  const started: string | null = e.started_at ?? e.startTime ?? null;
  const finished: string | null = e.finished_at ?? e.endTime ?? null;

  let totalDuration: string = e.totalDuration ?? "--";
  if (!e.totalDuration && started && finished) {
    const ms = new Date(finished).getTime() - new Date(started).getTime();
    if (!isNaN(ms)) {
      const s = Math.round(ms / 1000);
      totalDuration = s < 60 ? `${s} 秒` : `${Math.round(s / 60)} 分钟`;
    }
  }

  // Map API "error" status to component "failed"
  const rawStatus = e.status ?? "pending";
  const status: WorkflowExecution["status"] =
    rawStatus === "error" ? "failed" : rawStatus;

  return {
    id: e.id ?? "",
    workflowId: e.workflowId ?? e.workflow_id ?? "",
    workflowName: e.workflowName ?? "工作流执行",
    status,
    startTime: started ? new Date(started).toLocaleString("zh-CN") : "--",
    endTime: finished ? new Date(finished).toLocaleString("zh-CN") : "--",
    totalDuration,
    successFiles: e.successFiles ?? 0,
    failedFiles: e.failedFiles ?? 0,
    totalFiles: e.totalFiles ?? 0,
    successRate: e.successRate ?? "--",
    taskId: e.taskId ?? e.id ?? "",
    description: e.description ?? (e.error ? `错误: ${e.error}` : "--"),
    sourceDataset: e.sourceDataset ?? "--",
    targetDataset: e.targetDataset ?? "--",
    retryCount: e.retryCount ?? 0,
    operators: e.operators ?? [],
    processedFiles: e.processedFiles ?? [],
    logs: e.logs ?? [],
  };
}

interface WorkflowExecutionDetailProps {
  // Accept both the mock type and the real API type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execution: any;
  onBack: () => void;
}

type DetailTab = "overview" | "files" | "logs";

const statusConfig = {
  completed: { label: "已完成", color: "text-cyber-neon", bg: "bg-cyber-neon/10", border: "border-cyber-neon/30", icon: CheckCircle2, dotColor: "bg-cyber-neon" },
  failed: { label: "失败", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: XCircle, dotColor: "bg-destructive" },
  running: { label: "运行中", color: "text-cyber-orange", bg: "bg-cyber-orange/10", border: "border-cyber-orange/30", icon: Loader2, dotColor: "bg-cyber-orange" },
  pending: { label: "等待中", color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: Clock, dotColor: "bg-muted-foreground" },
  processing: { label: "处理中", color: "text-cyber-orange", bg: "bg-cyber-orange/10", border: "border-cyber-orange/30", icon: Loader2, dotColor: "bg-cyber-orange" },
};

const logLevelConfig = {
  INFO: { color: "text-primary", tag: "text-primary bg-primary/10" },
  WARN: { color: "text-cyber-orange", tag: "text-cyber-orange bg-cyber-orange/10" },
  ERROR: { color: "text-destructive", tag: "text-destructive bg-destructive/10" },
  SUCCESS: { color: "text-cyber-neon", tag: "text-cyber-neon bg-cyber-neon/10" },
};

const branchColors = [
  { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary", line: "bg-primary" },
  { bg: "bg-cyber-purple/10", border: "border-cyber-purple/30", text: "text-cyber-purple", line: "bg-cyber-purple" },
  { bg: "bg-cyber-orange/10", border: "border-cyber-orange/30", text: "text-cyber-orange", line: "bg-cyber-orange" },
  { bg: "bg-cyber-neon/10", border: "border-cyber-neon/30", text: "text-cyber-neon", line: "bg-cyber-neon" },
];

interface ParallelGroup {
  groupId: number;
  isParallel: boolean;
  branches: { branchId: string; branchName: string; operators: OperatorExecution[] }[];
}

function groupOperatorsByParallel(operators: OperatorExecution[]): ParallelGroup[] {
  const groups: Map<number, OperatorExecution[]> = new Map();
  
  operators.forEach((op) => {
    const groupId = op.parallelGroup ?? 0;
    if (!groups.has(groupId)) {
      groups.set(groupId, []);
    }
    groups.get(groupId)!.push(op);
  });

  const result: ParallelGroup[] = [];
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);

  for (const [groupId, ops] of sortedGroups) {
    const branches: Map<string, OperatorExecution[]> = new Map();
    
    ops.forEach((op) => {
      const branchId = op.branchId || "main";
      if (!branches.has(branchId)) {
        branches.set(branchId, []);
      }
      branches.get(branchId)!.push(op);
    });

    const branchesArray = Array.from(branches.entries()).map(([branchId, branchOps]) => ({
      branchId,
      branchName: branchOps[0]?.branchName || "主分支",
      operators: branchOps,
    }));

    result.push({
      groupId,
      isParallel: branchesArray.length > 1,
      branches: branchesArray,
    });
  }

  return result;
}

export function WorkflowExecutionDetail({ execution: rawExecution, onBack }: WorkflowExecutionDetailProps) {
  // Normalize raw API data (may lack mock fields) into full WorkflowExecution shape
  const execution: WorkflowExecution = useMemo(() => normalizeExecution(rawExecution), [rawExecution]);

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [filesPage, setFilesPage] = useState(1);
  const [fileSearch, setFileSearch] = useState("");
  const [fileStatusFilter, setFileStatusFilter] = useState<string>("all");
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState(false);
  const filesPerPage = 10;
  const logEndRef = useRef<HTMLDivElement>(null);

  
  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "执行概览", icon: Activity },
    { id: "files", label: "处理文件", icon: FileText },
    { id: "logs", label: "运行日志", icon: Terminal },
  ];

  const st = statusConfig[execution.status];
  const StIcon = st.icon;

  const parallelGroups = useMemo(() => groupOperatorsByParallel(execution.operators), [execution.operators]);

  const filteredFiles = execution.processedFiles.filter((f) => {
    const matchSearch = !fileSearch || f.fileName.includes(fileSearch) || f.processedFileName.includes(fileSearch);
    const matchStatus = fileStatusFilter === "all" || f.status === fileStatusFilter;
    return matchSearch && matchStatus;
  });
  const paginatedFiles = filteredFiles.slice((filesPage - 1) * filesPerPage, filesPage * filesPerPage);
  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  const filteredLogs = execution.logs.filter((l) => logLevelFilter === "all" || l.level === logLevelFilter);

  useEffect(() => {
    if (activeTab === "logs" && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab]);

  const handleCopyTaskId = () => {
    navigator.clipboard.writeText(execution.taskId ?? execution.id ?? "");
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const hasParallelBranches = parallelGroups.some(g => g.isParallel);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-auto">
      <div className="max-w-6xl mx-auto w-full px-8 py-6 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={onBack} className="hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 inline mr-1" />
            执行历史
          </button>
          <span>/</span>
          <span className="text-foreground">{execution.workflowName}</span>
        </div>

        {/* Header */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", st.bg, st.border)}>
              <StIcon className={cn("h-5 w-5", st.color, execution.status === "running" && "animate-spin")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-base font-semibold text-foreground truncate">{execution.workflowName}</h1>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", st.bg, st.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", st.dotColor, execution.status === "running" && "animate-pulse")} />
                  {st.label}
                </span>
                {hasParallelBranches && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyber-purple/10 text-cyber-purple">
                    <GitBranch className="h-3 w-3" />
                    并行流水线
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="font-mono">{(execution.taskId ?? execution.id ?? "").slice(0, 16)}...</span>
                <button onClick={handleCopyTaskId} className="p-0.5 rounded hover:bg-muted transition-colors">
                  {copiedId ? <Check className="h-3 w-3 text-cyber-neon" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground rounded-md border border-border hover:border-primary/40 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground rounded-md border border-border hover:border-primary/40 transition-colors">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">耗时</span>
              <span className="font-mono font-medium text-foreground">{execution.totalDuration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5 text-cyber-purple" />
              <span className="text-muted-foreground">算子</span>
              <span className="font-mono font-medium text-foreground">{execution.operators.length}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyber-neon" />
              <span className="text-muted-foreground">成功</span>
              <span className="font-mono font-medium text-cyber-neon">{execution.successFiles}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-muted-foreground">失败</span>
              <span className="font-mono font-medium text-destructive">{execution.failedFiles}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5 text-cyber-purple" />
              <span className="text-muted-foreground">成功率</span>
              <span className="font-mono font-medium text-foreground">{execution.successRate}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">{execution.startTime}</span>
              {execution.endTime !== "--" && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{execution.endTime}</span>
                </>
              )}
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
                {tab.id === "files" && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-0.5">({execution.totalFiles})</span>
                )}
                {tab.id === "logs" && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-0.5">({execution.logs.length})</span>
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
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Progress */}
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">处理进度</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    {execution.successFiles + execution.failedFiles}/{execution.totalFiles}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                  {execution.successFiles > 0 && (
                    <div
                      className="h-full bg-cyber-neon transition-all"
                      style={{ width: `${(execution.successFiles / execution.totalFiles) * 100}%` }}
                    />
                  )}
                  {execution.status === "running" && (
                    <div
                      className="h-full bg-primary animate-pulse"
                      style={{ width: `${((execution.totalFiles - execution.successFiles - execution.failedFiles) / execution.totalFiles) * 100}%` }}
                    />
                  )}
                  {execution.failedFiles > 0 && (
                    <div
                      className="h-full bg-destructive"
                      style={{ width: `${(execution.failedFiles / execution.totalFiles) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyber-neon" />
                    已完成 {execution.successFiles}
                  </span>
                  {execution.status === "running" && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      处理中 {execution.totalFiles - execution.successFiles - execution.failedFiles}
                    </span>
                  )}
                  {execution.failedFiles > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      失败 {execution.failedFiles}
                    </span>
                  )}
                </div>
              </div>

              {/* Pipeline Visualization */}
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    流水线执行
                    {hasParallelBranches && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyber-purple/10 text-cyber-purple">
                        <GitBranch className="h-3 w-3" />
                        包含并行分支
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    共 {execution.operators.length} 个算子
                  </span>
                </div>

                <div className="space-y-3">
                  {parallelGroups.map((group, groupIdx) => {
                    const isLastGroup = groupIdx === parallelGroups.length - 1;
                    
                    return (
                      <div key={group.groupId}>
                        {group.isParallel ? (
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyber-purple/5 border border-cyber-purple/20">
                                <GitBranch className="h-3 w-3 text-cyber-purple" />
                                <span className="text-[10px] font-medium text-cyber-purple">并行执行</span>
                              </div>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                            
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${group.branches.length}, 1fr)` }}>
                              {group.branches.map((branch, branchIdx) => {
                                const branchColor = branchColors[branchIdx % branchColors.length];
                                return (
                                  <div key={branch.branchId} className="relative">
                                    <div className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 mb-2 rounded-t border-l-2",
                                      branchColor.bg,
                                      branchColor.border.replace("border-", "border-l-")
                                    )}>
                                      <span className={cn("text-[10px] font-medium", branchColor.text)}>{branch.branchName}</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {branch.operators.map((op) => {
                                        const opSt = statusConfig[op.status];
                                        const OpIcon = opSt.icon;
                                        return (
                                          <div 
                                            key={op.operatorId} 
                                            className={cn(
                                              "rounded-lg border bg-card p-3 hover:border-primary/30 transition-colors",
                                              branchColor.border.replace("/30", "/20")
                                            )}
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0",
                                                opSt.bg, opSt.border
                                              )}>
                                                <OpIcon className={cn("h-3.5 w-3.5", opSt.color, op.status === "running" && "animate-spin")} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                  <h4 className="text-xs font-medium text-foreground truncate">{op.operatorName}</h4>
                                                  <span className={cn("px-1 py-0.5 rounded text-[9px] font-medium", opSt.bg, opSt.color)}>
                                                    {opSt.label}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                  <span className="font-mono">{op.duration}</span>
                                                  <span>{op.filesProcessed} 文件</span>
                                                  <span className={cn("font-mono", op.successRate === "100%" ? "text-cyber-neon" : op.successRate === "0%" ? "text-destructive" : "text-cyber-orange")}>{op.successRate}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {!isLastGroup && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-px bg-border" />
                                <div className="text-[10px] text-muted-foreground">汇合</div>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {group.branches[0]?.operators.map((op) => {
                              const opSt = statusConfig[op.status];
                              const OpIcon = opSt.icon;
                              return (
                                <div key={op.operatorId} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0",
                                      opSt.bg, opSt.border
                                    )}>
                                      <OpIcon className={cn("h-4 w-4", opSt.color, op.status === "running" && "animate-spin")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="text-xs font-semibold text-foreground">{op.operatorName}</h4>
                                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", opSt.bg, opSt.color)}>
                                          {opSt.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {op.startTime} - {op.endTime}
                                        </span>
                                        <span>耗时 {op.duration}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs flex-shrink-0">
                                      <div className="text-center">
                                        <div className="font-mono font-medium text-foreground">{op.filesProcessed}</div>
                                        <div className="text-[10px] text-muted-foreground">文件</div>
                                      </div>
                                      <div className="text-center">
                                        <div className={cn("font-mono font-medium", op.successRate === "100%" ? "text-cyber-neon" : op.successRate === "0%" ? "text-destructive" : "text-cyber-orange")}>{op.successRate}</div>
                                        <div className="text-[10px] text-muted-foreground">成功率</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!isLastGroup && !group.isParallel && (
                          <div className="flex justify-center py-1">
                            <div className="w-px h-4 bg-border" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Two column info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">任务信息</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">任务名称</span>
                      <span className="text-foreground font-medium">{execution.workflowName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">描述</span>
                      <span className="text-foreground">{execution.description || "--"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">重试次数</span>
                      <span className="text-foreground font-mono">{execution.retryCount}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">算子数量</span>
                      <span className="text-foreground font-mono">{execution.operators.length}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">数据流向</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">源数据集</span>
                      <span className="text-primary cursor-pointer hover:underline flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {execution.sourceDataset}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">目标数据集</span>
                      <span className="text-primary cursor-pointer hover:underline flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {execution.targetDataset}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground">开始时间</span>
                      <span className="text-foreground font-mono">{execution.startTime}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">结束时间</span>
                      <span className="text-foreground font-mono">{execution.endTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Logs Preview */}
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    最近日志
                  </h3>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    查看全部
                  </button>
                </div>
                <div className="space-y-1">
                  {execution.logs.slice(-5).map((log, idx) => {
                    const lc = logLevelConfig[log.level];
                    return (
                      <div key={idx} className="flex items-start gap-2 py-1 text-[11px]">
                        <span className={cn("px-1 py-0 rounded text-[9px] font-mono font-medium flex-shrink-0", lc.tag)}>
                          {log.level}
                        </span>
                        <span className="text-muted-foreground font-mono flex-shrink-0">
                          {log.timestamp.split(" ").pop()?.slice(0, 8)}
                        </span>
                        <span className="text-foreground truncate">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名..."
                    value={fileSearch}
                    onChange={(e) => { setFileSearch(e.target.value); setFilesPage(1); }}
                    className="pl-9 h-8 bg-muted/50 border-border text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "all", label: "全部" },
                    { id: "completed", label: "已完成" },
                    { id: "failed", label: "失败" },
                    { id: "processing", label: "处理中" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setFileStatusFilter(f.id); setFilesPage(1); }}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                        fileStatusFilter === f.id
                          ? "bg-primary/10 text-primary border-primary/25"
                          : "text-muted-foreground border-border hover:border-primary/30"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  共 {filteredFiles.length} 个文件
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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">处理后文件名</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">类型</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">处理前</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">处理后</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">状态</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFiles.map((file) => {
                      const fSt = statusConfig[file.status];
                      return (
                        <tr key={file.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-border" /></td>
                          <td className="px-4 py-3 text-primary font-medium">{file.fileName}</td>
                          <td className="px-4 py-3 text-foreground">{file.processedFileName}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono">{file.fileType}</span>
                            {file.fileType !== file.processedFileType && (
                              <>
                                <ChevronRight className="h-3 w-3 inline text-muted-foreground mx-1" />
                                <span className="font-mono">{file.processedFileType}</span>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{file.sizeBefore}</td>
                          <td className="px-4 py-3 font-mono text-foreground">{file.sizeAfter}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", fSt.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", fSt.dotColor, file.status === "processing" && "animate-pulse")} />
                              {fSt.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button className="text-primary text-[10px] hover:underline">对比</button>
                              <button className="text-primary text-[10px] hover:underline">下载</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setFilesPage(Math.max(1, filesPage - 1))}
                    disabled={filesPage === 1}
                    className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilesPage(p)}
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center transition-colors",
                        p === filesPage ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilesPage(Math.min(totalPages, filesPage + 1))}
                    disabled={filesPage === totalPages}
                    className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    下一页
                  </button>
                  <span className="text-muted-foreground ml-2">{filesPerPage} / 页</span>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {["all", "INFO", "WARN", "ERROR", "SUCCESS"].map((level) => (
                    <button
                      key={level}
                      onClick={() => setLogLevelFilter(level)}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                        logLevelFilter === level
                          ? level === "all" ? "bg-primary/10 text-primary border-primary/25" :
                            level === "ERROR" ? "bg-destructive/10 text-destructive border-destructive/25" :
                            level === "WARN" ? "bg-cyber-orange/10 text-cyber-orange border-cyber-orange/25" :
                            level === "SUCCESS" ? "bg-cyber-neon/10 text-cyber-neon border-cyber-neon/25" :
                            "bg-primary/10 text-primary border-primary/25"
                          : "text-muted-foreground border-border hover:border-primary/30"
                      )}
                    >
                      {level === "all" ? "全部" : level}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  共 {filteredLogs.length} 条日志
                </span>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-[oklch(0.15_0.01_260)] min-h-[400px] max-h-[500px] overflow-auto">
                  <div className="p-4 space-y-0.5">
                    {filteredLogs.map((log, idx) => {
                      const lc = logLevelConfig[log.level];
                      return (
                        <div key={idx} className="flex items-start gap-2 py-0.5 font-mono text-[11px] leading-5 hover:bg-[oklch(0.18_0.01_260)] px-2 -mx-2 rounded">
                          <span className={cn("px-1 py-0 rounded text-[9px] font-medium flex-shrink-0 mt-0.5", lc.tag)}>
                            {log.level.padEnd(7)}
                          </span>
                          <span className="text-[oklch(0.5_0.005_260)] flex-shrink-0">{log.timestamp}</span>
                          <span className={cn(
                            "text-[oklch(0.8_0.005_260)]",
                            log.level === "ERROR" && "text-[oklch(0.7_0.15_25)]",
                            log.level === "WARN" && "text-[oklch(0.7_0.12_55)]",
                            log.level === "SUCCESS" && "text-[oklch(0.7_0.12_170)]"
                          )}>{log.message}</span>
                        </div>
                      );
                    })}
                    <div ref={logEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
