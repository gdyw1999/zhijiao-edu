"""
智教未来 - API 路由
"""

from fastapi import APIRouter

from app.api.routes import categories, chat, generations, health

# 创建主 API 路由器
router = APIRouter(prefix="/api")

# 注册子路由
router.include_router(health.router, tags=["Health"])
router.include_router(categories.router, prefix="/categories", tags=["Categories"])
router.include_router(generations.router, prefix="/generations", tags=["Generations"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
