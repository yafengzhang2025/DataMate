"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Square,
  Clock,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkflowTemplate, NodeStatus, ConfigField } from "@/lib/workflows";
import { getOperatorById, operatorConfigFields } from "@/lib/workflows";

const iconMap: Record<string, React.ElementType> = {
  FileText, Image, Headphones, Video, LayoutGrid, Download, Tags,
  ScanSearch, TextSearch, ScanEye, AudioLines, Film, Merge, ShieldCheck,
  Combine, RadioTower, WandSparkles, Volume2, PenTool, Lightbulb,
  MessageSquare, FileVideo, BookOpen, Brush,
};

interface WorkflowCanvasProps {
  template: WorkflowTemplate;
  onBack: () => void;
}

interface DragState {
  nodeId: string;
  offsetX: number;
  offsetY: number;
}

const statusVisual: Record<NodeStatus, { border: string; ring: string; icon: React.ElementType | null; iconColor: string; label: string; }> = {
  idle: { border: "border-border", ring: "", icon: null, iconColor: "", label: "等待中" },
  running: { border: "border-cyber-orange", ring: "ring-1 ring-cyber-orange/30", icon: Loader2, iconColor: "text-cyber-orange animate-spin", label: "运行中" },
  success: { border: "border-cyber-neon", ring: "ring-1 ring-cyber-neon/20", icon: CheckCircle2, iconColor: "text-cyber-neon", label: "已完成" },
  error: { border: "border-destructive", ring: "ring-1 ring-destructive/20", icon: AlertCircle, iconColor: "text-destructive", label: "异常" },
  skipped: { border: "border-muted-foreground/30", ring: "", icon: Square, iconColor: "text-muted-foreground", label: "跳过" },
};

