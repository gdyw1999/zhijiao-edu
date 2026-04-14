"""
智教未来 - UGC 生成内容路由
用于展示热门生成内容卡片
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter()


# ============================================
# 数据模型
# ============================================

class Author(BaseModel):
    """作者信息"""
    name: str
    avatar: Optional[str] = None


class GenerationCard(BaseModel):
    """生成内容卡片"""
    id: str
    title: str
    content: str
    category: str
    ai_function: str  # lesson, question, exam, animation
    author: Author
    likes: int
    views: int
    created_at: datetime
    tags: List[str] = []


class GenerationsResponse(BaseModel):
    """卡片列表响应"""
    items: List[GenerationCard]
    total: int
    page: int
    page_size: int


# ============================================
# Mock 数据生成
# ============================================

# AI 功能类型
AI_FUNCTIONS = {
    "lesson": "AI教案·大单元",
    "question": "AI命题",
    "exam": "AI组题",
    "animation": "AI互动课件",
}

# 学科分类
CATEGORIES = ["语文", "数学", "英语", "物理", "化学", "生物"]

# 示例作者
AUTHORS = [
    Author(name="张老师", avatar=None),
    Author(name="李老师", avatar=None),
    Author(name="王老师", avatar=None),
    Author(name="赵老师", avatar=None),
    Author(name="刘老师", avatar=None),
]

# 示例标题模板
TITLE_TEMPLATES = {
    "lesson": [
        "{subject}大单元教学设计：{topic}",
        "{subject}{grade}{topic}教学设计",
        "基于核心素养的{subject}{topic}教学设计",
    ],
    "question": [
        "{subject}{topic}考点精练题",
        "{subject}{grade}期末复习题：{topic}",
        "{subject}易错题汇编：{topic}",
    ],
    "exam": [
        "{subject}{grade}{topic}综合测试卷",
        "{subject}期中模拟试卷",
        "{subject}期末冲刺卷",
    ],
    "animation": [
        "{subject}{topic}教学动画脚本",
        "{topic}微课动画设计",
        "{subject}{topic}互动课件",
    ],
}

# 示例内容模板
CONTENT_TEMPLATES = {
    "lesson": """本教学设计围绕{topic}主题，采用大单元整体教学理念。

【教学目标】
1. 知识与技能：掌握核心概念
2. 过程与方法：培养探究能力
3. 情感态度：激发学习兴趣

【教学重难点】
重点：核心概念理解
难点：知识迁移应用

【教学过程】
共设计4课时，每课时45分钟...""",
    "question": """【题目1】（基础题）
{topic}的基本概念是____。

【题目2】（提高题）
已知条件...，求解...

【题目3】（拓展题）
结合实际应用...

【参考答案】
详细解析...""",
    "exam": ""【试卷结构】
本试卷满分100分，考试时间90分钟。

一、选择题（共10题，每题3分）
考查基础知识掌握情况

二、填空题（共5题，每题4分）
考查概念理解深度

三、解答题（共4题，共40分）
考查综合应用能力

评分标准与参考答案...""",
    "animation": """【动画名称】{topic}互动教学动画

【教学目标】
通过动态演示，帮助学生理解抽象概念。

【动画脚本】
场景1：引入（10秒）
- 画面：...
- 旁白：...

场景2：演示（30秒）
- 画面：...
- 动画效果：...

场景3：总结（10秒）
- 画面：...
- 旁白：...

【交互设计】
- 暂停/播放按钮
- 进度条拖动
- 倍速播放""",
}

# 示例话题
TOPICS = [
    "分数的意义", "一元二次方程", "函数图像", "几何证明",
    "牛顿定律", "化学反应", "细胞结构", "生态系统",
    "诗词鉴赏", "阅读理解", "作文写作", "语法知识",
]

# 年级
GRADES = ["三年级", "四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"]


def generate_mock_card(index: int) -> GenerationCard:
    """生成单个 Mock 卡片数据"""
    ai_func = random.choice(list(AI_FUNCTIONS.keys()))
    category = random.choice(CATEGORIES)
    topic = random.choice(TOPICS)
    grade = random.choice(GRADES)
    subject = category

    # 生成标题
    title_template = random.choice(TITLE_TEMPLATES[ai_func])
    title = title_template.format(
        subject=subject,
        topic=topic,
        grade=grade
    )

    # 生成内容
    content_template = CONTENT_TEMPLATES[ai_func]
    content = content_template.format(topic=topic, subject=subject)

    # 生成作者
    author = random.choice(AUTHORS)

    # 生成时间（最近30天内）
    days_ago = random.randint(0, 30)
    created_at = datetime.now() - timedelta(days=days_ago)

    # 生成标签
    tags = [category, AI_FUNCTIONS[ai_func], grade]

    return GenerationCard(
        id=f"gen_{index:06d}",
        title=title,
        content=content[:200] + "...",  # 截断内容
        category=category,
        ai_function=ai_func,
        author=author,
        likes=random.randint(10, 1000),
        views=random.randint(100, 10000),
        created_at=created_at,
        tags=tags,
    )


def generate_mock_cards(count: int = 20) -> List[GenerationCard]:
    """生成 Mock 卡片数据列表"""
    return [generate_mock_card(i) for i in range(count)]


# 预生成 Mock 数据
MOCK_CARDS = generate_mock_cards(50)


# ============================================
# 路由端点
# ============================================

@router.get("/hot", response_model=GenerationsResponse)
async def get_hot_generations(
    category: Optional[str] = Query(None, description="分类筛选"),
    ai_function: Optional[str] = Query(None, description="AI功能筛选 (lesson/question/exam/animation)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=50, description="每页数量"),
):
    """
    获取热门 UGC 生成内容卡片

    Args:
        category: 学科分类筛选（如：语文、数学）
        ai_function: AI功能筛选（lesson/question/exam/animation）
        page: 页码，从1开始
        page_size: 每页数量

    Returns:
        GenerationsResponse: 分页的卡片列表
    """
    # 筛选数据
    filtered_cards = MOCK_CARDS.copy()

    if category:
        filtered_cards = [c for c in filtered_cards if c.category == category]

    if ai_function:
        filtered_cards = [c for c in filtered_cards if c.ai_function == ai_function]

    # 按点赞数排序（热门）
    filtered_cards.sort(key=lambda x: x.likes, reverse=True)

    # 分页
    total = len(filtered_cards)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_cards = filtered_cards[start_idx:end_idx]

    return GenerationsResponse(
        items=paged_cards,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/latest", response_model=GenerationsResponse)
async def get_latest_generations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    """
    获取最新 UGC 生成内容卡片

    Args:
        page: 页码
        page_size: 每页数量

    Returns:
        GenerationsResponse: 分页的卡片列表
    """
    # 按时间排序
    sorted_cards = sorted(MOCK_CARDS, key=lambda x: x.created_at, reverse=True)

    # 分页
    total = len(sorted_cards)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_cards = sorted_cards[start_idx:end_idx]

    return GenerationsResponse(
        items=paged_cards,
        total=total,
        page=page,
        page_size=page_size,
    )
