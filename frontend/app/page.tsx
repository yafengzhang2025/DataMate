"use client";

import { useState } from "react";
import { TopNav, type PageView } from "@/components/top-nav";
import { OperatorSidebar } from "@/components/operator-sidebar";
import { OperatorGrid } from "@/components/operator-grid";
import { StatsBar } from "@/components/stats-bar";
import { WorkflowTemplates } from "@/components/workflow-templates";
import { WorkflowCanvas } from "@/components/workflow-canvas";
import { WorkflowExecutionList } from "@/components/workflow-execution-list";
import { WorkflowExecutionDetail } from "@/components/workflow-execution-detail";
import { OperatorDetail } from "@/components/operator-detail";
import { DatasetManagement } from "@/components/dataset-management";
import { KnowledgeBaseManagement } from "@/components/knowledge-base";
import { CreateOperatorDialog } from "@/components/create-operator-dialog";
import type { OperatorCategory, Operator } from "@/lib/operators";
import type { WorkflowTemplate, SavedWorkflow } from "@/lib/workflows";

type WorkflowView =
  | { type: "list" }
  | { type: "canvas"; template: WorkflowTemplate }
  | { type: "executionList"; workflow: SavedWorkflow }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "executionDetail"; execution: any };

export default function DataEngineeringPage() {
  const [activePage, setActivePage] = useState<PageView>("workflows");
  const [selectedCategory, setSelectedCategory] = useState<
    OperatorCategory | "all"
  >("all");
  const [workflowView, setWorkflowView] = useState<WorkflowView>({
    type: "list",
  });
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showCreateOperator, setShowCreateOperator] = useState(false);
  const [showUploadOperator, setShowUploadOperator] = useState(false);

  const handlePageChange = (page: PageView) => {
    setActivePage(page);
    if (page === "workflows") {
      setWorkflowView({ type: "list" });
    }
    if (page === "operators") {
      setSelectedOperator(null);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,150,150,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,150,150,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <TopNav activePage={activePage} onPageChange={handlePageChange} />

      <div className="flex flex-1 min-h-0 relative">
        {activePage === "operators" && !selectedOperator && (
          <>
            <OperatorSidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <OperatorGrid
              selectedCategory={selectedCategory}
              onOperatorClick={setSelectedOperator}
              onCreateCustom={() => setShowCreateOperator(true)}
              onUploadCustom={() => setShowUploadOperator(true)}
            />
          </>
        )}

        {activePage === "operators" && selectedOperator && (
          <OperatorDetail
            operator={selectedOperator}
            onBack={() => setSelectedOperator(null)}
          />
        )}

        {activePage === "workflows" && workflowView.type === "list" && (
          <WorkflowTemplates
            onSelectTemplate={(template) =>
              setWorkflowView({ type: "canvas", template })
            }
            onCreateNew={() => {}}
            onOpenWorkflow={(workflow) =>
              setWorkflowView({ type: "executionList", workflow })
            }
          />
        )}

        {activePage === "workflows" && workflowView.type === "canvas" && (
          <WorkflowCanvas
            template={workflowView.template}
            onBack={() => setWorkflowView({ type: "list" })}
          />
        )}

        {activePage === "workflows" &&
          workflowView.type === "executionList" && (
            <WorkflowExecutionList
              workflow={workflowView.workflow}
              onBack={() => setWorkflowView({ type: "list" })}
              onSelectExecution={(execution) =>
                setWorkflowView({ type: "executionDetail", execution })
              }
            />
          )}

        {activePage === "workflows" &&
          workflowView.type === "executionDetail" && (
            <WorkflowExecutionDetail
              execution={workflowView.execution}
              onBack={() => {
                // Go back to execution list — handle both mock and real API field names
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const exec = workflowView.execution as any;
                const wfId = exec.workflowId ?? exec.workflow_id ?? "";
                const savedWf = {
                  id: wfId,
                  name: exec.workflowName ?? "工作流执行",
                  description: exec.description ?? exec.error ?? "",
                  createdAt: "",
                  updatedAt: "",
                  status: "completed" as const,
                  nodeCount: (exec.operators ?? []).length,
                };
                setWorkflowView({
                  type: "executionList",
                  workflow: savedWf,
                });
              }}
            />
          )}

        {activePage === "datasets" && <DatasetManagement />}

        {activePage === "knowledge" && <KnowledgeBaseManagement />}
      </div>

      <StatsBar />

      {/* Create Operator Dialog */}
      <CreateOperatorDialog 
        open={showCreateOperator} 
        onClose={() => setShowCreateOperator(false)} 
      />

      {/* Upload Operator Dialog */}
      {showUploadOperator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowUploadOperator(false)}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">上传自定义算子</h2>
                <p className="text-xs text-muted-foreground mt-0.5">上传您的算子代码包</p>
              </div>
              <button 
                onClick={() => setShowUploadOperator(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">点击或拖拽文件到此处</p>
                <p className="text-xs text-muted-foreground">支持 .zip, .tar.gz 格式，最大 50MB</p>
              </div>

              {/* Operator Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">算子名称</label>
                  <input
                    type="text"
                    placeholder="输入算子名称..."
                    className="w-full h-9 px-3 text-sm rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">描述</label>
                  <textarea
                    placeholder="简要描述算子功能..."
                    className="w-full h-20 px-3 py-2 text-sm rounded-md border border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">分类</label>
                  <select className="w-full h-9 px-3 text-sm rounded-md border border-border bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <option value="text">文本处理</option>
                    <option value="image">图像处理</option>
                    <option value="audio">音频处理</option>
                    <option value="video">视频处理</option>
                    <option value="multimodal">多模态</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setShowUploadOperator(false)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md border border-border hover:border-primary/40 transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                上传算子
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
