"""
Seed script: scan runtime/ops directories and insert operators + categories into the DB.
Run from the backend/ directory:
    python seed_operators.py
"""
import asyncio
import json
import uuid
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

DATABASE_URL = "sqlite+aiosqlite:///./datamate.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Operator catalogue ────────────────────────────────────────────────────────

CATEGORY_META = {
    "filter": {
        "name": "过滤",
        "name_en": "Filter",
        "id": "cat-filter",
    },
    "mapper": {
        "name": "清洗",
        "name_en": "Mapper / Cleaner",
        "id": "cat-mapper",
    },
    "formatter": {
        "name": "格式化",
        "name_en": "Formatter",
        "id": "cat-formatter",
    },
    "annotation": {
        "name": "标注",
        "name_en": "Annotation",
        "id": "cat-annotation",
    },
    "slicer": {
        "name": "切片",
        "name_en": "Slicer",
        "id": "cat-slicer",
    },
    "llms": {
        "name": "大模型",
        "name_en": "LLMs",
        "id": "cat-llms",
    },
}

# Display name mapping (snake_case dir → human-readable)
DISPLAY_NAMES: dict[str, str] = {
    # filter
    "file_with_high_repeat_phrase_rate_filter": "高重复短语率过滤",
    "file_with_high_repeat_word_rate_filter": "高重复词率过滤",
    "file_with_high_special_char_rate_filter": "高特殊字符率过滤",
    "img_advertisement_images_cleaner": "广告图片过滤",
    "img_blurred_images_cleaner": "模糊图片过滤",
    "img_duplicated_images_cleaner": "重复图片过滤",
    "img_similar_images_cleaner": "相似图片过滤",
    "remove_duplicate_file": "重复文件删除",
    "remove_file_with_many_sensitive_words": "敏感词文件过滤",
    "remove_file_with_short_or_long_length": "长度异常文件过滤",
    # mapper / cleaner
    "content_cleaner": "内容清洗",
    "credit_card_number_cleaner": "信用卡号脱敏",
    "email_cleaner": "邮箱地址脱敏",
    "emoji_cleaner": "Emoji 清除",
    "extra_space_cleaner": "多余空格清除",
    "full_width_characters_cleaner": "全角字符转换",
    "garble_characters_cleaner": "乱码字符清除",
    "html_tag_cleaner": "HTML 标签清除",
    "id_number_cleaner": "身份证号脱敏",
    "img_denoise": "图片去噪",
    "img_direction_correct": "图片方向矫正",
    "img_enhanced_brightness": "图片亮度增强",
    "img_enhanced_contrast": "图片对比度增强",
    "img_enhanced_saturation": "图片饱和度增强",
    "img_enhanced_sharpness": "图片锐度增强",
    "img_perspective_transformation": "图片透视变换",
    "img_resize": "图片缩放",
    "img_shadow_remove": "图片阴影去除",
    "img_type_unify": "图片格式统一",
    "invisible_characters_cleaner": "不可见字符清除",
    "ip_address_cleaner": "IP 地址脱敏",
    "knowledge_relation_slice": "知识关系切片",
    "legend_cleaner": "图例清除",
    "phone_number_cleaner": "手机号脱敏",
    "pii_ner_detection": "PII 实体识别",
    "political_word_cleaner": "政治敏感词清除",
    "remove_duplicate_sentences": "重复句子去除",
    "sexual_and_violent_word_cleaner": "色情暴力词清除",
    "text_to_word": "文本转词表",
    "traditional_chinese": "繁简体转换",
    "unicode_space_cleaner": "Unicode 空格清除",
    "url_cleaner": "URL 脱敏",
    "xml_tag_cleaner": "XML 标签清除",
    # formatter
    "mineru_formatter": "MinerU 格式化",
    "slide_formatter": "幻灯片格式化",
    # annotation
    "image_object_detection_bounding_box": "目标检测标注",
    "image_semantic_segmentation": "语义分割标注",
    # slicer
    "segmentation": "文本分段",
    "slide_annotation_slicer": "幻灯片标注切片",
    "slide_simple_slicer": "幻灯片简单切片",
    # llms
    "qa_condition_evaluator": "QA 条件评估",
    "text_quality_evaluation": "文本质量评估",
}

