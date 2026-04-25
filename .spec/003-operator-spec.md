# 算子规范与内置算子目录

> 版本: v0.1.0 | 日期: 2026-04-21

---

## 1. 算子分类体系

| 分类 key | 中文名 | 说明 |
|----------|--------|------|
| `filter` | 过滤器 | 对数据样本做 bool 判断，决定保留或丢弃 |
| `mapper` | 转换器 | 对数据样本做 1:1 转换处理 |
| `slicer` | 切片器 | 对数据样本做 1:N 切分 |
| `formatter` | 格式化器 | 格式标准化处理 |
| `annotation` | 标注器 | 对数据添加标注信息 |
| `llms` | LLM 算子 | 调用大语言模型完成评估、生成等任务 |
| `user` | 用户自定义 | 用户上传的自定义算子（运行时热加载） |

---

## 2. 算子开发规范

### 2.1 目录结构

```
operator_package/
├── __init__.py        # 算子注册入口
├── metadata.yml       # 算子元数据 & UI 参数定义
├── process.py         # 算子核心逻辑
├── requirements.txt   # 可选，第三方依赖
└── README.md          # 可选，说明文档
```

### 2.2 基类继承

```python
from datamate.core.base_op import Mapper, Filter, Slicer, LLM

# Mapper: 1:1 转换（文本清洗、图像处理等）
class MyMapper(Mapper):
    def execute(self, sample: Dict) -> Dict: ...

# Filter: 返回 bool，True=保留
class MyFilter(Filter):
    def execute(self, sample: Dict) -> bool: ...

# Slicer: 1:N 切分
class MySlicer(Slicer):
    def execute(self, sample: Dict) -> List[Dict]: ...

# LLM: 调用大模型
class MyLLM(LLM):
    def build_llm_prompt(self, sample: Dict) -> str: ...
    def execute(self, sample: Dict) -> Dict: ...
```

### 2.3 sample 数据结构

```json
{
  "text": "文本内容",
  "data": "<binary>（图像等二进制数据）",
  "fileName": "example.jpg",
  "fileType": "jpg",
  "fileId": "file-001",
  "filePath": "/data/input/example.jpg",
  "fileSize": 102400,
  "export_path": "/data/output/",
  "ext_params": {},
  "target_type": "jpg"
}
```

### 2.4 metadata.yml 规范

```yaml
name: 算子显示名称
description: 算子描述
language: python
raw_id: MyOperatorClassName      # 必须与 process.py 类名一致
version: 1.0.0
vendor: datamate
modal: text                      # text/image/audio/video
inputs: text
outputs: text
types:
  - cleaning                     # cleaning/annotation
runtime:
  memory: 10485760               # bytes
  cpu: 0.1
  gpu: 0
metrics:
  - name: 吞吐量
    metric: 1000 docs/sec
settings:
  myParam:
    name: 参数名称
    description: 参数描述
    type: slider                 # slider/switch/select/radio/range/checkbox/input
    defaultVal: 0.5
    required: false
    min: 0
    max: 1
    step: 0.1
```

### 2.5 注册规范（`__init__.py`）

```python
from datamate.core.base_op import OPERATORS

OPERATORS.register_module(
    module_name='MyOperatorClassName',
    module_path="ops.filter.my_operator.process"
)
```

### 2.6 算子打包与上传

- 压缩包格式：`.zip` 或 `.tar.gz`
- 压缩包名 = `module_path` 最后一级目录名（如 `my_operator.zip`）
- 上传后后端自动解压到 `runtime/ops/user/` 并热加载

---

## 3. 内置算子目录

### 3.1 filter（过滤器）

| 算子目录名 | 功能描述 | 模态 |
|------------|----------|------|
| `file_with_high_repeat_phrase_rate_filter` | 过滤高重复短语率文件 | text |
| `file_with_high_repeat_word_rate_filter` | 过滤高重复词汇率文件 | text |
| `file_with_high_special_char_rate_filter` | 过滤高特殊字符率文件 | text |
| `img_advertisement_images_cleaner` | 过滤广告图像 | image |
| `img_blurred_images_cleaner` | 过滤模糊图像 | image |
| `img_duplicated_images_cleaner` | 过滤重复图像 | image |
| `img_similar_images_cleaner` | 过滤相似图像 | image |
| `remove_duplicate_file` | 去除重复文件 | text |
| `remove_file_with_many_sensitive_words` | 过滤含大量敏感词文件 | text |
| `remove_file_with_short_or_long_length` | 过滤过短或过长文件 | text |

