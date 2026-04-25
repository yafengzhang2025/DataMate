# Proposal: DataMate 前端重构

## 概述

DataMate 是一个面向 AI 数据工程的开源平台，提供可视化的算子编排、工作流管理、数据集管理和知识库构建能力。本文档描述前端重构方案，以现有 Next.js 前端设计稿为基准，补全交互细节、页面结构与后端对接规范。

## 背景

**技术栈**:
- 框架: Next.js 16 (App Router)
- UI: shadcn/ui + Radix UI
- 样式: Tailwind CSS 4
- React: 19.2.4

**算子分类**:
- `input` — 数据输入（文本、图像、音频、视频、结构化数据）
- `output` — 数据输出（文件导出、API 推送、数据库写入）
- `annotation` — 数据标注（LLM 辅助标注、人工标注）
- `feature-extraction` — 特征提取（嵌入向量、OCR、ASR、目标检测）
- `evaluation` — 质量评估（相似度、BLEU、人工评分）
- `data-aggregation` — 数据聚合（合并、去重、抽样）
- `data-synthesis` — 数据合成（LLM 生成、数据增强）
- `knowledge-generation` — 知识生成（Q&A 对、摘要、知识图谱）
- `image-construction` — 图像构建（图像生成、风格迁移）

## 目标

1. 将现有前端设计稿与后端 API 完整对接，形成可运行的端到端系统
2. 提供流畅的工作流可视化编排体验（拖拽节点、连线、配置、执行）
3. 支持算子的浏览、安装、自定义上传与管理
4. 提供数据集的导入、预览、版本管理功能
5. 提供知识库的创建、文档管理与向量检索功能
6. 支持工作流执行历史追踪与日志查看
7. 算子运行环境支持基于ray的容器运行以及本地python环境运行

## 页面结构

### 导航页（TopNav）

顶部导航栏包含以下页面入口：

| 页面 Key | 中文标签 | 图标 | 说明 |
|----------|----------|------|------|
| `workflows` | 工作流 | GitBranch | 工作流模板浏览、画布编排、执行历史 |
| `operators` | 算子市场 | Package | 算子列表、详情、安装、自定义上传 |
| `datasets` | 数据集 | Database | 数据集管理、预览、版本 |
| `knowledge` | 知识库 | Brain | 知识库管理、文档上传、向量检索、本体构建 |

### 工作流页（workflows）

```
工作流页
├── 列表视图 (WorkflowTemplates)
│   ├── 工作流模板卡片列表（按分类筛选）
│   └── 已保存工作流列表（含状态: draft/running/completed/error）
├── 画布视图 (WorkflowCanvas)
│   ├── 节点拖拽区域（DAG 可视化）
│   ├── 节点配置面板（右侧抽屉）
│   └── 执行控制栏（运行 / 停止 / 保存）
├── 执行列表视图 (WorkflowExecutionList)
│   └── 按工作流过滤的执行记录
└── 执行详情视图 (WorkflowExecutionDetail)
    ├── 算子执行状态时间线
    ├── 每个算子的日志输出
    └── 执行结果预览
```

### 算子市场页（operators）

```
算子市场页
├── 侧边栏分类过滤 (OperatorSidebar)
├── 算子卡片网格 (OperatorGrid)
│   ├── 搜索框
│   ├── 按分类 / 标签过滤
│   └── 算子卡片（OperatorCard）
│       ├── 图标 / 名称 / 版本 / 描述
│       ├── 标签（LLM / LOCAL CPU / LOCAL GPU）
│       └── 安装状态按钮
├── 算子详情 (OperatorDetail)
│   ├── 参数说明
│   ├── 输入输出规格
│   ├── 示例代码
│   └── 安装 / 卸载操作
├── 创建自定义算子 (CreateOperatorDialog)
└── 上传算子包（.zip / .tar.gz）
```

### 数据集页（datasets）

```
数据集页
├── 数据集列表（DatasetList）
│   ├── 搜索 / 按模态过滤（文本 / 图像 / 音频 / 视频 / 结构化）
│   ├── 数据集卡片（名称 / 格式 / 大小 / 条数 / 创建时间）
│   └── 创建数据集按钮
├── 数据集详情（DatasetDetail）
│   ├── 基础信息（模态、格式、版本、存储路径）
│   ├── 数据预览（表格 / JSON / 图片 Gallery）
│   ├── 版本历史列表
│   └── 导入 / 导出 / 删除操作
└── 导入向导（DatasetImportWizard）
    ├── Step 1: 上传文件（支持 jsonl / csv / parquet / zip）
    ├── Step 2: 字段映射配置
    └── Step 3: 确认并导入
```

