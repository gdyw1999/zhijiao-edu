"""
智教未来 - 1052 Skill 执行服务调用封装

通过 HTTP 调用 1052-OS 的 /api/skill-exec 端点，
让 1052 的 LLM + Skill 系统生成 HTML 互动课件等内容。
"""

import asyncio
import json
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum

import httpx

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class StreamEventType(str, Enum):
    """SSE 事件类型"""
    ROUND_START = "round_start"       # LLM 开始新一轮
    DELTA = "delta"                  # 文本片段
    ROUND_END = "round_end"          # LLM 本轮结束
    DONE = "done"                    # 全部完成
    ERROR = "error"                  # 错误


@dataclass
class StreamEvent:
    """流式事件数据结构"""
    type: StreamEventType
    round_num: int = 0               # 当前轮次（从1开始）
    content: str = ""                # 文本内容（delta 时用）
    total_rounds: int = 0            # 总轮次（仅 round_start 时有用）
    html: str = ""                   # 最终 HTML（done 时用）
    error_code: str = ""             # 错误码（error 时用）

    def json(self) -> dict:
        """转换为 JSON 友好的字典格式"""
        return {
            "type": self.type.value,
            "round_num": self.round_num,
            "content": self.content,
            "total_rounds": self.total_rounds,
            "html": self.html,
            "error_code": self.error_code,
        }


class SkillExecError(Exception):
    """1052 Skill 执行服务错误"""

    def __init__(self, message: str, code: str = ""):
        self.message = message
        self.code = code
        super().__init__(self.message)


async def call_skill_exec(
    skill_id: str,
    prompt: str,
    timeout: int | None = None,
) -> dict:
    """
    调用 1052 skill-exec 端点生成 HTML

    Args:
        skill_id: 1052 中安装的 Skill ID（如 "interactive-game"）
        prompt: 用户生成请求描述
        timeout: HTTP 请求超时时间（秒），默认从 settings 读取

    Returns:
        dict: { ok: bool, html: str, files_created: list }

    Raises:
        SkillExecError: 调用失败时
    """
    # 从 settings 读取配置，支持调用方传入覆盖
    url = f"{settings.SKILL_EXEC_URL}/api/skill-exec"
    effective_timeout = timeout if timeout is not None else settings.SKILL_EXEC_TIMEOUT

    payload = {
        "skill_id": skill_id,
        "prompt": prompt,
    }

    logger.info(f"调用 1052 skill-exec: skill_id={skill_id}, prompt 长度={len(prompt)}")

    try:
        async with httpx.AsyncClient(timeout=effective_timeout) as client:
            response = await client.post(url, json=payload)

            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    html = result.get("html", "")
                    files = result.get("files_created", [])
                    logger.info(
                        f"1052 skill-exec 成功: skill_id={skill_id}, "
                        f"HTML 长度={len(html)}, 生成文件数={len(files)}"
                    )
                    return result
                else:
                    error_msg = result.get("error", "未知错误")
                    logger.error(f"1052 skill-exec 业务失败: {error_msg}")
                    raise SkillExecError(error_msg)
            else:
                error_text = response.text
                logger.error(
                    f"1052 skill-exec HTTP 错误: {response.status_code}, {error_text}"
                )
                raise SkillExecError(
                    f"skill-exec 调用失败: HTTP {response.status_code}",
                    f"HTTP_{response.status_code}",
                )

    except httpx.TimeoutException:
        logger.error("1052 skill-exec 请求超时")
        raise SkillExecError("请求超时，HTML 生成耗时过长", "TIMEOUT")
    except httpx.NetworkError as e:
        logger.error(f"1052 skill-exec 网络错误: {e}")
        raise SkillExecError(
            "无法连接 1052 服务，请确认 1052-OS 已启动", "NETWORK_ERROR"
        )
    except SkillExecError:
        raise  # 直接抛出已处理的错误
    except Exception as e:
        logger.error(f"1052 skill-exec 未知错误: {e}")
        raise SkillExecError(f"未知错误: {str(e)}", "UNKNOWN_ERROR")


async def call_skill_exec_stream(
    skill_id: str,
    prompt: str,
    timeout: int | None = None,
) -> AsyncGenerator[StreamEvent, None]:
    """
    调用 1052 skill-exec 端点生成 HTML（流式版本）。

    在 thread pool 中运行阻塞的 httpx POST 请求，
    并将 8027 返回的每轮进度实时 yield 出来。

    Args:
        skill_id: 1052 中安装的 Skill ID
        prompt: 用户生成请求描述
        timeout: HTTP 请求超时时间（秒），默认从 settings 读取

    Yields:
        StreamEvent: 每轮进度事件（round_start/delta/round_end/done/error）
    """
    url = f"{settings.SKILL_EXEC_URL}/api/skill-exec"
    effective_timeout = timeout if timeout is not None else settings.SKILL_EXEC_TIMEOUT

    payload = {
        "skill_id": skill_id,
        "prompt": prompt,
    }

    logger.info(f"[STREAM] 启动 skill-exec 流式调用: skill_id={skill_id}, prompt 长度={len(prompt)}")

    try:
        # 在独立线程中运行阻塞的同步 httpx 调用，避免阻塞事件循环
        loop = asyncio.get_running_loop()

        def do_request() -> dict:
            with httpx.Client(timeout=effective_timeout) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                return resp.json()

        # 在线程池中执行 HTTP 请求
        result = await loop.run_in_executor(None, do_request)

        if not result.get("ok"):
            error_msg = result.get("error", "未知错误")
            logger.error(f"[STREAM] skill-exec 业务失败: {error_msg}")
            yield StreamEvent(
                type=StreamEventType.ERROR,
                content=error_msg,
                error_code="BUSINESS_ERROR",
            )
            return

        html = result.get("html", "")
        files = result.get("files_created", [])
        rounds = result.get("rounds", 0)

        logger.info(f"[STREAM] skill-exec 完成: rounds={rounds}, HTML 长度={len(html)}, 文件数={len(files)}")

        # 推送完成事件（8027 已完成所有轮次，直接返回完整 HTML）
        yield StreamEvent(
            type=StreamEventType.DONE,
            content="",
            total_rounds=rounds,
            html=html,
        )

    except httpx.TimeoutException:
        logger.error("[STREAM] skill-exec 请求超时")
        yield StreamEvent(
            type=StreamEventType.ERROR,
            content="请求超时，HTML 生成耗时过长",
            error_code="TIMEOUT",
        )
    except httpx.NetworkError as e:
        logger.error(f"[STREAM] skill-exec 网络错误: {e}")
        yield StreamEvent(
            type=StreamEventType.ERROR,
            content="无法连接 1052 服务，请确认 1052-OS 已启动",
            error_code="NETWORK_ERROR",
        )
    except Exception as e:
        logger.error(f"[STREAM] skill-exec 未知错误: {e}")
        yield StreamEvent(
            type=StreamEventType.ERROR,
            content=f"未知错误: {str(e)}",
            error_code="UNKNOWN_ERROR",
        )
