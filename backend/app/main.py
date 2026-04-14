"""
智教未来 - FastAPI 主应用入口
"""

import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api import router as api_router
from app.core.config import settings
from app.core.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    logger.info(f"🚀 智教未来 API 启动 - 环境: {settings.ENVIRONMENT}")
    logger.info(f"📡 服务地址: http://{settings.HOST}:{settings.PORT}")
    yield
    # 关闭时执行
    logger.info("👋 智教未来 API 关闭")


def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="智教未来 - AI教育平台API",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # 注册中间件
    register_middlewares(app)

    # 注册路由
    register_routers(app)

    # 注册异常处理
    register_exception_handlers(app)

    return app


def register_middlewares(app: FastAPI):
    """注册中间件"""

    # CORS 跨域中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOW_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # 请求日志中间件
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        import time

        start_time = time.time()

        # 记录请求
        logger.info(
            f"📥 {request.method} {request.url.path}",
            extra={
                "client": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown"),
            }
        )

        # 执行请求
        response = await call_next(request)

        # 计算耗时
        process_time = time.time() - start_time

        # 记录响应
        logger.info(
            f"📤 {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)",
            extra={
                "status_code": response.status_code,
                "process_time": process_time,
            }
        )

        # 添加响应头
        response.headers["X-Process-Time"] = str(process_time)

        return response


def register_routers(app: FastAPI):
    """注册路由"""
    # 主 API 路由
    app.include_router(api_router, prefix="/api")

    # 健康检查
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    # 根路径
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "api": "/api",
            "health": "/health",
        }


def register_exception_handlers(app: FastAPI):
    """注册异常处理器"""

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"❌ 未处理异常: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "服务器内部错误",
                "detail": str(exc) if settings.DEBUG else None,
            },
        )


# 创建应用实例
app = create_app()

# 用于命令行启动
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
    )
