# 数据集管理规格说明

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 数据集类型

| 模态 | 支持格式 | 说明 |
|------|----------|------|
| text | `.jsonl`, `.csv`, `.parquet`, `.txt` | 文本数据集 |
| image | `.zip`（含图片）, `.jsonl`（含路径/base64）| 图像数据集 |
| audio | `.zip`（含音频）, `.jsonl`（含路径）| 音频数据集 |
| video | `.zip`（含视频）, `.jsonl`（含路径）| 视频数据集 |
| structured | `.csv`, `.parquet`, `.xlsx` | 结构化数据集 |

---

## 2. 数据集生命周期

```
上传 → 解析（字段推断）→ 预览确认 → 存储 → 版本化
  │                                              │
  └──────────── 工作流输入/输出数据集 ────────────┘
```

---

## 3. 存储结构

```
/data/datasets/
└── {dataset_id}/
    ├── metadata.json        # 数据集元信息（名称、模态、格式、字段、条数、大小）
    ├── data.jsonl           # 统一内部存储格式（jsonl）
    ├── original/            # 保留原始上传文件
    │   └── {filename}
    └── versions/
        ├── v1/data.jsonl
        └── v2/data.jsonl    # 工作流处理后的输出版本
```

---

## 4. 数据集元信息（metadata.json）

```json
{
  "id": "ds-001",
  "name": "中文新闻语料",
  "description": "...",
  "modal": "text",
  "format": "jsonl",
  "record_count": 10000,
  "size_bytes": 52428800,
  "columns": ["text", "label", "source"],
  "version": 1,
  "storage_path": "/data/datasets/ds-001/data.jsonl",
  "created_at": "2026-04-21T10:00:00Z",
  "tags": ["nlp", "news"]
}
```

---

## 5. 前端页面规格

### 5.1 数据集列表页

- 卡片展示：名称、模态图标、格式、条数、大小、创建时间
- 筛选：按模态（text/image/audio/video/structured）
- 搜索：按名称关键词
- 操作：创建、上传、删除

### 5.2 数据集详情页

- **基础信息面板**：名称、描述、模态、格式、版本、存储路径、条数、大小
- **数据预览面板**：
  - text/structured：表格分页展示（20 条/页）
  - image：图片 Gallery 展示
  - audio/video：列表 + 播放器
- **版本历史**：版本号、来源工作流、时间、条数变化
- **操作**：下载原始文件、导出为其他格式、删除

### 5.3 导入向导（DatasetImportWizard）

```
Step 1: 上传文件
  - 拖拽或点击上传（支持 .jsonl/.csv/.parquet/.zip）
  - 文件大小限制：2GB（可配置）
  - 上传进度条

Step 2: 配置
  - 数据集名称、描述
  - 模态选择
  - 字段映射（自动推断 + 手动调整）
    - text_key：指定文本字段名（默认 "text"）
    - 其他字段：保留或过滤

Step 3: 预览确认
  - 展示前 20 条数据
  - 显示字段信息、总条数估算
  - 确认导入
```

---

## 6. 数据集与工作流集成

工作流执行时：

1. **输入**：用户在「运行工作流」对话框中选择已有数据集作为输入
2. **处理**：python-executor 读取数据集，逐条通过算子链处理
3. **输出**：处理结果自动保存为新数据集版本（或新建数据集）
4. **关联**：`workflow_executions` 表记录 `input_dataset_id` 和 `output_dataset_id`
