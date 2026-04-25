-- =============================================================
-- DataMate SQLite 初始化脚本
-- 用途：本地开发 & 生产 SQLite 数据库初始化
-- 兼容性：SQLite 3.35+
-- =============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =============================================================
-- 算子表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_operator
(
    id           TEXT    NOT NULL PRIMARY KEY,
    name         TEXT    NOT NULL UNIQUE,
    description  TEXT,
    version      TEXT    NOT NULL DEFAULT '1.0.0',
    -- 功能分类：cleaning/filtering/annotation/formatting/mapping/deduplication/slicing
    category     TEXT,
    -- 输入/输出模态：text/image/audio/video/multimodal
    input_modal  TEXT,
    output_modal TEXT,
    -- 输入/输出端口数（前端需要 number 类型）
    input_count  INTEGER NOT NULL DEFAULT 1,
    output_count INTEGER NOT NULL DEFAULT 1,
    -- 标签 JSON 数组，如 '["DataMate","CPU"]'
    tags         TEXT    NOT NULL DEFAULT '[]',
    -- 运行时/设置 JSON
    runtime      TEXT,
    settings     TEXT,
    file_name    TEXT             DEFAULT '',
    file_size    INTEGER          DEFAULT 0,
    metrics      TEXT,
    -- 是否已安装（1=已安装, 0=未安装）
    installed    INTEGER NOT NULL DEFAULT 1,
    is_star      INTEGER NOT NULL DEFAULT 0,
    usage_count  INTEGER NOT NULL DEFAULT 0,
    created_by   TEXT             DEFAULT 'system',
    updated_by   TEXT             DEFAULT 'system',
    created_at   TEXT             DEFAULT (datetime('now')),
    updated_at   TEXT             DEFAULT (datetime('now'))
);

-- =============================================================
-- 算子分类表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_operator_category
(
    id         TEXT NOT NULL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    name_en    TEXT,
    value      TEXT UNIQUE,
    type       TEXT,
    parent_id  TEXT         DEFAULT '0',
    created_by TEXT         DEFAULT 'system',
    updated_by TEXT         DEFAULT 'system',
    created_at TEXT         DEFAULT (datetime('now')),
    updated_at TEXT         DEFAULT (datetime('now'))
);

-- =============================================================
-- 算子分类关联表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_operator_category_relation
(
    category_id TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    created_by  TEXT DEFAULT 'system',
    updated_by  TEXT DEFAULT 'system',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (category_id, operator_id)
);

-- =============================================================
-- 算子版本发布表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_operator_release
(
    id           TEXT NOT NULL,
    version      TEXT NOT NULL,
    release_date TEXT DEFAULT (datetime('now')),
    changelog    TEXT, -- JSON array
    created_by   TEXT DEFAULT 'system',
    updated_by   TEXT DEFAULT 'system',
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, version)
);

-- =============================================================
-- 触发器：自动更新 updated_at
-- =============================================================
CREATE TRIGGER IF NOT EXISTS trg_t_operator_updated_at
    AFTER UPDATE
    ON t_operator
    FOR EACH ROW
BEGIN
    UPDATE t_operator SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- =============================================================
