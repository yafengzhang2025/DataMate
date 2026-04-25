import { useState, useEffect, useCallback } from "react";
import { operatorApi, type OperatorItem, type OperatorCategoryItem } from "@/lib/api";

export function useOperators(params?: { category?: string; search?: string }) {
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [categories, setCategories] = useState<OperatorCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, cats] = await Promise.all([
        operatorApi.list(params),
        operatorApi.categories(),
      ]);
      setOperators(result.items);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search]);

  useEffect(() => {
    fetchOperators();
  }, [fetchOperators]);

  const install = async (id: string) => {
    const updated = await operatorApi.install(id);
    setOperators((prev) => prev.map((op) => (op.id === updated.id ? updated : op)));
  };

  const uninstall = async (id: string) => {
    const updated = await operatorApi.uninstall(id);
    setOperators((prev) => prev.map((op) => (op.id === updated.id ? updated : op)));
  };

  const upload = async (file: File) => {
    const newOp = await operatorApi.upload(file);
    setOperators((prev) => [newOp, ...prev]);
    return newOp;
  };

  const refresh = fetchOperators;

  return { operators, categories, loading, error, install, uninstall, upload, refresh };
}
