# DataMate 项目总体规格说明

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 项目定位

DataMate 是一个面向 **AI 数据工程** 的开源平台，提供可视化的数据算子编排、工作流管理、数据集管理和知识库构建能力。

核心价值：
- **低代码**：通过拖拽式 DAG 画布构建数据处理流水线
- **可扩展**：标准化算子接口，支持自定义算子上传与注册
- **多模态**：支持文本、图像、音频、视频、结构化数据
- **分布式**：基于 Ray 的分布式执行引擎，支持横向扩展

---

## 2. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       DataMate 前端 (Next.js)                    │
│  工作流画布 │ 算子市场 │ 数据集管理 │ 知识库管理                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                       后端服务 (Backend)                          │
│  工作流引擎 │ 算子注册中心 │ 数据集服务 │ 知识库服务 │ 任务调度器      │
└──────┬─────────────────────────────────────────┬────────────────┘
       │                                         │
┌──────▼──────────┐                   ┌──────────▼─────────────────┐
│  存储层          │                   │  执行层 (python-executor)   │
│  SQLite / PG    │                   │  Ray 分布式执行框架           │
│  MinIO / OSS    │                   │  TaskScheduler              │
│  ChromaDB / ES  │                   │  算子沙箱 (本地 / Ray)       │
└─────────────────┘                   └────────────────────────────┘
                                                │
                               ┌────────────────▼───────────────────┐
                               │  算子生态 (runtime/ops)              │
                               │  filter/ mapper/ annotation/        │
                               │  formatter/ slicer/ llms/ user/     │
                               └────────────────────────────────────┘
```

---

## 3. 仓库目录结构说明

```
datamate/
├── .spec/                        # 规格设计文档（本目录）
├── frontend/                     # Next.js 前端应用
│   ├── app/                      # App Router 页面入口
│   ├── components/               # 业务组件
│   └── lib/                      # 前端工具库 & mock 数据
├── backend/                      # 后端服务（待实现）
│   ├── api/                      # REST API 路由
│   ├── services/                 # 业务逻辑层
│   ├── models/                   # 数据模型
│   └── db/                       # 数据库迁移脚本
├── runtime/
│   ├── ops/                      # 内置算子包集合
│   │   ├── annotation/           # 标注类算子
│   │   ├── filter/               # 过滤类算子
│   │   ├── mapper/               # 转换类算子
│   │   ├── formatter/            # 格式化类算子
│   │   ├── slicer/               # 切片类算子
│   │   ├── llms/                 # LLM 类算子
│   │   └── user/                 # 用户自定义算子（运行时上传）
│   └── python-executor/          # Ray 分布式执行框架
│       └── datamate/
│           ├── core/             # BaseOp / Mapper / Filter / Slicer / LLM
│           ├── scheduler/        # TaskScheduler（异步 + Ray 双模式）
│           ├── wrappers/         # executor.py, datamate_wrapper.py
│           └── common/utils/     # 工具函数
└── script/
    └── sqlite-init.sql           # 数据库初始化脚本
```

---

## 4. 技术选型

### 前端
| 层次 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI 组件库 | shadcn/ui + Radix UI |
| 样式 | Tailwind CSS 4 |
| React | 19.2.4 |
| 流程图 | React Flow (DAG 画布) |
| 状态管理 | Zustand / React Query |
| 请求库 | ky / fetch |
| 实时通信 | WebSocket (执行日志推送) |

### 后端
| 层次 | 技术 |
|------|------|
| 框架 | FastAPI (Python) |
| ORM | SQLAlchemy 2.x |
| 数据库 | SQLite（开发）/ PostgreSQL（生产）|
| 对象存储 | 本地文件系统 / MinIO / OSS |
| 向量数据库 | ChromaDB / Elasticsearch |
| 任务队列 | Ray / asyncio |
| 包管理 | Poetry |

### 执行层
| 层次 | 技术 |
|------|------|
| 本地模式 | asyncio + subprocess |
| 分布式模式 | Ray 2.7+ |
| 算子隔离 | Python venv / Docker |

---

## 5. 数据模型（核心实体）

### Operator（算子）
```
id, name, raw_id, description, category, version, vendor,
modal, inputs, outputs, types[], tags[], runtime{cpu,gpu,memory},
settings{}, status(installed/available), source(builtin/user)
```

### Workflow（工作流）
```
id, name, description, status(draft/running/completed/error/cancelled),
dag{nodes[], edges[]}, created_at, updated_at
```

### WorkflowNode（工作流节点）
```
id, workflow_id, operator_id, label, position{x,y},
config{params}, input_handles[], output_handles[]
```

### WorkflowExecution（执行记录）
```
id, workflow_id, status, started_at, finished_at,
input_dataset_id, output_dataset_id
```

### NodeExecution（节点执行记录）
```
id, execution_id, node_id, status, started_at, finished_at,
logs[], metrics{processed,filtered,elapsed}
```

### Dataset（数据集）
```
id, name, description, modal, format, size, record_count,
storage_path, version, created_at, tags[]
```

### KnowledgeBase（知识库）
```
id, name, description, embedding_model, vector_store,
document_count, created_at
```

### Document（知识库文档）
```
id, kb_id, name, file_type, file_size, chunk_count,
status(pending/indexing/indexed/error), created_at
```

---

## 6. 里程碑规划

| 阶段 | 内容 | 目标 |
|------|------|------|
| M1 | 前端重构 + Mock API | 完整 UI 可交互演示 |
| M2 | 后端 API 实现（算子 + 工作流） | 算子市场 + 工作流保存/执行 |
| M3 | python-executor 对接 | 真实算子执行 + 日志推送 |
| M4 | 数据集管理完整实现 | 数据预览 + 版本管理 |
| M5 | 知识库完整实现 | 文档向量化 + 检索 |
| M6 | 生产加固 | 多用户、权限、Docker 部署 |

---

## 7. 子文档索引

| 文档 | 内容 |
|------|------|
| [001-frontend-refactor.md](./001-frontend-refactor.md) | 前端页面结构与交互规格 |
| [002-backend-api.md](./002-backend-api.md) | 后端 REST API 规格 |
| [003-operator-spec.md](./003-operator-spec.md) | 算子规范与内置算子目录 |
| [004-executor-spec.md](./004-executor-spec.md) | python-executor 执行层规格 |
| [005-dataset-spec.md](./005-dataset-spec.md) | 数据集管理规格 |
| [006-knowledge-base-spec.md](./006-knowledge-base-spec.md) | 知识库规格 |
