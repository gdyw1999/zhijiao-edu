"""
智教未来 - 日志配置
提供统一的结构化日志记录
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """JSON 格式日志格式化器"""

    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # 添加额外字段
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # 添加异常信息
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # 添加调用位置信息（仅在 DEBUG 模式）
        if settings.DEBUG:
            log_data["source"] = {
                "file": record.filename,
                "line": record.lineno,
                "function": record.funcName,
            }

        return json.dumps(log_data, ensure_ascii=False, default=str)


class ColoredFormatter(logging.Formatter):
    """带颜色的控制台日志格式化器"""

    # ANSI 颜色码
    COLORS = {
        "DEBUG": "\x1b[36m",     # 青色
        "INFO": "\x1b[32m",      # 绿色
        "WARNING": "\x1b[33m",   # 黄色
        "ERROR": "\x1b[31m",     # 红色
        "CRITICAL": "\x1b[35m",  # 紫色
        "RESET": "\x1b[0m",      # 重置
    }

    def format(self, record: logging.LogRecord) -> str:
        # 添加颜色
        levelname = record.levelname
        if levelname in self.COLORS:
            colored_level = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
            record.levelname = colored_level

        # 格式化时间
        record.asctime = self.formatTime(record)

        # 构建消息
        msg = super().format(record)

        # 恢复原始 levelname
        record.levelname = levelname

        return msg


def setup_logging() -> logging.Logger:
    """
    配置并返回应用日志记录器

    Returns:
        logging.Logger: 配置好的日志记录器
    """
    # 创建根日志记录器
    logger = logging.getLogger("zhijiao")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    logger.handlers = []  # 清除现有处理器

    # 避免日志重复
    logger.propagate = False

    # 根据格式选择格式化器
    if settings.LOG_FORMAT == "json":
        formatter: logging.Formatter = JSONFormatter()
    else:
        # 文本格式（带颜色）
        formatter = ColoredFormatter(
            fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    logger.addHandler(console_handler)

    return logger


# 全局日志记录器实例
logger = setup_logging()


def get_logger(name: str) -> logging.Logger:
    """
    获取命名日志记录器

    Args:
        name: 日志记录器名称（建议使用模块名）

    Returns:
        logging.Logger: 命名日志记录器
    """
    return logging.getLogger(f"zhijiao.{name}")
