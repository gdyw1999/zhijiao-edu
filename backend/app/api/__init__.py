"""
智教未来 - API 路由
"""

from fastapi import APIRouter

from app.api.routes import categories, chat, generations, health

# 创建主 API 路由器（不在此处加 prefix，由 main.py 注册时统一添加 /api）
router = APIRouter()

# 注册子路由
router.include_router(health.router, tags=["Health"])
router.include_router(categories.router, prefix="/categories", tags=["Categories"])
router.include_router(generations.router, prefix="/generations", tags=["Generations"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