### 知识库页（knowledge）

```
知识库页
├── 知识库列表（KnowledgeBaseList）
│   ├── 知识库卡片（名称 / 文档数 / Embedding 模型 / 向量库）
│   └── 新建知识库按钮
├── 知识库详情（KnowledgeBaseDetail）
│   ├── 文档列表（名称 / 状态 / Chunk 数 / 上传时间）
│   ├── 上传文档（pdf / txt / md / docx / html）
│   ├── 向量检索测试面板
│   └── 删除 / 重建索引操作
└── 本体管理（OntologyPanel）- 可选高级功能
    ├── 实体类型管理
    └── 关系类型管理
```

## 技术架构

### 架构设计

```
前端 (Next.js App Router)
├── /app
│   ├── layout.tsx                    # 全局布局（TopNav + 主内容区）
│   ├── page.tsx                      # 根页面（重定向到 /workflows）
│   ├── workflows/
│   │   ├── page.tsx                  # 工作流列表 + 模板
│   │   └── [id]/
│   │       ├── page.tsx              # 工作流画布（WorkflowCanvas）
│   │       └── executions/
│   │           ├── page.tsx          # 执行列表
│   │           └── [execId]/page.tsx # 执行详情
│   ├── operators/
│   │   ├── page.tsx                  # 算子市场
│   │   └── [id]/page.tsx            # 算子详情
│   ├── datasets/
│   │   ├── page.tsx                  # 数据集列表
│   │   └── [id]/page.tsx            # 数据集详情 + 预览
│   └── knowledge/
│       ├── page.tsx                  # 知识库列表
│       └── [id]/page.tsx            # 知识库详情
├── /components                       # 业务组件
└── /lib
    ├── api.ts                        # API 客户端（统一封装 fetch）
    ├── operators.ts                  # 算子相关类型与 mock
    ├── workflows.ts                  # 工作流相关类型与 mock
    ├── datasets.ts                   # 数据集相关类型与 mock
    └── utils.ts                      # 通用工具
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                        │
│  - App Router                                                    │
│  - shadcn/ui + Tailwind CSS 4                                    │
│  - React 19                                                      │
│  - React Flow（DAG 画布）                                        │
│  - SWR / React Query（数据获取）                                  │
│  - WebSocket（执行状态实时推送）                                   │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI + Python)                   │
│  - 单服务架构（/api/v1/...）                                      │
│  - SQLite 数据库（持久化）                                        │
│  - JWT 认证（可选，开源版默认无认证）                              │
│  - WebSocket endpoint（工作流执行状态推送）                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              python-executor（算子执行引擎）                      │
│  - 本地 asyncio 模式（默认开发模式）                              │
│  - Ray 分布式模式（生产模式，ray start --head）                   │
│  - TaskScheduler（异步任务调度，支持取消 / 进度回调）              │
│  - BaseOp / Mapper / Filter / Slicer / LLM 基类               │
│  - OPERATORS 注册中心（动态加载算子包）                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              runtime/ops（内置算子生态）                          │
│  annotation/  图像目标检测、语义分割                              │
│  filter/      文本/图像过滤（重复率/敏感词/广告图 等）             │
│  mapper/      文本清洗、图像增强、PII 脱敏、格式转换 等            │
│  llms/        LLM 质量评估、QA 生成                              │
│  formatter/   格式标准化                                         │
│  slicer/      知识切片                                           │
│  user/        用户自定义上传算子（运行时热加载）                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    存储层                                        │
│  - SQLite（元数据：工作流、执行记录、数据集元信息）                  │
│  - 本地文件系统（数据集文件、算子包）                               │
│  - ChromaDB / Elasticsearch（向量存储，知识库）                   │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库表设计（SQLite）

| 表名 | 说明 |
|------|------|
| `operators` | 算子注册表（id, name, raw_id, category, version, vendor, installed, manifest_json） |
| `workflows` | 工作流定义（id, name, description, status, nodes_json, edges_json） |
| `workflow_executions` | 执行记录（id, workflow_id, status, started_at, finished_at, input_dataset_id） |
| `node_executions` | 节点执行记录（id, execution_id, node_id, status, logs_json, metrics_json） |
| `datasets` | 数据集元信息（id, name, modal, format, file_path, record_count, size） |
| `knowledge_bases` | 知识库（id, name, embed_model, vector_store, collection_name） |
| `kb_documents` | 知识库文档（id, kb_id, filename, file_type, status, chunk_count） |

### API 对接规范

所有 API 请求通过 `lib/api.ts` 统一封装，base URL 从环境变量 `NEXT_PUBLIC_API_URL` 读取（默认 `http://localhost:8000`）。