export function WorkflowCanvas({ template, onBack }: WorkflowCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of template.nodes) positions[node.id] = { ...node.position };
    return positions;
  });
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>(() => {
    const s: Record<string, NodeStatus> = {};
    for (const n of template.nodes) s[n.id] = "idle";
    return s;
  });
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, Record<string, string | number | boolean>>>(() => {
    const c: Record<string, Record<string, string | number | boolean>> = {};
    for (const node of template.nodes) {
      const fields = operatorConfigFields[node.operatorId] || [];
      const config: Record<string, string | number | boolean> = {};
      for (const f of fields) config[f.key] = node.config?.[f.key] ?? f.defaultValue;
      c[node.id] = config;
    }
    return c;
  });
  const [runLog, setRunLog] = useState<{ nodeId: string; message: string; time: string; type: "info" | "success" | "error" }[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const runIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleFit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = nodePositions[nodeId];
    setDragging({ nodeId, offsetX: e.clientX / zoom - pos.x, offsetY: e.clientY / zoom - pos.y });
  }, [nodePositions, zoom]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) {
      setSelectedNode(null);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        setNodePositions((prev) => ({
          ...prev,
          [dragging.nodeId]: {
            x: e.clientX / zoom - dragging.offsetX,
            y: e.clientY / zoom - dragging.offsetY,
          },
        }));
      }
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    };
    const handleMouseUp = () => { setDragging(null); setIsPanning(false); };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [dragging, isPanning, panStart, zoom]);

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunLog([]);
    const nodeIds = template.nodes.map((n) => n.id);
    // Reset all
    const resetStatuses: Record<string, NodeStatus> = {};
    for (const id of nodeIds) resetStatuses[id] = "idle";
    setNodeStatuses(resetStatuses);

    let i = 0;
    const now = () => new Date().toLocaleTimeString("zh-CN", { hour12: false });

    runIntervalRef.current = setInterval(() => {
      if (i < nodeIds.length) {
        const nodeId = nodeIds[i];
        const op = getOperatorById(template.nodes[i].operatorId);
        const opName = op?.name || nodeId;

        // Set current as running
        setNodeStatuses((prev) => ({ ...prev, [nodeId]: "running" }));
        setRunLog((prev) => [...prev, { nodeId, message: `${opName} 开始执行...`, time: now(), type: "info" }]);
        setSelectedNode(nodeId);

        // After a delay mark as success
        setTimeout(() => {
          const isError = Math.random() < 0.05; // 5% chance of error for demo
          setNodeStatuses((prev) => ({ ...prev, [nodeId]: isError ? "error" : "success" }));
          setRunLog((prev) => [...prev, {
            nodeId,
            message: isError ? `${opName} 执行异常: 连接超时` : `${opName} 执行完成 (${(Math.random() * 2 + 0.3).toFixed(1)}s)`,
            time: now(),
            type: isError ? "error" : "success",
          }]);
        }, 600);

        i++;
      } else {
        clearInterval(runIntervalRef.current!);
        setIsRunning(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => { if (runIntervalRef.current) clearInterval(runIntervalRef.current); };
  }, []);

  const handleStopRun = () => {
    if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    setIsRunning(false);
  };

  const updateConfig = (nodeId: string, key: string, value: string | number | boolean) => {
    setNodeConfigs((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], [key]: value },
    }));
  };

  const getEdgePath = (fromId: string, toId: string) => {
    const from = nodePositions[fromId];
    const to = nodePositions[toId];
    if (!from || !to) return "";
    const nodeW = 200, nodeH = 68;
    const sx = from.x + nodeW, sy = from.y + nodeH / 2;
    const ex = to.x, ey = to.y + nodeH / 2;
    const mx = (sx + ex) / 2;
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ey}, ${ex} ${ey}`;
  };

  const getEdgeStatus = (fromId: string, toId: string): NodeStatus => {
    const fromS = nodeStatuses[fromId];
    if (fromS === "success") return "success";
    if (fromS === "running") return "running";
    return "idle";
  };

  const edgeColor = (status: NodeStatus) => {
    if (status === "success") return "oklch(0.48 0.15 170)";
    if (status === "running") return "oklch(0.62 0.18 55)";
    return "oklch(0.78 0.005 260)";
  };

  // Config panel
  const selectedOp = selectedNode
    ? getOperatorById(template.nodes.find((n) => n.id === selectedNode)?.operatorId || "")
    : null;
  const selectedFields = selectedNode
    ? operatorConfigFields[template.nodes.find((n) => n.id === selectedNode)?.operatorId || ""] || []
    : [];

  const completedCount = Object.values(nodeStatuses).filter((s) => s === "success").length;
  const errorCount = Object.values(nodeStatuses).filter((s) => s === "error").length;
  const totalCount = template.nodes.length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Toolbar */}
      <div className="flex-shrink-0 h-12 border-b border-border bg-card flex items-center px-4 gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-2">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回
        </button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-sm font-semibold text-foreground">{template.name}</h2>
        <span className="text-[10px] text-primary bg-primary/[0.06] px-1.5 py-0.5 rounded font-medium">{template.categoryLabel}</span>

        {/* Run status summary */}
        {(completedCount > 0 || errorCount > 0 || isRunning) && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-cyber-neon"><CheckCircle2 className="h-3 w-3" /> {completedCount}/{totalCount}</span>
              {errorCount > 0 && <span className="flex items-center gap-1 text-destructive"><AlertCircle className="h-3 w-3" /> {errorCount}</span>}
              {isRunning && <span className="flex items-center gap-1 text-cyber-orange"><Loader2 className="h-3 w-3 animate-spin" /> 执行中</span>}
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border px-1 py-0.5">
            <button onClick={handleZoomOut} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="缩小"><ZoomOut className="h-3.5 w-3.5" /></button>
            <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="放大"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button onClick={handleFit} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors" aria-label="适应屏幕"><Maximize2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="h-4 w-px bg-border" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted border border-border rounded-md hover:border-primary/40 hover:text-primary transition-colors">
            <Save className="h-3.5 w-3.5" /> 保存
          </button>
          {isRunning ? (
            <button onClick={handleStopRun} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors">
              <Square className="h-3.5 w-3.5" /> 停止
            </button>
          ) : (
            <button onClick={handleRun} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Play className="h-3.5 w-3.5" /> 运行
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onClick={handleCanvasClick}
        >
          <div data-canvas-bg className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, oklch(0.82 0.005 260) 1px, transparent 1px)`,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }} />

          <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              <defs>
                <marker id="arrow-idle" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M 0 0 L 8 3 L 0 6 Z" fill="oklch(0.78 0.005 260)" /></marker>
                <marker id="arrow-success" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M 0 0 L 8 3 L 0 6 Z" fill="oklch(0.48 0.15 170)" /></marker>
                <marker id="arrow-running" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M 0 0 L 8 3 L 0 6 Z" fill="oklch(0.62 0.18 55)" /></marker>
              </defs>
              {template.edges.map((edge) => {
                const es = getEdgeStatus(edge.from, edge.to);
                return (
                  <path
                    key={edge.id}
                    d={getEdgePath(edge.from, edge.to)}
                    stroke={edgeColor(es)}
                    strokeWidth={es === "idle" ? "1.5" : "2"}
                    fill="none"
                    markerEnd={`url(#arrow-${es === "success" ? "success" : es === "running" ? "running" : "idle"})`}
                    className="transition-all duration-500"
                    strokeDasharray={es === "running" ? "6 4" : "none"}
                  >
                    {es === "running" && (
                      <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />
                    )}
                  </path>
                );
              })}
            </svg>

            {/* Nodes */}
            {template.nodes.map((node) => {
              const op = getOperatorById(node.operatorId);
              if (!op) return null;
              const Icon = iconMap[op.icon];
              const pos = nodePositions[node.id] || node.position;
              const status = nodeStatuses[node.id];
              const sv = statusVisual[status];
              const isSelected = selectedNode === node.id;
              const StatusIcon = sv.icon;

              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg border bg-card transition-all duration-200 cursor-move select-none",
                    sv.border, sv.ring,
                    isSelected && status === "idle" && "border-primary ring-1 ring-primary/20",
                    status === "idle" && !isSelected && "hover:border-primary/30 hover:shadow-sm"
                  )}
                  style={{ left: pos.x, top: pos.y, width: 200 }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                >
                  {op.inputs > 0 && <div className={cn("absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-card", status === "success" ? "border-cyber-neon" : status === "running" ? "border-cyber-orange" : "border-border")} />}
                  {op.outputs > 0 && <div className={cn("absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-card", status === "success" ? "border-cyber-neon bg-cyber-neon/20" : status === "running" ? "border-cyber-orange bg-cyber-orange/20" : "border-border bg-muted")} />}

                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-md border flex-shrink-0",
                    status === "success" ? "bg-cyber-neon/10 border-cyber-neon/30" :
                    status === "running" ? "bg-cyber-orange/10 border-cyber-orange/30" :
                    status === "error" ? "bg-destructive/10 border-destructive/30" :
                    "bg-muted/80 border-border"
                  )}>
                    {Icon && <Icon className={cn("h-4 w-4", status === "idle" ? op.iconColor : status === "success" ? "text-cyber-neon" : status === "running" ? "text-cyber-orange" : "text-destructive")} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate leading-tight">{op.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {StatusIcon ? (
                        <span className={cn("flex items-center gap-0.5 text-[9px] font-medium", sv.iconColor)}>
                          <StatusIcon className={cn("h-2.5 w-2.5", sv.iconColor)} />
                          {sv.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">{op.version}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && status === "idle" && (
                    <Settings2 className="h-3 w-3 text-primary/60 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Config Panel / Run Log */}
        {selectedNode && (
          <div className="w-80 flex-shrink-0 border-l border-border bg-card flex flex-col">
            <div className="flex items-center justify-between px-4 h-10 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">{selectedOp?.name || "配置"}</span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Status banner */}
                {nodeStatuses[selectedNode] !== "idle" && (
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium",
                    nodeStatuses[selectedNode] === "success" && "bg-cyber-neon/10 text-cyber-neon",
                    nodeStatuses[selectedNode] === "running" && "bg-cyber-orange/10 text-cyber-orange",
                    nodeStatuses[selectedNode] === "error" && "bg-destructive/10 text-destructive",
                  )}>
                    {statusVisual[nodeStatuses[selectedNode]].icon && (() => {
                      const SIcon = statusVisual[nodeStatuses[selectedNode]].icon!;
                      return <SIcon className={cn("h-3.5 w-3.5", statusVisual[nodeStatuses[selectedNode]].iconColor)} />;
                    })()}
                    {statusVisual[nodeStatuses[selectedNode]].label}
                  </div>
                )}

                {/* Config fields */}
                {selectedFields.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">参数配置</p>
                    {selectedFields.map((field: ConfigField) => (
                      <div key={field.key} className="space-y-1">
                        <label className="flex items-center justify-between text-xs text-foreground font-medium">
                          {field.label}
                          {field.description && (
                            <span className="text-[10px] text-muted-foreground font-normal">{field.description}</span>
                          )}
                        </label>
                        {field.type === "select" && (
                          <select
                            value={String(nodeConfigs[selectedNode]?.[field.key] ?? field.defaultValue)}
                            onChange={(e) => updateConfig(selectedNode, field.key, e.target.value)}
                            className="w-full h-8 px-2 text-xs bg-muted/50 border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30"
                          >
                            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                        {field.type === "text" && (
                          <input
                            type="text"
                            value={String(nodeConfigs[selectedNode]?.[field.key] ?? field.defaultValue)}
                            onChange={(e) => updateConfig(selectedNode, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full h-8 px-2 text-xs bg-muted/50 border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 placeholder:text-muted-foreground/50"
                          />
                        )}
                        {field.type === "number" && (
                          <input
                            type="number"
                            value={String(nodeConfigs[selectedNode]?.[field.key] ?? field.defaultValue)}
                            onChange={(e) => updateConfig(selectedNode, field.key, parseFloat(e.target.value) || 0)}
                            placeholder={field.placeholder}
                            className="w-full h-8 px-2 text-xs bg-muted/50 border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 font-mono placeholder:text-muted-foreground/50"
                          />
                        )}
                        {field.type === "textarea" && (
                          <textarea
                            value={String(nodeConfigs[selectedNode]?.[field.key] ?? field.defaultValue)}
                            onChange={(e) => updateConfig(selectedNode, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-2 py-1.5 text-xs bg-muted/50 border border-border rounded-md text-foreground outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 resize-none placeholder:text-muted-foreground/50"
                          />
                        )}
                        {field.type === "toggle" && (
                          <button
                            onClick={() => updateConfig(selectedNode, field.key, !nodeConfigs[selectedNode]?.[field.key])}
                            className={cn(
                              "relative w-9 h-5 rounded-full transition-colors",
                              nodeConfigs[selectedNode]?.[field.key] ? "bg-primary" : "bg-muted border border-border"
                            )}
                          >
                            <span className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-card shadow-sm",
                              nodeConfigs[selectedNode]?.[field.key] ? "translate-x-4" : "translate-x-0.5"
                            )} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">该算子无需配置参数</p>
                )}

                {/* Node-specific run logs */}
                {runLog.filter((l) => l.nodeId === selectedNode).length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">执行日志</p>
                    {runLog.filter((l) => l.nodeId === selectedNode).map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 mt-px">{log.time}</span>
                        <span className={cn(
                          log.type === "success" ? "text-cyber-neon" :
                          log.type === "error" ? "text-destructive" : "text-foreground"
                        )}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Bottom Run Log Bar */}
        {runLog.length > 0 && !selectedNode && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm max-h-36 overflow-auto">
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/60 sticky top-0 bg-card">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">运行日志</span>
              <span className="text-[10px] text-muted-foreground">({runLog.length})</span>
            </div>
            <div className="px-4 py-2 space-y-0.5">
              {runLog.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[11px]">
                  <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{log.time}</span>
                  <span className={cn(
                    log.type === "success" ? "text-cyber-neon" :
                    log.type === "error" ? "text-destructive" : "text-foreground"
                  )}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
