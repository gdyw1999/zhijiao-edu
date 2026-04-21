"""
智教未来 - 应用配置
从项目根目录的 .env 文件加载配置
"""

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# 项目根目录（从backend/app/core/config.py 往上找两级）
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


class Settings(BaseSettings):
    """应用配置类 - 从项目根目录的 .env 文件读取"""

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",  # 忽略未定义的变量
    )

    # ============================================
    # 1. 基础应用配置
    # ============================================
    APP_NAME: str = Field(default="智教未来", description="应用名称")
    APP_VERSION: str = Field(default="1.0.0", description="应用版本")
    ENVIRONMENT: str = Field(default="development", description="运行环境")
    DEBUG: bool = Field(default=True, description="调试模式")

    # ============================================
    # 2. 服务端口配置
    # ============================================
    BACKEND_PORT: int = Field(default=8000, description="后端端口")
    FRONTEND_PORT: int = Field(default=3000, description="前端端口")

    # 计算属性：主机和端口
    @property
    def HOST(self) -> str:
        """监听主机地址"""
        return "0.0.0.0" if self.ENVIRONMENT == "production" else "127.0.0.1"

    @property
    def PORT(self) -> int:
        """后端服务端口"""
        return self.BACKEND_PORT

    @property
    def WORKERS(self) -> int:
        """工作进程数（生产环境）"""
        import multiprocessing

        return multiprocessing.cpu_count() * 2 + 1 if self.ENVIRONMENT == "production" else 1

    # ============================================
    # 3. 数据库配置 (PostgreSQL)
    # ============================================
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/zhijiao",
        description="PostgreSQL 连接字符串",
    )

    DB_POOL_SIZE: int = Field(default=10, description="连接池大小")
    DB_MAX_OVERFLOW: int = Field(default=20, description="连接池溢出")

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """转换为异步连接字符串"""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

    # ============================================
    # 4. Redis 配置
    # ============================================
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis 连接字符串",
    )

    REDIS_POOL_SIZE: int = Field(default=10, description="Redis 连接池大小")

    # ============================================
    # 5. LinkAI 配置 (四大AI功能)
    # ============================================
    LINKAI_API_BASE: str = Field(
        default="http://localhost:8080",
        description="LinkAI 私有化版 API 基础地址",
    )
    LINKAI_API_KEY: str = Field(
        default="",
        description="LinkAI API 密钥",
    )

    # 四大 AI 功能工作流编码
    LINKAI_WORKFLOW_LESSON: str = Field(
        default="lesson_plan_workflow",
        description="AI教案·大单元 - 用于生成完整教学设计",
    )
    LINKAI_WORKFLOW_QUESTION: str = Field(
        default="question_gen_workflow",
        description="AI命题 - 用于生成考试题目",
    )
    LINKAI_WORKFLOW_EXAM: str = Field(
        default="exam_gen_workflow",
        description="AI组题 - 用于组合完整试卷",
    )
    LINKAI_WORKFLOW_ANIMATION: str = Field(
        default="animation_workflow",
        description="AI互动课件/教学动画 - 用于生成教学动画脚本",
    )

    # ============================================
    # 6. 作业批改中台配置
    # ============================================
    CORRECTION_API_BASE: str = Field(
        default="http://localhost:3005",
        description="作业批改中台 API 地址",
    )
    CORRECTION_API_KEY: str = Field(
        default="",
        description="作业批改中台 API 密钥",
    )

    # ============================================
    # 6.5. 1052 Skill 执行服务配置
    # ============================================
    SKILL_EXEC_URL: str = Field(
        default="http://localhost:10053",
        description="1052 Skill 执行服务地址",
    )
    SKILL_EXEC_TIMEOUT: int = Field(
        default=300,
        description="Skill 执行超时时间（秒）",
    )
    SKILL_EXEC_DEFAULT_SKILL: str = Field(
        default="interactive-game",
        description="未匹配学科时的默认 Skill ID",
    )
    SKILL_EXEC_SUBJECT_MAP: str = Field(
        default="{}",
        description="学科→Skill 映射表（JSON 格式，key=学科，value=skill_id）",
    )

    @property
    def skill_exec_subject_map(self) -> Dict[str, str]:
        """解析学科→Skill 映射表为字典"""
        try:
            return json.loads(self.SKILL_EXEC_SUBJECT_MAP)
        except (json.JSONDecodeError, TypeError):
            return {}

    def get_skill_id_for_subject(self, subject: str) -> str:
        """根据学科名称获取对应的 Skill ID，未匹配时返回默认值"""
        return self.skill_exec_subject_map.get(subject, self.SKILL_EXEC_DEFAULT_SKILL)

    # ============================================
    # 7. 安全配置 (JWT)
    # ============================================
    JWT_SECRET: str = Field(
        default="your-secret-key-change-in-production",
        description="JWT 签名密钥",
    )
    JWT_EXPIRES_IN: str = Field(
        default="7d",
        description="JWT 过期时间",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT 签名算法")

    # ============================================
    # 8. 对象存储配置 (MinIO)
    # ============================================
    STORAGE_TYPE: str = Field(default="minio", description="存储类型")
    MINIO_ENDPOINT: str = Field(default="localhost", description="MinIO 服务端点")
    MINIO_PORT: int = Field(default=9000, description="MinIO 端口")
    MINIO_ACCESS_KEY: str = Field(default="minioadmin", description="MinIO 访问密钥")
    MINIO_SECRET_KEY: str = Field(default="minioadmin", description="MinIO 密钥")
    MINIO_BUCKET: str = Field(default="zhijiao", description="MinIO 存储桶")

    @property
    def MINIO_ENDPOINT_URL(self) -> str:
        """MinIO 完整端点 URL"""
        return f"http://{self.MINIO_ENDPOINT}:{self.MINIO_PORT}"

    # ============================================
    # 9. CORS 跨域配置
    # ============================================
    CORS_ALLOW_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="允许的跨域来源",
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="允许携带凭证")
    CORS_ALLOW_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        description="允许的 HTTP 方法",
    )
    CORS_ALLOW_HEADERS: List[str] = Field(
        default=["*"],
        description="允许的请求头",
    )

    # ============================================
    # 10. 日志配置
    # ============================================
    LOG_LEVEL: str = Field(default="INFO", description="日志级别")
    LOG_FORMAT: str = Field(
        default="json",
        description="日志格式 (json/text)",
    )


# 全局配置实例（单例模式）
@lru_cache
def get_settings() -> Settings:
    """获取应用配置（带缓存）"""
    return Settings()


# 导出默认配置实例
settings = get_settings()