```typescript
export const api = {
  operators: {
    list: (params?) => GET('/api/v1/operators', params),
    get: (id) => GET(`/api/v1/operators/${id}`),
    install: (id) => POST(`/api/v1/operators/${id}/install`),
    uninstall: (id) => POST(`/api/v1/operators/${id}/uninstall`),
    upload: (file) => POST('/api/v1/operators/upload', file),
  },
  workflows: {
    list: () => GET('/api/v1/workflows'),
    get: (id) => GET(`/api/v1/workflows/${id}`),
    create: (data) => POST('/api/v1/workflows', data),
    update: (id, data) => PUT(`/api/v1/workflows/${id}`, data),
    run: (id, params) => POST(`/api/v1/workflows/${id}/run`, params),
    stop: (id, execId) => POST(`/api/v1/workflows/${id}/executions/${execId}/stop`),
    executions: (id) => GET(`/api/v1/workflows/${id}/executions`),
    executionDetail: (id, execId) => GET(`/api/v1/workflows/${id}/executions/${execId}`),
  },
  datasets: {
    list: (params?) => GET('/api/v1/datasets', params),
    get: (id) => GET(`/api/v1/datasets/${id}`),
    upload: (file) => POST('/api/v1/datasets/upload', file),
    preview: (id, page, size) => GET(`/api/v1/datasets/${id}/preview`, { page, size }),
    delete: (id) => DELETE(`/api/v1/datasets/${id}`),
  },
  knowledge: {
    list: () => GET('/api/v1/knowledge'),
    get: (id) => GET(`/api/v1/knowledge/${id}`),
    create: (data) => POST('/api/v1/knowledge', data),
    uploadDoc: (kbId, file) => POST(`/api/v1/knowledge/${kbId}/documents`, file),
    search: (kbId, query, topK) => POST(`/api/v1/knowledge/${kbId}/search`, { query, top_k: topK }),
    rebuildIndex: (kbId) => POST(`/api/v1/knowledge/${kbId}/reindex`),
  },
}
```

### 实时执行日志（WebSocket）

```
连接：ws://{host}/api/v1/ws/executions/{execution_id}

Server → Client 消息格式：
{
  "type": "node_status" | "node_log" | "execution_done" | "error",
  "node_id": "node-xxx",
  "status": "pending" | "running" | "completed" | "error",
  "message": "处理中...",
  "metrics": { "processed": 100, "filtered": 5, "elapsed_ms": 1200 }
}
```

### WorkflowCanvas 交互规范

使用 **React Flow** 实现 DAG 可视化：

- **节点拖拽**：从左侧算子面板拖拽算子至画布，自动创建 WorkflowNode
- **节点连线**：拖拽节点 handle 连接两节点，系统校验数据模态兼容性
- **节点配置**：点击节点打开右侧配置抽屉，根据 `operator.settings` 动态渲染参数表单
- **执行控制**：顶部工具栏「运行」按钮 → 选择输入数据集 → 触发 `POST /api/v1/workflows/{id}/run`
- **执行状态**：通过 WebSocket 实时更新各节点边框颜色
  - `running` → 蓝色脉冲边框
  - `completed` → 绿色边框
  - `error` → 红色边框

### 算子参数动态表单渲染

根据算子 `metadata.yml` 中的 `settings` 字段动态渲染，组件映射：

| settings.type | UI 组件 |
|---------------|---------|
| `slider` | shadcn `Slider` |
| `switch` | shadcn `Switch` |
| `select` | shadcn `Select` |
| `radio` | shadcn `RadioGroup` |
| `range` | 双 `Input[type=number]` 组合 |
| `checkbox` | shadcn `Checkbox` 组 |
| `input` | shadcn `Input` |

## 前端开发计划

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P0 | 补全路由结构（App Router 各页面 page.tsx） | 待开始 |
| P0 | `lib/api.ts` 统一 API 客户端封装（含 mock 模式） | 待开始 |
| P0 | 数据集页面完整实现（列表 + 详情 + 导入向导） | 待开始 |
| P0 | 知识库页面完整实现（列表 + 详情 + 搜索面板） | 待开始 |
| P1 | WorkflowCanvas 接入 React Flow，替换静态演示 | 待开始 |
| P1 | 节点配置抽屉动态参数表单渲染 | 待开始 |
| P1 | WebSocket 执行日志实时展示 | 待开始 |
| P2 | 算子上传向导（zip 包格式校验 + 热加载） | 待开始 |
| P2 | 工作流模板市场（模板卡片 + 一键导入） | 待开始 |



