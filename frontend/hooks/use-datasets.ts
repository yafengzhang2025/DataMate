import { useState, useEffect, useCallback } from "react";
import { datasetApi, type DatasetItem, type DatasetPreview } from "@/lib/api";

export function useDatasets() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await datasetApi.list();
      setDatasets(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const upload = async (file: File, name: string, description?: string, modal?: string) => {
    const ds = await datasetApi.upload(file, name, description, modal);
    setDatasets((prev) => [ds, ...prev]);
    return ds;
  };

  const remove = async (id: string) => {
    await datasetApi.delete(id);
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  return { datasets, loading, error, upload, remove, refresh: fetchDatasets };
}

export function useDatasetPreview(id: string, page = 1, pageSize = 20) {
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    datasetApi.preview(id, page, pageSize).then(setPreview).finally(() => setLoading(false));
  }, [id, page, pageSize]);

  return { preview, loading };
}
