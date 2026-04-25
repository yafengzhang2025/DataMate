# 后端 REST API 规格说明

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 通用约定

- Base Path: `/api/v1`
- 数据格式: `application/json`
- 分页参数: `?page=1&size=20`
- 统一响应格式:

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

错误响应:

```json
{
  "code": 4001,
  "message": "算子不存在",
  "data": null
}
```

---

## 2. 算子 API

### 2.1 算子列表

```
GET /api/v1/operators
Query: category?, status?(installed/available), modal?, keyword?, page, size
```

响应 `data`:
```json
{
  "total": 50,
  "items": [
    {
      "id": "filter.file_with_high_repeat_phrase_rate_filter",
      "name": "高重复短语过滤器",
      "raw_id": "FileWithHighRepeatPhraseRateFilter",
      "category": "filter",
      "version": "1.0.0",
      "vendor": "datamate",
      "description": "过滤高重复短语率的文件",
      "modal": ["text"],
      "inputs": ["text"],
      "outputs": ["text"],
      "types": ["cleaning"],
      "tags": ["LOCAL CPU"],
      "runtime": { "cpu": 0.1, "memory": 10485760, "gpu": 0 },
      "metrics": [{ "name": "吞吐量", "metric": "1000 docs/sec" }],
      "status": "installed",
      "source": "builtin"
    }
  ]
}
```

### 2.2 算子详情

```
GET /api/v1/operators/{id}
```

额外字段: `settings`（UI 参数配置）、`readme`（说明文档）

### 2.3 安装算子

```
POST /api/v1/operators/{id}/install
```

异步安装，返回 `{ "task_id": "..." }`，可通过 `/api/v1/tasks/{task_id}` 查询进度。

### 2.4 卸载算子

```
POST /api/v1/operators/{id}/uninstall
```

### 2.5 上传自定义算子

```
POST /api/v1/operators/upload
Content-Type: multipart/form-data
Body: file (.zip or .tar.gz)
```

后端处理流程：
1. 解压文件，校验 `__init__.py`、`metadata.yml`、`process.py` 是否存在
2. 解析 `metadata.yml` 提取元数据
3. 安装 `requirements.txt` 依赖（可选）
4. 注册到 `OPERATORS` 中心（热加载）
5. 将元数据写入 `operators` 表，`source='user'`

---

## 3. 工作流 API

### 3.1 工作流列表

```
GET /api/v1/workflows
Query: status?, keyword?, page, size
```

### 3.2 工作流详情

```
GET /api/v1/workflows/{id}
```

响应 `data`:
```json
{
  "id": "wf-001",
  "name": "图像清洗流水线",
  "description": "...",
  "status": "draft",
  "nodes": [
    {
      "id": "node-1",
      "operator_id": "filter.img_blurred_images_cleaner",
      "label": "模糊图像过滤",
      "position": { "x": 100, "y": 200 },
      "config": { "threshold": 0.5 }
    }
  ],
  "edges": [
    { "id": "e-1", "source": "node-1", "target": "node-2" }
  ],
  "created_at": "2026-04-21T10:00:00Z",
  "updated_at": "2026-04-21T10:00:00Z"
}
```

### 3.3 创建工作流

```
POST /api/v1/workflows
Body: { "name", "description", "nodes"[], "edges"[] }
```

### 3.4 更新工作流

```
PUT /api/v1/workflows/{id}
Body: { "name"?, "description"?, "nodes"[]?, "edges"[]? }
```

### 3.5 删除工作流

```
DELETE /api/v1/workflows/{id}
```

### 3.6 执行工作流

```
POST /api/v1/workflows/{id}/run
Body: {
  "input_dataset_id": "ds-001",
  "output_path": "/data/output/",
  "mode": "local" | "ray"
}
```

响应: `{ "execution_id": "exec-001" }`

### 3.7 停止执行

```
POST /api/v1/workflows/{id}/executions/{exec_id}/stop
```

### 3.8 执行列表

```
GET /api/v1/workflows/{id}/executions
Query: page, size
```

### 3.9 执行详情

```
GET /api/v1/workflows/{id}/executions/{exec_id}
```

响应包含 `node_executions[]`：
```json
{
  "id": "exec-001",
  "workflow_id": "wf-001",
  "status": "completed",
  "started_at": "...",
  "finished_at": "...",
  "node_executions": [
    {
      "node_id": "node-1",
      "status": "completed",
      "started_at": "...",
      "finished_at": "...",
      "logs": ["处理 1000 条", "过滤 50 条"],
      "metrics": { "processed": 1000, "filtered": 50, "elapsed_ms": 3200 }
    }
  ]
}
```

### 3.10 工作流模板列表

```
GET /api/v1/workflow-templates
Query: category?, keyword?
```

---

## 4. 数据集 API

### 4.1 数据集列表

```
GET /api/v1/datasets
Query: modal?, format?, keyword?, page, size
```

### 4.2 数据集详情

```
GET /api/v1/datasets/{id}
```

### 4.3 上传数据集

```
POST /api/v1/datasets/upload
Content-Type: multipart/form-data
Body: file (.jsonl / .csv / .parquet / .zip), name, description, modal
```

### 4.4 数据集预览

```
GET /api/v1/datasets/{id}/preview
Query: page=1, size=20
```

响应:
```json
{
  "total": 10000,
  "columns": ["text", "label", "source"],
  "rows": [
    { "text": "...", "label": "...", "source": "..." }
  ]
}
```

### 4.5 删除数据集

```
DELETE /api/v1/datasets/{id}
```

### 4.6 导出数据集

```
GET /api/v1/datasets/{id}/export
Query: format=jsonl|csv|parquet
```

---

## 5. 知识库 API

### 5.1 知识库列表

```
GET /api/v1/knowledge
```

### 5.2 创建知识库

```
POST /api/v1/knowledge
Body: { "name", "description", "embed_model": "text-embedding-3-small", "vector_store": "chromadb" }
```

### 5.3 知识库详情

```
GET /api/v1/knowledge/{id}
```

### 5.4 上传文档

```
POST /api/v1/knowledge/{id}/documents
Content-Type: multipart/form-data
Body: file (.pdf / .txt / .md / .docx / .html)
```

异步分块向量化，状态：`pending → indexing → indexed | error`

### 5.5 文档列表

```
GET /api/v1/knowledge/{id}/documents
```

### 5.6 删除文档

```
DELETE /api/v1/knowledge/{id}/documents/{doc_id}
```

### 5.7 向量检索

```
POST /api/v1/knowledge/{id}/search
Body: { "query": "...", "top_k": 5, "threshold": 0.7 }
```

响应:
```json
{
  "results": [
    {
      "chunk_id": "...",
      "document_name": "...",
      "content": "...",
      "score": 0.92
    }
  ]
}
```

### 5.8 重建索引

```
POST /api/v1/knowledge/{id}/reindex
```

---

## 6. WebSocket

```
WS /api/v1/ws/executions/{execution_id}
```

消息格式（Server → Client）：

```json
{ "type": "node_status", "node_id": "node-1", "status": "running", "message": "处理中..." }
{ "type": "node_log", "node_id": "node-1", "log": "已处理 100/1000 条" }
{ "type": "node_status", "node_id": "node-1", "status": "completed", "metrics": { "processed": 1000, "filtered": 50, "elapsed_ms": 3200 } }
{ "type": "execution_done", "status": "completed" }
```

---

## 7. 异步任务 API

```
GET /api/v1/tasks/{task_id}
```

响应:
```json
{
  "task_id": "...",
  "status": "pending" | "running" | "completed" | "error",
  "progress": 75,
  "message": "..."
}
```
