# 知识库管理规格说明

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 功能概述

知识库模块提供文档向量化存储与语义检索能力，支持：
- 多种文档格式上传（PDF/TXT/MD/DOCX/HTML）
- 自动分块（Chunking）与向量化（Embedding）
- 语义相似度检索（Vector Search）
- 与工作流中 LLM 算子集成（RAG 增强）
- 可选：本体管理（实体/关系类型定义）

---

## 2. 核心概念

| 概念 | 说明 |
|------|------|
| KnowledgeBase（知识库） | 一个独立的向量存储空间，对应一个 ChromaDB Collection |
| Document（文档） | 上传的原始文件 |
| Chunk（分块） | 文档按策略切分后的最小检索单元 |
| Embedding（向量） | Chunk 经 Embedding 模型编码后的向量表示 |

---

## 3. 数据流

```
上传文档
    │
    ▼
文本提取（PDF解析 / DOCX解析 / Markdown解析）
    │
    ▼
文本分块（Chunking）
  - 策略：固定长度 / 句子 / 段落 / 语义
  - 参数：chunk_size（默认 512 token）, overlap（默认 64 token）
    │
    ▼
向量化（Embedding）
  - 支持模型：OpenAI text-embedding-3-small / 本地 bge-m3 等
    │
    ▼
写入向量数据库（Milvus）
    │
    ▼
状态更新：indexed
```

---

## 4. 支持的 Embedding 模型

| 模型名 | 类型 | 维度 | 说明 |
|--------|------|------|------|
| `text-embedding-3-small` | OpenAI API | 1536 | 默认推荐 |
| `text-embedding-3-large` | OpenAI API | 3072 | 高精度 |
| `bge-m3` | 本地模型 | 1024 | 中英文双语，离线可用 |
| `bge-large-zh` | 本地模型 | 1024 | 中文优化 |

---

## 5. 向量数据库

| 数据库 | 模式 | 说明 |
|--------|------|------|
| Milvus| 默认）|  |
---

## 6. 前端页面规格

### 6.1 知识库列表页

- 卡片展示：名称、描述、文档数、Chunk 数、Embedding 模型、向量库类型、创建时间
- 操作：新建知识库、进入详情

### 6.2 新建知识库对话框

```
字段：
- 名称（必填）
- 描述
- Embedding 模型（下拉选择）
- 向量数据库（ChromaDB / Elasticsearch）
- Chunking 策略（固定长度 / 句子 / 段落）
- Chunk 大小（Slider，128~2048 token）
- Chunk 重叠（Slider，0~256 token）
```

### 6.3 知识库详情页

**文档列表面板**：
- 表格展示：文件名、格式、大小、状态（pending/indexing/indexed/error）、Chunk 数、上传时间
- 操作：上传文档、删除文档、重建索引

**上传文档**：
- 支持格式：`.pdf`, `.txt`, `.md`, `.docx`, `.html`
- 拖拽上传，上传后自动触发分块+向量化
- 列表中显示实时状态（进度条 / 状态标签）

**向量检索测试面板**：
```
输入框：检索 Query
参数：Top-K（默认 5）、相似度阈值（默认 0.7）
结果列表：
  - 相关度分数
  - 所属文档名
  - Chunk 内容预览（可展开）
```


## 7. 与工作流集成

知识库可作为 LLM 算子的上下文来源：

```yaml
# 节点配置示例（工作流节点参数）
operator: qa_condition_evaluator
config:
  knowledge_base_id: "kb-001"   # 关联知识库
  top_k: 5
  threshold: 0.7
  llm_model: "gpt-4o"
```

执行时，算子自动检索知识库，将相关 Chunk 注入 Prompt 作为参考上下文。

---

## 8. API 补充

参见 [002-backend-api.md](./002-backend-api.md) 第 5 节。

文档状态 Webhook（可选）：

```
POST /api/v1/knowledge/{id}/documents/{doc_id}/status
Body: { "status": "indexed", "chunk_count": 128 }
```
