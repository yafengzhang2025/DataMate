# python-executor 执行层规格说明

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 概述

`runtime/python-executor` 是 DataMate 的算子执行引擎，基于 Ray 构建分布式执行能力，同时支持本地 asyncio 单机模式，适配开发与生产两种场景。

---

## 2. 目录结构

```
runtime/python-executor/
└── datamate/
    ├── core/
    │   ├── base_op.py          # BaseOp, Mapper, Filter, Slicer, LLM, OPERATORS 注册中心
    │   ├── dataset.py          # Dataset 数据集处理（迭代器、分片）
    │   └── constant.py         # 常量定义
    ├── scheduler/
    │   ├── scheduler.py        # TaskScheduler（异步，支持取消/进度回调）
    │   ├── func_task_scheduler.py  # 函数任务调度
    │   └── cmd_task_scheduler.py   # 命令行任务调度
    ├── wrappers/
    │   ├── executor.py         # Ray 执行器入口
    │   ├── datamate_wrapper.py # DataMate 任务包装（串联算子链）
    │   └── data_juicer_wrapper.py  # DataJuicer 兼容适配
    ├── ops/                    # 软链接 or sys.path 指向 runtime/ops/
    ├── operator_runtime.py     # 算子运行时管理（加载/卸载/热更新）
    ├── auto_annotation_worker.py  # 自动标注 Worker
    └── common/utils/
        ├── bytes_transform.py
        ├── file_scanner.py
        ├── lazy_loader.py
        └── text_splitter.py
```

---

## 3. 核心组件

### 3.1 BaseOp 基类体系

```
BaseOp
├── Mapper     # 1:1 转换，execute(sample) -> Dict
├── Filter     # 过滤，execute(sample) -> bool
├── Slicer     # 1:N 切分，execute(sample) -> List[Dict]
└── LLM        # 继承 Mapper，封装 LLM 调用
```

所有算子通过 `OPERATORS` 单例注册中心统一管理：
- 启动时：内置算子批量注册
- 运行时：用户上传算子动态注册（热加载）

### 3.2 TaskScheduler

```python
class TaskScheduler:
    max_concurrent: int = 10           # 最大并发任务数
    tasks: Dict[str, Task]             # 任务字典
    semaphore: asyncio.Semaphore       # 并发控制

    async def submit(task_id, coro, *args, **kwargs) -> str
    async def cancel(task_id) -> bool
    def get_status(task_id) -> TaskResult
    def list_tasks() -> List[Task]
```

Task 状态流转：`pending → running → completed | error | cancelled`

### 3.3 执行模式

#### 本地模式（开发默认）

```python
# datamate_wrapper.py
async def run_workflow(workflow_dag, dataset, params):
    for node in topological_sort(workflow_dag):
        op = OPERATORS.get(node.operator_id)(**node.config)
        dataset = await apply_operator(op, dataset)
    return dataset
```

算子串行按 DAG 拓扑排序执行，每个算子对数据集分批迭代处理。

#### Ray 分布式模式（生产）

```python
import ray

@ray.remote
def execute_op_remote(op_config, sample_batch):
    op = OPERATORS.get(op_config['raw_id'])(**op_config['params'])
    return [op.execute(s) for s in sample_batch]

# 并行提交批次
futures = [execute_op_remote.remote(op_config, batch) for batch in batches]
results = ray.get(futures)
```

---

## 4. 工作流执行流程

```
后端接收 POST /api/v1/workflows/{id}/run
    │
    ▼
解析工作流 DAG（nodes + edges）
    │
    ▼
对 nodes 做拓扑排序
    │
    ▼
加载输入数据集（Dataset 迭代器）
    │
    ▼
for each node in sorted_nodes:
    ├── 从 OPERATORS 中心加载算子类
    ├── 实例化算子（注入 node.config 参数）
    ├── 调用 TaskScheduler.submit(...)
    ├── 流式处理数据集每个 sample
    │   ├── Mapper: sample = op.execute(sample)
    │   ├── Filter: if not op.execute(sample): skip
    │   └── Slicer: samples.extend(op.execute(sample))
    └── 通过 WebSocket 推送节点状态/日志/metrics
    │
    ▼
写出结果数据集
    │
    ▼
更新 workflow_executions 表状态
    │
    ▼
推送 execution_done 消息
```

---

## 5. 进度与日志推送

执行器通过回调函数向后端 WebSocket 推送进度：

```python
async def progress_callback(event: ExecutionEvent):
    await ws_manager.send(execution_id, event.to_dict())

# event 类型
@dataclass
class ExecutionEvent:
    type: str       # node_status | node_log | execution_done | error
    node_id: str
    status: str     # pending | running | completed | error
    message: str
    metrics: dict   # processed, filtered, elapsed_ms
```

---

## 6. 安装与启动

### 6.1 依赖安装

```bash
cd runtime/python-executor
poetry install
```

### 6.2 本地模式启动（随后端服务自动启动）

无需额外操作，后端服务直接调用 python-executor 接口。

### 6.3 Ray 分布式模式

```bash
# 启动 Ray Head 节点
ray start --head --port=6379

# 启动 Ray Worker 节点（多机）
ray start --address=<head-ip>:6379

# 验证集群
ray status
```

后端通过环境变量 `RAY_ADDRESS=<head-ip>:6379` 连接 Ray 集群。

---

## 7. 算子热加载实现

```python
# operator_runtime.py
import importlib

def load_operator(module_path: str, class_name: str):
    """动态加载算子类"""
    module = importlib.import_module(module_path)
    return getattr(module, class_name)

def reload_operator(module_path: str):
    """热重载算子模块（用于开发调试）"""
    import sys
    if module_path in sys.modules:
        importlib.reload(sys.modules[module_path])
```

用户上传算子后，后端：
1. 解压到 `runtime/ops/user/{package_name}/`
2. 执行 `pip install -r requirements.txt`（如有）
3. 调用 `OPERATORS.register_module(...)` 动态注册
4. 无需重启服务

---

## 8. 资源限制

Ray 模式下，根据 `metadata.yml` 中的 `runtime` 配置为每个算子分配资源：

```python
@ray.remote(num_cpus=op.runtime.cpu, num_gpus=op.runtime.gpu, memory=op.runtime.memory)
def execute_op_remote(op_config, sample_batch):
    ...
```

本地模式不做资源隔离，但记录执行耗时与处理条数用于性能分析。

---

## 9. 环境变量配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `EXECUTOR_MODE` | `local` | 执行模式：`local` / `ray` |
| `RAY_ADDRESS` | `auto` | Ray 集群地址 |
| `OPS_DIR` | `runtime/ops` | 算子包根目录 |
| `MAX_CONCURRENT_TASKS` | `10` | 最大并发任务数 |
| `BATCH_SIZE` | `100` | 每批处理条数 |
