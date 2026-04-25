import { useState, useEffect, useCallback } from "react";
import { knowledgeApi, type KnowledgeBaseItem, type KnowledgeBaseCreate, type KbDocument, type SearchResult } from "@/lib/api";

export function useKnowledgeBases() {
  const [kbs, setKbs] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKbs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await knowledgeApi.list();
      setKbs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKbs();
  }, [fetchKbs]);

  const create = async (data: KnowledgeBaseCreate) => {
    const kb = await knowledgeApi.create(data);
    setKbs((prev) => [kb, ...prev]);
    return kb;
  };

  const remove = async (id: string) => {
    await knowledgeApi.delete(id);
    setKbs((prev) => prev.filter((k) => k.id !== id));
  };

  return { kbs, loading, error, create, remove, refresh: fetchKbs };
}

export function useKbDocuments(kbId: string) {
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      const data = await knowledgeApi.documents(kbId);
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const upload = async (file: File) => {
    const doc = await knowledgeApi.uploadDoc(kbId, file);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  };

  const remove = async (docId: string) => {
    await knowledgeApi.deleteDoc(kbId, docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const reindex = () => knowledgeApi.reindex(kbId);

  const search = (query: string, topK?: number, threshold?: number): Promise<SearchResult[]> =>
    knowledgeApi.search(kbId, query, topK, threshold);

  return { documents, loading, upload, remove, reindex, search, refresh: fetchDocs };
}
