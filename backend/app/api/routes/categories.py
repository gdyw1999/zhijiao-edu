"""
智教未来 - 学科分类路由
"""

from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ============================================
# 数据模型
# ============================================

class Category(BaseModel):
    """学科分类模型"""
    id: str
    name: str
    icon: str
    description: str
    sort_order: int


class CategoryResponse(BaseModel):
    """分类列表响应"""
    categories: List[Category]


# ============================================
# Mock 数据
# ============================================

# 学科分类数据
CATEGORIES = [
    Category(
        id="all",
        name="全部",
        icon="LayoutGrid",
        description="所有学科",
        sort_order=0
    ),
    Category(
        id="chinese",
        name="语文",
        icon="BookOpen",
        description="小学、初中、高中语文",
        sort_order=1
    ),
    Category(
        id="math",
        name="数学",
        icon="Calculator",
        description="小学、初中、高中数学",
        sort_order=2
    ),
    Category(
        id="english",
        name="英语",
        icon="Languages",
        description="小学、初中、高中英语",
        sort_order=3
    ),
    Category(
        id="physics",
        name="物理",
        icon="Atom",
        description="初中、高中物理",
        sort_order=4
    ),
    Category(
        id="chemistry",
        name="化学",
        icon="FlaskConical",
        description="初中、高中化学",
        sort_order=5
    ),
    Category(
        id="biology",
        name="生物",
        icon="Microscope",
        description="初中、高中生物",
        sort_order=6
    ),
    Category(
        id="history",
        name="历史",
        icon="Scroll",
        description="初中、高中历史",
        sort_order=7
    ),
    Category(
        id="geography",
        name="地理",
        icon="Globe",
        description="初中、高中地理",
        sort_order=8
    ),
    Category(
        id="politics",
        name="政治",
        icon="Scale",
        description="初中、高中政治/道德与法治",
        sort_order=9
    ),
]


# ============================================
# 路由端点
# ============================================

@router.get("", response_model=CategoryResponse)
async def get_categories():
    """
    获取所有学科分类列表

    Returns:
        CategoryResponse: 分类列表
    """
    return CategoryResponse(categories=CATEGORIES)


@router.get("/{category_id}", response_model=Category)
async def get_category(category_id: str):
    """
    获取单个分类详情

    Args:
        category_id: 分类ID

    Returns:
        Category: 分类详情
    """
    for category in CATEGORIES:
        if category.id == category_id:
            return category

    # 如果找不到返回 "全部" 分类
    return CATEGORIES[0]
