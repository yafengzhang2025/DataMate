import { useState, useEffect, useCallback } from "react";
import { workflowApi, type WorkflowItem, type WorkflowCreate, type WorkflowExecution } from "@/lib/api";

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workflowApi.list();
      setWorkflows(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const create = async (data: WorkflowCreate) => {
    const wf = await workflowApi.create(data);
    setWorkflows((prev) => [wf, ...prev]);
    return wf;
  };

  const update = async (id: string, data: Partial<WorkflowCreate>) => {
    const wf = await workflowApi.update(id, data);
    setWorkflows((prev) => prev.map((w) => (w.id === id ? wf : w)));
    return wf;
  };

  const remove = async (id: string) => {
    await workflowApi.delete(id);
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const run = async (id: string): Promise<WorkflowExecution> => {
    return workflowApi.run(id);
  };

  return { workflows, loading, error, create, update, remove, run, refresh: fetchWorkflows };
}

export function useWorkflowExecutions(workflowId: string) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    workflowApi.executions(workflowId)
      .then((result) => setExecutions(result.items))
      .finally(() => setLoading(false));
  }, [workflowId]);

  return { executions, loading };
}
