"""
智教未来 - 健康检查路由
"""

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    健康检查端点

    Returns:
        dict: 服务状态信息
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check():
    """
    就绪检查端点（用于 Kubernetes）

    Returns:
        dict: 就绪状态
    """
    return {
        "ready": True,
        "checks": {
            "database": "ok",  # TODO: 添加实际数据库检查
            "redis": "ok",     # TODO: 添加实际 Redis 检查
        }
    }