-- 分类数据
-- =============================================================
INSERT OR IGNORE INTO t_operator_category(id, name, name_en, value, type, parent_id)
VALUES
-- 一级：模态
('64465bec-b46b-11f0-8291-00155d0e4808', '模态', 'Modal', 'modal', 'predefined', '0'),
('d8a5df7a-52a9-42c2-83c4-01062e60f597', '文本', 'Text', 'text', 'predefined', '64465bec-b46b-11f0-8291-00155d0e4808'),
('de36b61c-9e8a-4422-8c31-d30585c7100f', '图片', 'Image', 'image', 'predefined', '64465bec-b46b-11f0-8291-00155d0e4808'),
('42dd9392-73e4-458c-81ff-41751ada47b5', '音频', 'Audio', 'audio', 'predefined', '64465bec-b46b-11f0-8291-00155d0e4808'),
('a233d584-73c8-4188-ad5d-8f7c8dda9c27', '视频', 'Video', 'video', 'predefined', '64465bec-b46b-11f0-8291-00155d0e4808'),
('4d7dbd77-0a92-44f3-9056-2cd62d4a71e4', '多模态', 'Multimodal', 'multimodal', 'predefined', '64465bec-b46b-11f0-8291-00155d0e4808'),
-- 一级：功能
('4857cc9e-7b72-429e-b2a8-ddd1c48c4483', '功能', 'Function', 'function', 'predefined', '0'),
('8c09476a-a922-418f-a908-733f8a0de521', '清洗', 'Cleaning', 'cleaning', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('f1a2b3c4-1111-2222-3333-444455556661', '过滤', 'Filtering', 'filtering', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('cfa9d8e2-5b5f-4f1e-9f12-1234567890ab', '标注', 'Annotation', 'annotation', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('b2c3d4e5-2222-3333-4444-555566667771', '格式化', 'Formatting', 'formatting', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('c3d4e5f6-3333-4444-5555-666677778881', '映射转换', 'Mapping', 'mapping', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('d4e5f6a7-4444-5555-6666-777788889991', '去重', 'Deduplication', 'deduplication', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
('e5f6a7b8-5555-6666-7777-888899990001', '切片分割', 'Slicing', 'slicing', 'predefined', '4857cc9e-7b72-429e-b2a8-ddd1c48c4483'),
-- 一级：来源
('16e2d99e-eafb-44fc-acd0-f35a2bad28f8', '来源', 'Origin', 'origin', 'predefined', '0'),
('96a3b07a-3439-4557-a835-525faad60ca3', '系统预置', 'System Preset', 'predefined', 'predefined', '16e2d99e-eafb-44fc-acd0-f35a2bad28f8'),
('ec2cdd17-8b93-4a81-88c4-ac9e98d10757', '用户上传', 'User Upload', 'customized', 'predefined', '16e2d99e-eafb-44fc-acd0-f35a2bad28f8'),
-- 一级：归属厂商
('0ed75eea-e20b-11f0-88e6-00155d5c9528', '归属', 'Vendor', 'vendor', 'predefined', '0'),
('431e7798-5426-4e1a-aae6-b9905a836b34', 'DataMate', 'DataMate', 'datamate', 'predefined', '0ed75eea-e20b-11f0-88e6-00155d5c9528'),
('79b385b4-fde8-4617-bcba-02a176938996', 'DataJuicer', 'DataJuicer', 'data-juicer', 'predefined', '0ed75eea-e20b-11f0-88e6-00155d5c9528'),
('f00eaa3e-96c1-4de4-96cd-9848ef5429ec', '其他', 'Others', 'others', 'predefined', '0ed75eea-e20b-11f0-88e6-00155d5c9528'),
-- 一级：语言
('873000a2-65b3-474b-8ccc-4813c08c76fb', '语言', 'Language', 'language', 'predefined', '0'),
('9eda9d5d-072b-499b-916c-797a0a8750e1', 'Python', 'Python', 'python', 'predefined', '873000a2-65b3-474b-8ccc-4813c08c76fb');

-- =============================================================
-- DataMate 内置算子
-- 字段顺序：id, name, description, version, category, input_modal, output_modal,
--           input_count, output_count, tags, settings, file_name, file_size, is_star
-- =============================================================
INSERT OR IGNORE INTO t_operator
    (id, name, description, version, category, input_modal, output_modal, input_count, output_count, tags, settings, file_name, file_size, is_star)
VALUES
-- ── 格式化 ──────────────────────────────────────────────────
('MineruFormatter', 'MinerU PDF文本抽取', '基于MinerU API，抽取PDF中的文本。', '1.0.0', 'formatting', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"mineruApi":{"name":"Mineru Api地址","description":"指定mineru服务的api地址","type":"input","defaultVal":"http://datamate-mineru:8000","required":false},"exportType":{"name":"导出类型","type":"select","defaultVal":"markdown","required":false,"options":[{"label":"markdown","value":"md"},{"label":"txt","value":"txt"}]}}',
 '', 12288, 0),
-- ── 过滤（文本）──────────────────────────────────────────────
('FileWithHighRepeatPhraseRateFilter', '文档词重复率检查', '去除重复词过多的文档。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"repeatPhraseRatio":{"name":"文档词重复率","type":"slider","defaultVal":0.5,"min":0,"max":1,"step":0.1},"hitStopwords":{"name":"去除停用词","type":"switch","defaultVal":false}}',
 '', 16384, 0),
('FileWithHighRepeatWordRateFilter', '文档字重复率检查', '去除重复字过多的文档。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"repeatWordRatio":{"name":"文档字重复率","type":"slider","defaultVal":0.5,"min":0,"max":1,"step":0.1}}',
 '', 8192, 0),
('FileWithHighSpecialCharRateFilter', '文档特殊字符率检查', '去除特殊字符过多的文档。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"specialCharRatio":{"name":"文档特殊字符率","type":"slider","defaultVal":0.3,"min":0,"max":1,"step":0.1}}',
 '', 5120, 0),
('DuplicateFilesFilter', '相似文档去除', '相似文档去除。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"fileDuplicateThreshold":{"name":"文档相似度","type":"slider","defaultVal":0.5,"min":0,"max":1,"step":0.1}}',
 '', 13312, 0),
('FileWithManySensitiveWordsFilter', '文档敏感词率检查', '去除敏感词过多的文档。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"sensitiveWordsRate":{"name":"文档敏感词率","type":"slider","defaultVal":0.01,"min":0,"max":1,"step":0.01}}',
 '', 29696, 0),
('FileWithShortOrLongLengthFilter', '文档字数检查', '字数不在指定范围会被过滤掉。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"fileLength":{"name":"文档字数","type":"range","defaultVal":[10,10000000],"min":0,"max":10000000000000000,"step":1}}',
 '', 8192, 0),
('DuplicateSentencesFilter', '文档局部内容去重', '文档局部内容去重。', '1.0.0', 'filtering', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 5120, 0),
-- ── 清洗（文本）──────────────────────────────────────────────
('ContentCleaner', '文档目录去除', '去除文档中的目录。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('AnonymizedCreditCardNumber', '信用卡号匿名化', '信用卡号匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('EmailNumberCleaner', '邮件地址匿名化', '邮件地址匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('EmojiCleaner', '文档表情去除', '去除文档中表情字符或者emoji符号。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 5120, 0),
('ExtraSpaceCleaner', '多余空格去除', '移除文档首尾、句中或标点符号附近多余空格和 tab 等。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('FullWidthCharacterCleaner', '全角转半角', '将文档中的所有全角字符转换成半角字符。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('GrableCharactersCleaner', '文档乱码去除', '去除文档中的乱码和无意义的unicode。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('HtmlTagCleaner', 'HTML标签去除', '移除文档中HTML标签。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]',
 '{"removeTableTags":{"name":"是否去除表格标签","type":"switch","defaultVal":"false","checkedLabel":"是","unCheckedLabel":"否"}}',
 '', 12288, 0),
('AnonymizedIdNumber', '身份证号匿名化', '身份证号匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 36864, 0),
('InvisibleCharactersCleaner', '不可见字符去除', '去除文档中的不可见字符。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 5120, 0),
('AnonymizedIpAddress', 'IP地址匿名化', 'IP地址匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('LegendCleaner', '图注表注去除', '去除文档中的图注、表注等内容。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('AnonymizedPhoneNumber', '电话号码匿名化', '电话号码匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('PoliticalWordCleaner', '政治文本匿名化', '将政治文本进行匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('SexualAndViolentWordCleaner', '暴力色情文本匿名化', '将暴力、色情文本进行匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 20480, 0),
('TraditionalChineseCleaner', '繁体转简体', '将繁体转换为简体。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 5120, 0),
('UnicodeSpaceCleaner', '空格标准化', '将文档中不同的 unicode 空格转换为正常空格。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('AnonymizedUrlCleaner', 'URL网址匿名化', '将文档中的url网址匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('XMLTagCleaner', 'XML标签去除', '去除XML中的标签。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('PiiDetector', '高级匿名化', '高级匿名化算子，检测命名实体并匿名化。', '1.0.0', 'cleaning', 'text', 'text', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
-- ── 清洗（图像）──────────────────────────────────────────────
('ImgBlurredImagesCleaner', '模糊图片过滤', '去除模糊的图片。', '1.0.0', 'filtering', 'image', 'image', 1, 1, '["DataMate","CPU"]',
 '{"blurredThreshold":{"name":"梯度函数值","type":"slider","defaultVal":1000,"min":1,"max":10000,"step":1}}',
 '', 5120, 0),
('ImgBrightness', '图片亮度增强', '自适应调节图片的亮度。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgContrast', '图片对比度增强', '自适应调节图片的对比度。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgDenoise', '图片噪点去除', '去除图片中的噪点，主要适用于自然场景。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgDuplicatedImagesCleaner', '重复图片去除', '去除重复的图片。', '1.0.0', 'filtering', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('ImgPerspectiveTransformation', '图片透视变换', '自适应校正图片的视角。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
('ImgResize', '图片重采样', '将图片放大或缩小到指定像素。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]',
 '{"widthSize":{"name":"宽度","type":"inputNumber","defaultVal":256,"min":1,"max":4096,"step":1},"heightSize":{"name":"高度","type":"inputNumber","defaultVal":256,"min":1,"max":4096,"step":1}}',
 '', 8192, 0),
('ImgSaturation', '图片饱和度增强', '自适应调节图片的饱和度。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgShadowRemove', '图片阴影去除', '去除图片中的阴影。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgSharpness', '图片锐度增强', '自适应调节图片的锐度。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 4096, 0),
('ImgSimilarImagesCleaner', '相似图片去除', '去除相似的图片。', '1.0.0', 'filtering', 'image', 'image', 1, 1, '["DataMate","CPU"]',
 '{"similarThreshold":{"name":"相似度","type":"slider","defaultVal":0.8,"min":0,"max":1,"step":0.01}}',
 '', 14336, 0),
('ImgTypeUnify', '图片格式转换', '将图片编码格式统一为jpg、png等格式。', '1.0.0', 'formatting', 'image', 'image', 1, 1, '["DataMate","CPU"]',
 '{"imgType":{"name":"图片编码格式","type":"select","defaultVal":"jpg","options":[{"label":"jpg","value":"jpg"},{"label":"png","value":"png"},{"label":"jpeg","value":"jpeg"},{"label":"bmp","value":"bmp"}]}}',
 '', 5120, 0),
('ImgDirectionCorrect', '图片方向校正', '将含有文字的图片校正到文字水平方向。', '1.0.0', 'cleaning', 'image', 'image', 1, 1, '["DataMate","CPU"]', null, '', 8192, 0),
-- ── 标注 ─────────────────────────────────────────────────────
('ObjectDetectionRectangle', '图像目标检测与预标注', '基于 YOLOv8 的图像目标检测算子，输出矩形框标注及 Label Studio 兼容格式。', '1.0.0', 'annotation', 'image', 'json', 1, 2, '["DataMate","GPU"]', null, '', 12288, 0),

-- =============================================================
-- DataJuicer 算子
-- =============================================================

-- ── 去重 ─────────────────────────────────────────────────────
('entity_attribute_aggregator', '实体属性聚合器', '汇总一组文档中实体的给定属性。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('meta_tags_aggregator', '元标签聚合器', '将类似的元标记合并到一个统一的标记中。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('most_relevant_entities_aggregator', '最相关实体聚合器', '从提供的文本中提取与给定实体密切相关的实体并对其进行排名。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('nested_aggregator', '嵌套聚合器', '将多个示例中的嵌套内容聚合到单个摘要中。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('document_deduplicator', '文档去重器', '使用完全匹配在文档级别删除重复的样本。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('document_minhash_deduplicator', '文档MinHash去重器', '使用MinHash LSH在文档级别删除重复样本。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('document_simhash_deduplicator', '文档SimHash去重器', '使用SimHash在文档级别删除重复的样本。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_deduplicator', '图像去重器', '通过图像的精确匹配在文档级别删除重复的样本。', '1.4.4', 'deduplication', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('ray_basic_deduplicator', 'Ray基础去重器', 'deduplicator的后端。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('ray_bts_minhash_deduplicator', 'Ray BTS MinHash去重器', '具有负载平衡的Union-Find的分布式实现。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('ray_document_deduplicator', 'Ray文档去重器', '在Ray分布式模式下使用精确匹配在文档级别删除重复的样本。', '1.4.4', 'deduplication', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('ray_image_deduplicator', 'Ray图像去重器', '在光线分布模式下使用图像的精确匹配在文档级别删除重复样本。', '1.4.4', 'deduplication', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('ray_video_deduplicator', 'Ray视频去重器', '在Ray分布式模式下使用视频的精确匹配在文档级删除重复样本。', '1.4.4', 'deduplication', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_deduplicator', '视频去重器', '使用视频的精确匹配在文档级别删除重复的样本。', '1.4.4', 'deduplication', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
-- ── 过滤 ─────────────────────────────────────────────────────
('alphanumeric_filter', '字母数字过滤器', '过滤器，以保持具有特定范围内的字母/数字比率的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('audio_duration_filter', '音频时长过滤器', '保留音频持续时间在指定范围内的数据样本。', '1.4.4', 'filtering', 'audio', 'audio', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('audio_nmf_snr_filter', '音频NMF信噪比过滤器', '保留音频信噪比在指定范围内的数据样本。', '1.4.4', 'filtering', 'audio', 'audio', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('audio_size_filter', '音频大小过滤器', '根据音频文件的大小保留数据样本。', '1.4.4', 'filtering', 'audio', 'audio', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('average_line_length_filter', '平均行长过滤器', '过滤器，以保持平均线长度在特定范围内的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('character_repetition_filter', '字符重复过滤器', '过滤器将具有字符级n-gram重复比的样本保持在特定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('flagged_words_filter', '标记词过滤器', '过滤器将标记词比率的样本保留在指定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('general_field_filter', '通用字段过滤器', '根据常规字段筛选条件保留样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_aesthetics_filter', '图像美学过滤器', '过滤以保持美学分数在特定范围内的样品。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_aspect_ratio_filter', '图像长宽比过滤器', '过滤器，以保持样本的图像纵横比在特定范围内。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_face_count_filter', '图像人脸计数过滤器', '过滤以保持样本的面数在特定范围内。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_face_ratio_filter', '图像人脸占比过滤器', '过滤以保持面面积比在特定范围内的样本。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_nsfw_filter', '图像NSFW过滤器', '过滤器保留其图像的nsfw分数在指定范围内的样本。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_pair_similarity_filter', '图像对相似度过滤器', '过滤器将图像之间具有相似性的图像对保持在特定范围内。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_shape_filter', '图像形状过滤器', '过滤器，以保持样本的图像形状(宽度，高度)在特定的范围内。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_size_filter', '图像大小过滤器', '保留图像大小在特定范围内的数据样本。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_text_matching_filter', '图文匹配过滤器', '过滤器将图像文本匹配分数的样本保持在特定范围内。', '1.4.4', 'filtering', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_text_similarity_filter', '图文相似度过滤器', '过滤器将具有图像-文本相似性的样本保持在指定范围内。', '1.4.4', 'filtering', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_watermark_filter', '图像水印过滤器', '过滤器以保持其图像没有水印的样本具有高概率。', '1.4.4', 'filtering', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('in_context_influence_filter', '上下文影响过滤器', '根据文本在上下文中对验证集的影响来保留文本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('instruction_following_difficulty_filter', '指令跟随难度过滤器', '根据IFD分数过滤文本样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('language_id_score_filter', '语种识别得分过滤器', '保留置信度高于阈值的特定语言的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('llm_analysis_filter', 'LLM分析过滤器', '用于利用LLMs分析和过滤数据样本的基本筛选器类。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('llm_difficulty_score_filter', 'LLM难度得分过滤器', '保留由LLM估计的高难度分数的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('llm_perplexity_filter', 'LLM困惑度过滤器', '将困惑分数的样本保留在指定范围内，使用指定的LLM计算。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('llm_quality_score_filter', 'LLM质量得分过滤器', '保留具有语言模型估计的高质量分数的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('llm_task_relevance_filter', 'LLM任务相关性过滤器', '保留与LLM估计的验证任务具有高相关性分数的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('maximum_line_length_filter', '最大行长过滤器', '将最大行长度的样本保持在指定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('perplexity_filter', '困惑度过滤器', '保持困惑分数在指定范围内的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('phrase_grounding_recall_filter', '短语定位召回过滤器', '根据从图像中的文本中提取的短语接地召回来过滤以保留样本。', '1.4.4', 'filtering', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('special_characters_filter', '特殊字符过滤器', '将具有特殊字符比率的样本保持在特定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('specified_field_filter', '指定字段过滤器', '根据指定的字段信息筛选样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('specified_numeric_field_filter', '指定数值字段过滤器', '根据指定的数值字段值筛选样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('stopwords_filter', '停用词过滤器', '将停止词比率的样本保持在指定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('suffix_filter', '后缀过滤器', '保留具有指定后缀的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_action_filter', '文本动作过滤器', '保留包含最少数量操作的文本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_embd_similarity_filter', '文本嵌入相似度过滤器', '保留与一组给定验证文本的平均嵌入相似度在特定范围内的文本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_entity_dependency_filter', '文本实体依赖过滤器', '根据实体依赖关系识别和过滤文本样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_length_filter', '文本长度过滤器', '保持文本总长度在特定范围内的样本。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_pair_similarity_filter', '文本对相似度过滤器', '将具有相似性的文本对保持在特定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('token_num_filter', 'Token数量过滤器', '将总令牌数的样本保留在指定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_aesthetics_filter', '视频美学过滤器', '将视频中指定帧的美学得分数据样本保留在特定范围内。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_aspect_ratio_filter', '视频长宽比过滤器', '将视频纵横比的样本保持在特定范围内。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_duration_filter', '视频时长过滤器', '保留视频持续时间在指定范围内的数据样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_frames_text_similarity_filter', '视频帧文本相似度过滤器', '根据视频帧图像和文本之间的相似性进行过滤。', '1.4.4', 'filtering', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_motion_score_filter', '视频运动得分过滤器', '将视频运动分数的样本保持在特定范围内。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_motion_score_raft_filter', '视频RAFT运动得分过滤器', '将视频运动分数的样本保持在指定范围内。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_nsfw_filter', '视频NSFW过滤器', '保留其视频的nsfw分数在指定范围内的样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_ocr_area_ratio_filter', '视频OCR面积占比过滤器', '保留检测到的视频中指定帧的文本面积比率在指定范围内的数据样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_resolution_filter', '视频分辨率过滤器', '保留视频分辨率在指定范围内的数据样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_tagging_from_frames_filter', '视频帧标签过滤器', '保留其视频包含指定标签的样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_watermark_filter', '视频水印过滤器', '保持其视频具有高概率没有水印的样本。', '1.4.4', 'filtering', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('word_repetition_filter', '单词重复过滤器', '将单词级n-gram重复比率的样本保持在特定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('words_num_filter', '词数过滤器', '将样本的总字数保持在指定范围内。', '1.4.4', 'filtering', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
-- ── 切片分组 ─────────────────────────────────────────────────
('key_value_grouper', '键值分组器', '根据指定键中的值将样本分组为批处理。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('naive_grouper', '朴素分组器', '将数据集中的所有样本分组为单个批处理样本。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('naive_reverse_grouper', '朴素反向分组器', '将批处理的样品分成单个样品。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('frequency_specified_field_selector', '频率指定字段选择器', '根据指定字段的频率过滤样本。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('random_selector', '随机选择器', '从数据集中随机选择样本子集。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('range_specified_field_selector', '范围指定字段选择器', '根据指定字段的排序值选择采样范围。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('tags_specified_field_selector', '标签指定字段选择器', '根据指定字段的标签过滤样本。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('topk_specified_field_selector', 'TopK指定字段选择器', '根据指定字段的排序值选择顶部样本。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
-- ── 映射/转换 ─────────────────────────────────────────────────
('audio_add_gaussian_noise_mapper', '音频高斯噪声添加', '将高斯噪声添加到音频样本。', '1.4.4', 'mapping', 'audio', 'audio', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('audio_ffmpeg_wrapped_mapper', '音频FFmpeg封装', '包装FFmpeg音频过滤器，用于处理数据集中的音频文件。', '1.4.4', 'mapping', 'audio', 'audio', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('calibrate_qa_mapper', 'QA校准映射', '使用API模型根据参考文本校准问答对。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('calibrate_query_mapper', '查询校准映射', '基于参考文本校准问答对中的查询。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('calibrate_response_mapper', '回复校准映射', '根据参考文本校准问答对中的回答。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('chinese_convert_mapper', '中文简繁转换', '在繁体、简体和日文汉字之间转换中文文本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('clean_copyright_mapper', '版权清洗', '清除文本示例开头的版权注释。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('clean_email_mapper', '邮箱清洗', '使用正则表达式从文本示例中清除电子邮件地址。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('clean_html_mapper', 'HTML清洗', '从文本示例中清除HTML代码，将HTML转换为纯文本。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('clean_ip_mapper', 'IP清洗', '从文本示例中清除IPv4和IPv6地址。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('clean_links_mapper', '链接清洗', '清理链接，如文本示例中的http/https/ftp。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('detect_character_attributes_mapper', '角色属性检测', '根据给定的图像、图像描述信息和角色名称，提取图像中主要角色的属性。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM","GPU"]', null, '', 0, 0),
('detect_character_locations_mapper', '角色位置检测', '给定一张图像和主要角色的名称列表，提取每个在场角色的边界框。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM","GPU"]', null, '', 0, 0),
('detect_main_character_mapper', '主要角色检测', '根据给定的图像及其图像描述，提取所有主要角色的名字。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('dialog_intent_detection_mapper', '对话意图检测', '通过分析历史记录、查询和响应，在对话框中生成用户的意图标签。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('dialog_sentiment_detection_mapper', '对话情感检测', '在对话框中为用户查询生成情绪标签和分析。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('dialog_sentiment_intensity_mapper', '对话情感强度映射', '预测用户在对话框中的情绪强度，范围从-5到5。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('dialog_topic_detection_mapper', '对话主题检测', '在对话框中生成用户的主题标签和分析。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('download_file_mapper', '文件下载', '将URL文件下载到本地文件或将其加载到内存中。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('expand_macro_mapper', '宏展开', '展开LaTeX示例文档主体中的宏定义。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('extract_entity_attribute_mapper', '实体属性提取', '从文本中提取给定实体的属性，并将其存储在示例的元数据中。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_entity_relation_mapper', '实体关系提取', '从文本中提取实体和关系以构建知识图谱。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_event_mapper', '事件提取', '从文本中提取事件和相关字符。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_keyword_mapper', '关键词提取', '为文本生成关键字。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_nickname_mapper', '昵称提取', '使用语言模型提取文本中的昵称关系。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_support_text_mapper', '支撑文本提取', '根据给定的摘要从原始文本中提取支持子文本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('extract_tables_from_html_mapper', 'HTML表格提取', '从HTML内容中提取表并将其存储在指定字段中。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('fix_unicode_mapper', 'Unicode修复', '修复文本示例中的unicode错误。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('generate_qa_from_examples_mapper', '示例生成QA', '使用拥抱面部模型从示例生成问题和答案对。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('generate_qa_from_text_mapper', '文本生成QA', '使用指定的模型从文本生成问题和答案对。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('image_blur_mapper', '图像模糊处理', '使用指定的概率和模糊类型对数据集中的图像进行模糊处理。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_captioning_from_gpt4v_mapper', 'GPT4V图像描述', '使用GPT-4视觉模型为图像生成文本标题。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('image_captioning_mapper', '图像描述生成', '使用拥抱面部模型生成图像标题，并将其附加到样本中。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_detection_yolo_mapper', 'YOLO图像检测', '使用YOLO对图像执行对象检测，并返回边界框和类标签。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_diffusion_mapper', '图像扩散生成', '使用基于提供的字幕的扩散模型生成图像。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_face_blur_mapper', '图像人脸模糊', '模糊图像中检测到的人脸。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_remove_background_mapper', '图像去背景', '删除图像的背景。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('image_segment_mapper', '图像分割', '对图像执行segment操作并返回边界框。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('image_tagging_mapper', '图像打标', '为样本中的每个图像生成图像标记。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('imgdiff_difference_area_generator_mapper', 'ImgDiff差异区域生成', '根据相似性、分割和文本匹配生成和过滤图像对的边界框。', '1.4.4', 'mapping', 'image', 'image', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('imgdiff_difference_caption_generator_mapper', 'ImgDiff差异描述生成', '为两个图像中的边界框区域生成差异字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('mllm_mapper', 'MLLM视觉问答', '使用MLLMs进行视觉问答任务。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('nlpaug_en_mapper', 'NLPAug英语增强', '使用nlpaug库中的各种方法增强英语文本样本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('nlpcda_zh_mapper', 'NLPCDA中文增强', '使用nlpcda库扩充中文文本样本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('optimize_prompt_mapper', 'Prompt优化', '根据同一批次中的现有提示优化提示。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('optimize_qa_mapper', 'QA优化', '优化问题-答案对。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('optimize_query_mapper', '查询优化', '优化问答对中的查询，使其更加具体和详细。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('optimize_response_mapper', '回复优化', '优化问答对中的响应，使其更加详细和具体。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('pair_preference_mapper', '配对偏好', '通过生成拒绝响应及其原因来构造成对的偏好样本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('punctuation_normalization_mapper', '标点归一化', '将unicode标点规范化为文本示例中的英语等效项。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('python_file_mapper', 'Python文件映射', '对输入数据执行文件中定义的Python函数。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('python_lambda_mapper', 'Python Lambda映射', '将Python lambda函数应用于数据样本。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('query_intent_detection_mapper', '查询意图检测', '为给定查询预测用户的意图标签和相应的分数。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('query_sentiment_detection_mapper', '查询情感检测', '在查询中预测用户的情绪标签。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('query_topic_detection_mapper', '查询主题检测', '预测给定查询的主题标签及其相应的分数。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('relation_identity_mapper', '关系识别', '确定给定文本中两个实体之间的关系。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('remove_bibliography_mapper', '参考书目移除', '删除LaTeX文档末尾的参考书目部分。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_comments_mapper', '注释移除', '从文档中删除注释，当前仅支持tex格式。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_header_mapper', '页眉移除', '删除LaTeX示例中文档开头的标题。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_long_words_mapper', '长词移除', '删除特定范围内的长词。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_non_chinese_character_mapper', '非中文字符移除', '从文本样本中删除非中文字符。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_repeat_sentences_mapper', '重复句移除', '删除文本样本中的重复句子。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_specific_chars_mapper', '指定字符移除', '从文本示例中删除特定字符。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_table_text_mapper', '表格文本移除', '从文本样本中删除表文本。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('remove_words_with_incorrect_substrings_mapper', '错误子串单词移除', '删除包含指定的不正确子字符串的单词。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('replace_content_mapper', '内容替换', '用指定的替换字符串替换与特定正则表达式模式匹配的文本中的内容。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('sdxl_prompt2prompt_mapper', 'SDXL Prompt2Prompt', '使用SDXL模型生成成对的相似图像。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('sentence_augmentation_mapper', '句子增强', '通过使用拥抱面部模型生成增强版本来增强句子。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('sentence_split_mapper', '句子切分', '根据指定的语言将文本样本拆分为单个句子。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_chunk_mapper', '文本分块', '根据指定的条件将输入文本拆分为块。', '1.4.4', 'slicing', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('text_tagging_by_prompt_mapper', 'Prompt文本打标', '使用带有LLM的prompt生成文本标记。', '1.4.4', 'mapping', 'text', 'text', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('vggt_mapper', 'VGGT视频提取', '输入单个场景的视频，使用VGGT提取相机姿态、深度图等信息。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_captioning_from_audio_mapper', '音频生成视频描述', '根据基于qwen-audio模型的音频流为视频添加字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('video_captioning_from_frames_mapper', '帧生成视频描述', '使用图像到文本模型从采样帧生成视频字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_captioning_from_summarizer_mapper', '摘要生成视频描述', '通过总结几种生成的文本来生成视频字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('video_captioning_from_video_mapper', '视频生成视频描述', '使用拥抱面部视频到文本模型生成视频字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_captioning_from_vlm_mapper', 'VLM视频描述', '使用接受视频作为输入的VLM生成视频字幕。', '1.4.4', 'mapping', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","LLM"]', null, '', 0, 0),
('video_depth_estimation_mapper', '视频深度估计', '对视频进行深度估计。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_extract_frames_mapper', '视频抽帧', '根据指定的方法从视频文件中提取帧。', '1.4.4', 'slicing', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_face_blur_mapper', '视频人脸模糊', '模糊在视频中检测到的人脸。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_ffmpeg_wrapped_mapper', '视频FFmpeg封装', '包装FFmpeg视频过滤器，用于处理数据集中的视频文件。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_hand_reconstruction_mapper', '视频手部重建', '使用WiLoR模型进行手部定位和重建。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_object_segmenting_mapper', '视频对象分割', '在整个视频中对有效对象进行文本引导的语义分割。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_remove_watermark_mapper', '视频去水印', '根据指定区域从视频中删除水印。', '1.4.4', 'cleaning', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_resize_aspect_ratio_mapper', '视频宽高比调整', '调整视频大小以适应指定的宽高比范围。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_resize_resolution_mapper', '视频分辨率调整', '根据指定的宽度和高度限制调整视频分辨率。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_split_by_duration_mapper', '视频按时长切分', '根据指定的持续时间将视频拆分为多个片段。', '1.4.4', 'slicing', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_split_by_key_frame_mapper', '视频关键帧切分', '根据关键帧将视频分割为多个片段。', '1.4.4', 'slicing', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_split_by_scene_mapper', '视频场景切分', '根据检测到的场景变化将视频拆分为场景剪辑。', '1.4.4', 'slicing', 'multimodal', 'multimodal', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0),
('video_tagging_from_audio_mapper', '音频视频打标', '使用音频频谱图转换器从音频流生成视频标签。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_tagging_from_frames_mapper', '帧视频打标', '从视频中提取的帧生成视频标签。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('video_whole_body_pose_estimation_mapper', '视频全身姿态估计', '使用DWPose模型提取视频中人类主体的身体、手、脚和面部关键点。', '1.4.4', 'mapping', 'video', 'video', 1, 1, '["DataJuicer","GPU"]', null, '', 0, 0),
('whitespace_normalization_mapper', '空白字符归一化', '将文本样本中各种类型的空白字符规范化为标准空格。', '1.4.4', 'cleaning', 'text', 'text', 1, 1, '["DataJuicer","CPU"]', null, '', 0, 0);

-- =============================================================
-- 工作流表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_workflow
(
    id          TEXT NOT NULL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    nodes       TEXT NOT NULL DEFAULT '[]',
    edges       TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'draft',
    created_by  TEXT          DEFAULT 'system',
    updated_by  TEXT          DEFAULT 'system',
    created_at  TEXT          DEFAULT (datetime('now')),
    updated_at  TEXT          DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS t_workflow_execution
(
    id                TEXT NOT NULL PRIMARY KEY,
    workflow_id       TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending',
    input_dataset_id  TEXT,
    output_dataset_id TEXT,
    output_path       TEXT,
    mode              TEXT          DEFAULT 'local',
    started_at        TEXT,
    finished_at       TEXT,
    error             TEXT,
    created_at        TEXT          DEFAULT (datetime('now')),
    updated_at        TEXT          DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS t_node_execution
(
    id           TEXT NOT NULL PRIMARY KEY,
    execution_id TEXT NOT NULL,
    node_id      TEXT NOT NULL,
    operator_id  TEXT,
    status       TEXT NOT NULL DEFAULT 'pending',
    started_at   TEXT,
    finished_at  TEXT,
    logs         TEXT          DEFAULT '[]',
    metrics      TEXT          DEFAULT '{}',
    error        TEXT,
    created_at   TEXT          DEFAULT (datetime('now')),
    updated_at   TEXT          DEFAULT (datetime('now'))
);

-- =============================================================
-- 数据集表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_dataset
(
    id                TEXT    NOT NULL PRIMARY KEY,
    name              TEXT    NOT NULL,
    description       TEXT,
    modal             TEXT    NOT NULL DEFAULT 'text',
    format            TEXT,
    record_count      INTEGER          DEFAULT 0,
    size_bytes        INTEGER          DEFAULT 0,
    columns           TEXT             DEFAULT '[]',
    storage_path      TEXT,
    original_filename TEXT,
    version           INTEGER          DEFAULT 1,
    tags              TEXT             DEFAULT '[]',
    created_by        TEXT             DEFAULT 'system',
    updated_by        TEXT             DEFAULT 'system',
    created_at        TEXT             DEFAULT (datetime('now')),
    updated_at        TEXT             DEFAULT (datetime('now'))
);

-- =============================================================
-- 知识库表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_knowledge_base
(
    id               TEXT    NOT NULL PRIMARY KEY,
    name             TEXT    NOT NULL,
    description      TEXT,
    embed_model      TEXT             DEFAULT 'text-embedding-3-small',
    vector_store     TEXT             DEFAULT 'chromadb',
    chunk_strategy   TEXT             DEFAULT 'fixed',
    chunk_size       INTEGER          DEFAULT 512,
    chunk_overlap    INTEGER          DEFAULT 64,
    document_count   INTEGER NOT NULL DEFAULT 0,
    chunk_count      INTEGER NOT NULL DEFAULT 0,
    collection_name  TEXT,
    created_by       TEXT             DEFAULT 'system',
    updated_by       TEXT             DEFAULT 'system',
    created_at       TEXT             DEFAULT (datetime('now')),
    updated_at       TEXT             DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS t_kb_document
(
    id            TEXT    NOT NULL PRIMARY KEY,
    kb_id         TEXT    NOT NULL,
    name          TEXT    NOT NULL,
    file_type     TEXT,
    file_size     INTEGER NOT NULL DEFAULT 0,
    storage_path  TEXT,
    status        TEXT    NOT NULL DEFAULT 'pending',
    chunk_count   INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at    TEXT             DEFAULT (datetime('now')),
    updated_at    TEXT             DEFAULT (datetime('now'))
);

-- =============================================================
-- 异步任务表
-- =============================================================
CREATE TABLE IF NOT EXISTS t_async_task
(
    id         TEXT NOT NULL PRIMARY KEY,
    task_type  TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    result     TEXT,
    error      TEXT,
    created_at TEXT          DEFAULT (datetime('now')),
    updated_at TEXT          DEFAULT (datetime('now'))
);

-- =============================================================
-- 种子数据：工作流
-- =============================================================
INSERT OR IGNORE INTO t_workflow (id, name, description, status, nodes, edges, created_by, created_at, updated_at)
VALUES
(
    'wf-text-clean-001',
    '通用文本清洗流水线',
    '针对中文文本数据集的完整清洗流程：去除HTML标签 → 清洗特殊字符 → 过滤重复文档 → 长度过滤，适用于预训练语料准备。',
    'draft',
    '[
      {"id":"n1","type":"dataset","label":"输入数据集","position":{"x":80,"y":200},"data":{"datasetId":"","datasetName":""}},
      {"id":"n2","type":"operator","label":"HTML标签清除","position":{"x":280,"y":200},"data":{"operatorId":"HtmlTagCleaner","operatorName":"HTML标签去除"}},
      {"id":"n3","type":"operator","label":"Unicode空格清除","position":{"x":480,"y":200},"data":{"operatorId":"UnicodeSpaceCleaner","operatorName":"空格标准化"}},
      {"id":"n4","type":"operator","label":"重复文档过滤","position":{"x":680,"y":200},"data":{"operatorId":"DuplicateFilesFilter","operatorName":"相似文档去除"}},
      {"id":"n5","type":"operator","label":"长度过滤","position":{"x":880,"y":200},"data":{"operatorId":"FileWithShortOrLongLengthFilter","operatorName":"文档字数检查"}},
      {"id":"n6","type":"output","label":"输出","position":{"x":1080,"y":200},"data":{}}
    ]',
    '[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"}
    ]',
    'admin',
    '2026-04-01T09:00:00',
    '2026-04-10T14:30:00'
),
(
    'wf-pii-desensitize-002',
    'PII 数据脱敏流水线',
    '对文本数据集进行个人隐私信息（PII）脱敏处理，依次去除手机号、身份证号、邮箱、IP地址和信用卡号，适用于合规数据处理场景。',
    'draft',
    '[
      {"id":"n1","type":"dataset","label":"输入数据集","position":{"x":80,"y":200},"data":{}},
      {"id":"n2","type":"operator","label":"手机号脱敏","position":{"x":280,"y":120},"data":{"operatorId":"AnonymizedPhoneNumber"}},
      {"id":"n3","type":"operator","label":"身份证脱敏","position":{"x":280,"y":240},"data":{"operatorId":"AnonymizedIdNumber"}},
      {"id":"n4","type":"operator","label":"邮箱脱敏","position":{"x":480,"y":120},"data":{"operatorId":"EmailNumberCleaner"}},
      {"id":"n5","type":"operator","label":"IP脱敏","position":{"x":480,"y":240},"data":{"operatorId":"AnonymizedIpAddress"}},
      {"id":"n6","type":"operator","label":"信用卡脱敏","position":{"x":680,"y":200},"data":{"operatorId":"AnonymizedCreditCardNumber"}},
      {"id":"n7","type":"output","label":"输出","position":{"x":880,"y":200},"data":{}}
    ]',
    '[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n1","target":"n3"},
      {"id":"e3","source":"n2","target":"n4"},
      {"id":"e4","source":"n3","target":"n5"},
      {"id":"e5","source":"n4","target":"n6"},
      {"id":"e6","source":"n5","target":"n6"},
      {"id":"e7","source":"n6","target":"n7"}
    ]',
    'admin',
    '2026-04-05T10:00:00',
    '2026-04-05T10:00:00'
),
(
    'wf-image-quality-003',
    '图像质量优化流水线',
    '对图像数据集进行全流程质量优化：过滤模糊图片 → 去除重复图片 → 统一图片格式 → 调整分辨率 → 亮度/对比度增强，适用于视觉模型训练数据准备。',
    'draft',
    '[
      {"id":"n1","type":"dataset","label":"输入图像集","position":{"x":80,"y":200},"data":{}},
      {"id":"n2","type":"operator","label":"模糊图片过滤","position":{"x":280,"y":200},"data":{"operatorId":"ImgBlurredImagesCleaner"}},
      {"id":"n3","type":"operator","label":"重复图片去除","position":{"x":480,"y":200},"data":{"operatorId":"ImgDuplicatedImagesCleaner"}},
      {"id":"n4","type":"operator","label":"格式统一","position":{"x":680,"y":200},"data":{"operatorId":"ImgTypeUnify"}},
      {"id":"n5","type":"operator","label":"图片缩放","position":{"x":880,"y":200},"data":{"operatorId":"ImgResize"}},
      {"id":"n6","type":"operator","label":"亮度增强","position":{"x":1080,"y":120},"data":{"operatorId":"ImgBrightness"}},
      {"id":"n7","type":"operator","label":"对比度增强","position":{"x":1080,"y":280},"data":{"operatorId":"ImgContrast"}},
      {"id":"n8","type":"output","label":"输出","position":{"x":1280,"y":200},"data":{}}
    ]',
    '[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"},
      {"id":"e6","source":"n5","target":"n7"},
      {"id":"e7","source":"n6","target":"n8"},
      {"id":"e8","source":"n7","target":"n8"}
    ]',
    'admin',
    '2026-04-08T11:00:00',
    '2026-04-15T16:20:00'
),
(
    'wf-qa-generate-004',
    'LLM 问答对生成流水线',
    '从原始文档中自动生成高质量问答对：文本清洗 → 文本分块 → LLM生成QA → QA质量过滤，适用于指令微调数据集构建。',
    'draft',
    '[
      {"id":"n1","type":"dataset","label":"原始文档集","position":{"x":80,"y":200},"data":{}},
      {"id":"n2","type":"operator","label":"内容清洗","position":{"x":280,"y":200},"data":{"operatorId":"ContentCleaner"}},
      {"id":"n3","type":"operator","label":"文本分块","position":{"x":480,"y":200},"data":{"operatorId":"text_chunk_mapper"}},
      {"id":"n4","type":"operator","label":"生成问答对","position":{"x":680,"y":200},"data":{"operatorId":"generate_qa_from_text_mapper"}},
      {"id":"n5","type":"operator","label":"QA质量过滤","position":{"x":880,"y":200},"data":{"operatorId":"llm_quality_score_filter"}},
      {"id":"n6","type":"output","label":"输出QA集","position":{"x":1080,"y":200},"data":{}}
    ]',
    '[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"}
    ]',
    'admin',
    '2026-04-12T09:30:00',
    '2026-04-18T11:00:00'
),
(
    'wf-pdf-kb-005',
    'PDF 文档知识库构建流水线',
    '将 PDF 文档转换为可检索的向量知识库：MinerU解析PDF → 文本清洗 → 文本分割 → 向量入库，适用于企业知识库建设。',
    'draft',
    '[
      {"id":"n1","type":"dataset","label":"PDF数据集","position":{"x":80,"y":200},"data":{}},
      {"id":"n2","type":"operator","label":"MinerU格式化","position":{"x":280,"y":200},"data":{"operatorId":"MineruFormatter"}},
      {"id":"n3","type":"operator","label":"HTML清洗","position":{"x":480,"y":200},"data":{"operatorId":"HtmlTagCleaner"}},
      {"id":"n4","type":"operator","label":"文本分段","position":{"x":680,"y":200},"data":{"operatorId":"sentence_split_mapper"}},
      {"id":"n5","type":"output","label":"知识库","position":{"x":880,"y":200},"data":{}}
    ]',
    '[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"}
    ]',
    'admin',
    '2026-04-15T14:00:00',
    '2026-04-20T09:00:00'
);

-- 工作流执行记录
INSERT OR IGNORE INTO t_workflow_execution (id, workflow_id, status, mode, started_at, finished_at, created_at)
VALUES
('exec-001', 'wf-text-clean-001', 'completed', 'local', '2026-04-10T10:00:00', '2026-04-10T10:23:41', '2026-04-10T10:00:00'),
('exec-002', 'wf-text-clean-001', 'completed', 'local', '2026-04-15T09:00:00', '2026-04-15T09:18:05', '2026-04-15T09:00:00'),
('exec-003', 'wf-pii-desensitize-002', 'completed', 'local', '2026-04-06T11:00:00', '2026-04-06T11:09:22', '2026-04-06T11:00:00'),
('exec-004', 'wf-image-quality-003', 'error', 'local', '2026-04-16T14:00:00', '2026-04-16T14:03:10', '2026-04-16T14:00:00'),
('exec-005', 'wf-qa-generate-004', 'completed', 'local', '2026-04-19T10:00:00', '2026-04-19T11:42:17', '2026-04-19T10:00:00');

-- =============================================================
-- 种子数据：数据集
-- =============================================================
INSERT OR IGNORE INTO t_dataset (id, name, description, modal, format, record_count, size_bytes, columns, original_filename, version, tags, created_by, created_at, updated_at)
VALUES
(
    'ds-text-zh-001',
    '中文新闻语料集 v2',
    '收集自国内主流新闻平台的中文新闻文章，经过去重和基础清洗处理，覆盖科技、财经、体育、娱乐等多个领域，适用于中文预训练和文本分类任务。',
    'text', 'jsonl', 128000, 524288000,
    '["id","title","content","category","source","publish_date"]',
    'news_corpus_zh_v2.jsonl', 2,
    '["中文","新闻","预训练"]',
    'admin', '2026-03-15T08:00:00', '2026-04-01T10:00:00'
),
(
    'ds-text-qa-002',
    '金融问答对数据集',
    '来源于金融领域的高质量问答对，包含股票、基金、保险、银行等专业知识，经过人工审核和LLM质量评估，适用于金融领域大模型微调。',
    'text', 'jsonl', 45000, 89478485,
    '["instruction","input","output","source","quality_score"]',
    'finance_qa_dataset.jsonl', 1,
    '["金融","QA","指令微调"]',
    'admin', '2026-03-20T09:00:00', '2026-04-05T14:00:00'
),
(
    'ds-image-ocr-003',
    '文档图像OCR训练集',
    '包含各类扫描文档、票据、证件的图像数据，标注了文字区域边界框和对应文本内容，适用于OCR模型训练和文字识别任务。',
    'image', 'zip', 32000, 2147483648,
    '["image_path","annotations","text","language"]',
    'doc_image_ocr_train.zip', 1,
    '["图像","OCR","文字识别"]',
    'admin', '2026-03-25T10:00:00', '2026-03-25T10:00:00'
),
(
    'ds-text-clean-004',
    '清洗后中文文本语料',
    '通用文本清洗流水线处理输出，原始数据来自中文新闻语料集 v2，经过HTML清洗、去重、长度过滤等处理，质量更高，可直接用于模型训练。',
    'text', 'jsonl', 112000, 430467072,
    '["id","content","source","category"]',
    'cleaned_text_corpus.jsonl', 1,
    '["已清洗","中文","文本"]',
    'admin', '2026-04-10T10:23:41', '2026-04-10T10:23:41'
),
(
    'ds-text-pii-005',
    'PII脱敏医疗对话集',
    '医疗问诊对话数据集，经过完整PII脱敏处理（患者姓名、联系方式、身份证号等均已脱敏），适用于医疗大模型训练，符合数据合规要求。',
    'text', 'jsonl', 28000, 62914560,
    '["dialog_id","role","content","department","anon_level"]',
    'medical_dialog_pii_clean.jsonl', 1,
    '["医疗","对话","脱敏","合规"]',
    'admin', '2026-04-06T11:09:22', '2026-04-06T11:09:22'
),
(
    'ds-text-instruct-006',
    '指令微调混合数据集',
    '融合多个来源的指令微调数据，包含通用对话、代码生成、数学推理、角色扮演等多种任务类型，经过质量筛选和格式统一，适用于通用指令模型训练。',
    'text', 'jsonl', 500000, 1073741824,
    '["system","instruction","input","output","task_type","language"]',
    'instruct_mix_dataset.jsonl', 3,
    '["指令微调","混合","多任务"]',
    'admin', '2026-04-12T08:00:00', '2026-04-20T16:00:00'
),
(
    'ds-image-cls-007',
    '工业缺陷检测图像集',
    '工厂流水线拍摄的工业产品图像，包含正常品和各类缺陷样本（划痕、变形、污点等），每张图像均有缺陷类型标注，适用于工业视觉检测模型训练。',
    'image', 'zip', 18500, 3221225472,
    '["image_path","label","defect_type","product_id","captured_at"]',
    'industrial_defect_images.zip', 1,
    '["图像","工业","缺陷检测","分类"]',
    'admin', '2026-04-08T09:00:00', '2026-04-08T09:00:00'
);

-- =============================================================
-- 种子数据：知识库
-- =============================================================
INSERT OR IGNORE INTO t_knowledge_base (id, name, description, embed_model, vector_store, chunk_strategy, chunk_size, chunk_overlap, document_count, chunk_count, collection_name, created_by, created_at, updated_at)
VALUES
(
    'kb-product-001',
    '产品技术文档库',
    '存储公司全线产品的技术文档、API手册、部署指南和常见问题解答，支持研发和运维人员快速检索技术信息。',
    'text-embedding-3-small', 'chromadb', 'fixed', 512, 64,
    24, 3840,
    'kb_product_001',
    'admin', '2026-03-10T09:00:00', '2026-04-18T11:00:00'
),
(
    'kb-legal-002',
    '法律法规知识库',
    '涵盖数据安全法、个人信息保护法、网络安全法等相关法律法规全文，以及行业合规指引和监管政策文件，供合规团队查询使用。',
    'text-embedding-3-small', 'chromadb', 'fixed', 256, 32,
    18, 5420,
    'kb_legal_002',
    'admin', '2026-03-15T10:00:00', '2026-04-10T14:00:00'
),
(
    'kb-research-003',
    'AI研究论文库',
    '收录大语言模型、多模态学习、数据工程等领域的最新学术论文，支持语义检索，帮助研究人员快速定位相关文献和技术方案。',
    'text-embedding-3-large', 'chromadb', 'semantic', 1024, 128,
    156, 28640,
    'kb_research_003',
    'admin', '2026-03-20T14:00:00', '2026-04-20T09:30:00'
),
(
    'kb-support-004',
    '客户服务知识库',
    '整合客服常见问题、产品使用手册、故障排查流程和服务流程规范，为智能客服机器人提供知识支撑，提升客户服务效率。',
    'text-embedding-3-small', 'chromadb', 'fixed', 512, 64,
    42, 6300,
    'kb_support_004',
    'admin', '2026-04-01T08:00:00', '2026-04-19T16:00:00'
),
(
    'kb-finance-005',
    '金融研报知识库',
    '汇聚各大券商和研究机构发布的行业研究报告、宏观经济分析和公司深度报告，支持投研人员进行智能问答和信息检索。',
    'text-embedding-3-large', 'chromadb', 'semantic', 768, 96,
    89, 41200,
    'kb_finance_005',
    'admin', '2026-04-05T10:00:00', '2026-04-21T10:00:00'
);

-- 知识库文档
INSERT OR IGNORE INTO t_kb_document (id, kb_id, name, file_type, file_size, status, chunk_count, created_at, updated_at)
VALUES
-- 产品技术文档库
('doc-001', 'kb-product-001', 'DataMate 用户手册 v2.0.pdf', 'pdf', 5242880, 'indexed', 320, '2026-03-10T09:10:00', '2026-03-10T09:35:00'),
('doc-002', 'kb-product-001', 'API 接口文档.pdf', 'pdf', 2097152, 'indexed', 280, '2026-03-12T10:00:00', '2026-03-12T10:18:00'),
('doc-003', 'kb-product-001', '部署运维指南.md', 'md', 524288, 'indexed', 96, '2026-03-15T11:00:00', '2026-03-15T11:05:00'),
('doc-004', 'kb-product-001', '常见问题FAQ.docx', 'docx', 1048576, 'indexed', 144, '2026-04-01T09:00:00', '2026-04-01T09:12:00'),
-- 法律法规知识库
('doc-005', 'kb-legal-002', '数据安全法全文.pdf', 'pdf', 1572864, 'indexed', 680, '2026-03-15T10:10:00', '2026-03-15T10:28:00'),
('doc-006', 'kb-legal-002', '个人信息保护法.pdf', 'pdf', 1835008, 'indexed', 820, '2026-03-16T09:00:00', '2026-03-16T09:22:00'),
('doc-007', 'kb-legal-002', '网络安全法.pdf', 'pdf', 1310720, 'indexed', 560, '2026-03-17T10:00:00', '2026-03-17T10:18:00'),
('doc-008', 'kb-legal-002', 'GDPR合规指引.pdf', 'pdf', 3145728, 'indexed', 1240, '2026-03-20T11:00:00', '2026-03-20T11:38:00'),
-- AI研究论文库
('doc-009', 'kb-research-003', 'Attention Is All You Need.pdf', 'pdf', 2097152, 'indexed', 480, '2026-03-20T14:10:00', '2026-03-20T14:32:00'),
('doc-010', 'kb-research-003', 'GPT-4 Technical Report.pdf', 'pdf', 8388608, 'indexed', 1920, '2026-03-22T09:00:00', '2026-03-22T10:08:00'),
('doc-011', 'kb-research-003', 'LLaMA 2: Open Foundation.pdf', 'pdf', 5242880, 'indexed', 1280, '2026-03-25T10:00:00', '2026-03-25T10:48:00'),
('doc-012', 'kb-research-003', 'DataJuicer: A One-Stop Data Processing.pdf', 'pdf', 3145728, 'indexed', 760, '2026-04-01T11:00:00', '2026-04-01T11:24:00'),
-- 客户服务知识库
('doc-013', 'kb-support-004', '产品使用常见问题.xlsx', 'xlsx', 786432, 'indexed', 280, '2026-04-01T08:10:00', '2026-04-01T08:22:00'),
('doc-014', 'kb-support-004', '故障排查手册.pdf', 'pdf', 2621440, 'indexed', 380, '2026-04-03T09:00:00', '2026-04-03T09:28:00'),
('doc-015', 'kb-support-004', '服务流程规范.docx', 'docx', 1048576, 'indexed', 160, '2026-04-05T10:00:00', '2026-04-05T10:12:00'),
-- 金融研报知识库
('doc-016', 'kb-finance-005', '2026年宏观经济展望.pdf', 'pdf', 6291456, 'indexed', 1440, '2026-04-05T10:10:00', '2026-04-05T11:02:00'),
('doc-017', 'kb-finance-005', 'AI行业深度报告2026.pdf', 'pdf', 9437184, 'indexed', 2160, '2026-04-08T09:00:00', '2026-04-08T10:16:00'),
('doc-018', 'kb-finance-005', '新能源行业研究报告.pdf', 'pdf', 7340032, 'indexed', 1680, '2026-04-10T14:00:00', '2026-04-10T15:04:00'),
('doc-019', 'kb-finance-005', '消费行业季度跟踪.pdf', 'pdf', 4194304, 'indexed', 960, '2026-04-15T10:00:00', '2026-04-15T10:36:00'),
('doc-020', 'kb-finance-005', '半导体行业技术演进分析.pdf', 'pdf', 5242880, 'indexed', 1200, '2026-04-18T11:00:00', '2026-04-18T11:48:00'),
-- 待索引文档
('doc-021', 'kb-research-003', 'Sora Technical Overview.pdf', 'pdf', 4194304, 'indexing', 0, '2026-04-20T16:00:00', '2026-04-20T16:00:00'),
('doc-022', 'kb-support-004', '2026年产品更新说明.pdf', 'pdf', 1572864, 'pending', 0, '2026-04-21T09:00:00', '2026-04-21T09:00:00');