DESCRIPTIONS: dict[str, str] = {
    "file_with_high_repeat_phrase_rate_filter": "过滤重复短语率超过阈值的文件",
    "file_with_high_repeat_word_rate_filter": "过滤重复词率超过阈值的文件",
    "file_with_high_special_char_rate_filter": "过滤特殊字符占比过高的文件",
    "img_advertisement_images_cleaner": "识别并过滤广告类图片",
    "img_blurred_images_cleaner": "过滤模糊、低清晰度图片",
    "img_duplicated_images_cleaner": "基于哈希去除重复图片",
    "img_similar_images_cleaner": "基于感知哈希去除相似图片",
    "remove_duplicate_file": "基于内容哈希去除重复文件",
    "remove_file_with_many_sensitive_words": "过滤含大量敏感词的文件",
    "remove_file_with_short_or_long_length": "过滤长度过短或过长的文件",
    "content_cleaner": "通用文本内容清洗",
    "credit_card_number_cleaner": "识别并脱敏信用卡号",
    "email_cleaner": "识别并脱敏邮箱地址",
    "emoji_cleaner": "清除文本中的 Emoji 字符",
    "extra_space_cleaner": "合并多余连续空格",
    "full_width_characters_cleaner": "将全角字符转换为半角",
    "garble_characters_cleaner": "检测并清除乱码字符",
    "html_tag_cleaner": "剥离 HTML / XML 标签",
    "id_number_cleaner": "识别并脱敏身份证号码",
    "img_denoise": "对图片进行去噪处理",
    "img_direction_correct": "自动矫正图片方向",
    "img_enhanced_brightness": "自动调节图片亮度",
    "img_enhanced_contrast": "自动增强图片对比度",
    "img_enhanced_saturation": "自动调节图片饱和度",
    "img_enhanced_sharpness": "自动增强图片锐度",
    "img_perspective_transformation": "对图片进行透视变换校正",
    "img_resize": "统一调整图片分辨率",
    "img_shadow_remove": "去除图片阴影区域",
    "img_type_unify": "将图片转换为统一格式（JPG/PNG）",
    "invisible_characters_cleaner": "清除零宽等不可见字符",
    "ip_address_cleaner": "识别并脱敏 IP 地址",
    "knowledge_relation_slice": "从文本中提取知识图谱关系并切片",
    "legend_cleaner": "清除图表图例噪声",
    "phone_number_cleaner": "识别并脱敏手机/电话号码",
    "pii_ner_detection": "使用 NER 模型检测个人隐私信息",
    "political_word_cleaner": "过滤政治敏感词汇",
    "remove_duplicate_sentences": "去除段落内重复句子",
    "sexual_and_violent_word_cleaner": "过滤色情/暴力词汇",
    "text_to_word": "将文本分词并输出词表",
    "traditional_chinese": "繁体字与简体字互相转换",
    "unicode_space_cleaner": "清除 Unicode 特殊空格字符",
    "url_cleaner": "识别并脱敏 URL 地址",
    "xml_tag_cleaner": "剥离 XML 标签保留文本",
    "mineru_formatter": "使用 MinerU 将 PDF/图片转换为结构化文本",
    "slide_formatter": "将 PPT/PPTX 幻灯片转换为文本格式",
    "image_object_detection_bounding_box": "使用目标检测模型标注图片中的对象边界框",
    "image_semantic_segmentation": "使用语义分割模型对图片像素级标注",
    "segmentation": "将长文本按语义切分为段落",
    "slide_annotation_slicer": "将含标注的幻灯片切分为数据样本",
    "slide_simple_slicer": "将幻灯片按页切分为独立样本",
    "qa_condition_evaluator": "使用 LLM 评估 QA 对是否满足质量条件",
    "text_quality_evaluation": "使用 LLM 对文本进行综合质量评分",
}

# Which operators deal with images
IMAGE_OPS = {
    "img_advertisement_images_cleaner", "img_blurred_images_cleaner",
    "img_duplicated_images_cleaner", "img_similar_images_cleaner",
    "img_denoise", "img_direction_correct", "img_enhanced_brightness",
    "img_enhanced_contrast", "img_enhanced_saturation", "img_enhanced_sharpness",
    "img_perspective_transformation", "img_resize", "img_shadow_remove", "img_type_unify",
    "image_object_detection_bounding_box", "image_semantic_segmentation",
    "slide_formatter", "slide_annotation_slicer", "slide_simple_slicer",
}


def infer_modal(dir_name: str) -> tuple[str, str]:
    if dir_name in IMAGE_OPS or dir_name.startswith("img_") or dir_name.startswith("image_") or "slide" in dir_name:
        return "image", "image"
    return "text", "text"


async def seed():
    ops_root = Path(__file__).parent.parent / "runtime" / "ops"
    category_dirs = ["filter", "mapper", "formatter", "annotation", "slicer", "llms"]

    async with AsyncSessionLocal() as db:
        # 1. Insert categories
        for cat_key, meta in CATEGORY_META.items():
            await db.execute(
                text("""
                    INSERT OR IGNORE INTO t_operator_category (id, name, name_en, value, type, parent_id)
                    VALUES (:id, :name, :name_en, :value, :type, :parent_id)
                """),
                {
                    "id": meta["id"],
                    "name": meta["name"],
                    "name_en": meta["name_en"],
                    "value": cat_key,
                    "type": "function",
                    "parent_id": "0",
                },
            )

        # 2. Scan and insert operators
        inserted = 0
        for cat_dir in category_dirs:
            cat_path = ops_root / cat_dir
            if not cat_path.exists():
                continue
            for op_dir in sorted(cat_path.iterdir()):
                if not op_dir.is_dir() or op_dir.name.startswith("_"):
                    continue
                dir_name = op_dir.name
                op_id = f"{cat_dir}-{dir_name}"
                display_name = DISPLAY_NAMES.get(dir_name, dir_name.replace("_", " ").title())
                description = DESCRIPTIONS.get(dir_name, f"{display_name} 算子")
                input_modal, output_modal = infer_modal(dir_name)
                tags = json.dumps([cat_dir, "DataMate"])

                await db.execute(
                    text("""
                        INSERT OR IGNORE INTO t_operator
                            (id, name, description, version, category, input_modal, output_modal,
                             input_count, output_count, tags, installed, is_star, usage_count,
                             created_by, updated_by)
                        VALUES
                            (:id, :name, :desc, '1.0.0', :category, :input_modal, :output_modal,
                             1, 1, :tags, 1, 0, 0, 'system', 'system')
                    """),
                    {
                        "id": op_id,
                        "name": display_name,
                        "desc": description,
                        "category": cat_dir,
                        "input_modal": input_modal,
                        "output_modal": output_modal,
                        "tags": tags,
                    },
                )
                inserted += 1

        await db.commit()
        print(f"✅ 已插入 {len(CATEGORY_META)} 个分类，{inserted} 个算子")


if __name__ == "__main__":
    asyncio.run(seed())