### 3.2 mapper（转换器）

| 算子目录名 | 功能描述 | 模态 |
|------------|----------|------|
| `content_cleaner` | 内容清洗 | text |
| `credit_card_number_cleaner` | 信用卡号脱敏 | text |
| `email_cleaner` | 邮箱脱敏 | text |
| `emoji_cleaner` | Emoji 清除 | text |
| `extra_space_cleaner` | 多余空格清除 | text |
| `full_width_characters_cleaner` | 全角字符转半角 | text |
| `garble_characters_cleaner` | 乱码字符清除 | text |
| `html_tag_cleaner` | HTML 标签清除 | text |
| `id_number_cleaner` | 身份证号脱敏 | text |
| `img_denoise` | 图像去噪 | image |
| `img_direction_correct` | 图像方向纠正 | image |
| `img_enhanced_brightness` | 图像亮度增强 | image |
| `img_enhanced_contrast` | 图像对比度增强 | image |
| `img_enhanced_saturation` | 图像饱和度增强 | image |
| `img_enhanced_sharpness` | 图像锐化 | image |
| `img_perspective_transformation` | 图像透视变换 | image |
| `img_resize` | 图像尺寸调整 | image |
| `img_shadow_remove` | 图像去阴影 | image |
| `img_type_unify` | 图像格式统一 | image |
| `invisible_characters_cleaner` | 不可见字符清除 | text |
| `ip_address_cleaner` | IP 地址脱敏 | text |
| `knowledge_relation_slice` | 知识关系切片 | text |
| `legend_cleaner` | 图例清除 | text |
| `phone_number_cleaner` | 手机号脱敏 | text |
| `pii_ner_detection` | PII 命名实体识别脱敏 | text |
| `political_word_cleaner` | 政治敏感词清除 | text |
| `remove_duplicate_sentences` | 去重复句子 | text |
| `sexual_and_violent_word_cleaner` | 色情暴力词清除 | text |
| `text_to_word` | 文本分词 | text |
| `traditional_chinese` | 繁简体转换 | text |
| `unicode_space_cleaner` | Unicode 空格清除 | text |
| `url_cleaner` | URL 清除 | text |
| `xml_tag_cleaner` | XML 标签清除 | text |

### 3.3 annotation（标注器）

| 算子目录名 | 功能描述 | 模态 |
|------------|----------|------|
| `image_object_detection_bounding_box` | 图像目标检测标注（BBox） | image |
| `image_semantic_segmentation` | 图像语义分割标注 | image |

### 3.4 llms（LLM 算子）

| 算子目录名 | 功能描述 | 模态 |
|------------|----------|------|
| `qa_condition_evaluator` | QA 条件质量评估 | text |
| `text_quality_evaluation` | 文本质量评估 | text |

### 3.5 slicer（切片器）

> 路径：`runtime/ops/slicer/`（待补充内置算子）

| 算子目录名 | 功能描述 | 模态 |
|------------|----------|------|
| `knowledge_slicer`（规划中） | 按语义切分知识文档 | text |

### 3.6 formatter（格式化器）

> 路径：`runtime/ops/formatter/`（待补充内置算子）

---

## 4. 算子注册中心机制

`OPERATORS` 是全局单例注册中心，维护 `module_name → module_path` 映射。

```python
# 注册
OPERATORS.register_module(module_name='MyFilter', module_path='ops.filter.my_filter.process')

# 实例化（执行时）
op_class = OPERATORS.get('MyFilter')
op_instance = op_class(**params)
result = op_instance.execute(sample)
```

内置算子在服务启动时自动注册（通过各分类 `__init__.py` 批量 import）。
用户自定义算子在上传解压后动态注册，无需重启服务。

---

## 5. 算子执行标签

前端算子卡片显示的运行环境标签由 `metadata.yml` 中 `runtime` 字段推断：

| 条件 | 标签 |
|------|------|
| `gpu = 0 and npu = 0` | `LOCAL CPU` |
| `gpu > 0` | `LOCAL GPU` |
| `npu > 0` | `NPU` |
| 工作流 `mode=ray` 执行 | `RAY` |
| `types` 包含 `llm` 或依赖外部 API | `LLM` |
