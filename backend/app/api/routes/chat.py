"""
智教未来 - AI 对话与生成路由
同步调用 LinkAI 工作流，直接返回生成结果
"""

import json
import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.core.config import settings
from app.services.linkai import linkai_service, LinkAIError
from app.services.skill_exec import (
    call_skill_exec,
    call_skill_exec_stream,
    SkillExecError,
    StreamEvent,
    StreamEventType,
)

router = APIRouter()
logger = get_logger(__name__)


# ============================================
# 数据模型
# ============================================

class AIFunction(str, Enum):
    """AI 功能类型"""
    LESSON = "lesson"           # AI教案·大单元
    QUESTION = "question"       # AI命题
    EXAM = "exam"               # AI组题
    ANIMATION = "animation"     # AI互动课件/教学动画


class ContentType(str, Enum):
    """内容类型"""
    MARKDOWN = "markdown"       # Markdown 文本
    HTML = "html"               # HTML 文件（互动课件/游戏）


class GenerateRequest(BaseModel):
    """生成任务请求"""
    ai_function: AIFunction = Field(..., description="AI功能类型")
    subject: str = Field(..., description="学科（语文/数学/英语等）")
    grade: str = Field(..., description="年级（如：三年级、高一）")
    topic: str = Field(..., description="主题/知识点")
    requirements: Optional[str] = Field(None, description="具体要求/描述")
    tags: List[str] = Field(default_factory=list, description="标签列表")

    # 模块专属参数（可选）
    # 互动课件
    animation_type: Optional[str] = Field(None, description="动画类型（演示动画/教学游戏/多页课件）")
    duration: Optional[int] = Field(None, description="时长（秒）")
    # 命题
    difficulty: Optional[str] = Field(None, description="难度（简单/中等/困难）")
    question_types: Optional[List[str]] = Field(None, description="题型列表（选择/填空/解答等）")
    question_count: Optional[int] = Field(None, description="题目数量")
    # 组题
    exam_type: Optional[str] = Field(None, description="试卷类型（单元测试/期中/期末）")
    total_score: Optional[int] = Field(None, description="总分")
    exam_duration: Optional[int] = Field(None, description="考试时长（分钟）")
    # 教案
    lesson_type: Optional[str] = Field(None, description="课时类型（新授课/复习课/实验课）")
    class_size: Optional[int] = Field(None, description="班级人数")


class TaskResult(BaseModel):
    """任务结果"""
    task_id: str = Field(..., description="任务ID")
    ai_function: str = Field(..., description="AI功能类型")
    title: str = Field(..., description="生成内容标题")
    content: str = Field(..., description="生成的完整内容（Markdown 或 HTML）")
    content_type: ContentType = Field(..., description="内容类型（markdown/html）")
    summary: str = Field(..., description="内容摘要")
    tags: List[str] = Field(default_factory=list, description="标签")
    html_url: Optional[str] = Field(None, description="HTML 文件路径（content_type=html 时有值）")
    structured_data: Optional[dict] = Field(None, description="结构化数据（阶段二解析后填充）")
    created_at: datetime = Field(..., description="创建时间")


# ============================================
# 辅助函数
# ============================================

# AI 功能中文名称映射（从 generations.py 同步）
AI_FUNCTION_NAMES = {
    "lesson": "AI教案·大单元",
    "question": "AI命题",
    "exam": "AI组题",
    "animation": "AI互动课件",
}

# 简单判断内容是否为 HTML（含互动课件/游戏标记）
_HTML_MARKERS = ["<!DOCTYPE", "<html", "<!doctype html"]


def _detect_content_type(content: str) -> ContentType:
    """
    根据内容特征判断是 HTML 还是 Markdown。

    如果内容以 HTML 标签开头，判定为 HTML 类型（互动课件/游戏）。
    否则默认为 Markdown。
    """
    # 去除首行空白后检查
    first_line = content.lstrip()[:50].lower()
    for marker in _HTML_MARKERS:
        if first_line.startswith(marker):
            return ContentType.HTML
    return ContentType.MARKDOWN


def _build_title(request: GenerateRequest) -> str:
    """根据请求参数生成结果标题"""
    func_name = AI_FUNCTION_NAMES.get(request.ai_function.value, "AI生成")
    return f"{request.subject}{request.grade}{request.topic}{func_name}"


def _build_summary(request: GenerateRequest) -> str:
    """根据请求参数生成结果摘要"""
    func_name = AI_FUNCTION_NAMES.get(request.ai_function.value, "AI生成")
    return f"为{request.grade}{request.subject}生成的{func_name}内容，主题是{request.topic}。"


def _request_to_params(request: GenerateRequest) -> dict:
    """将 GenerateRequest 转换为 LinkAI 工作流参数"""
    params = {
        "subject": request.subject,
        "grade": request.grade,
        "topic": request.topic,
        "requirements": request.requirements or "",
        "tags": request.tags,
    }

    # 附加模块专属参数（仅传入非空值）
    optional_fields = [
        "animation_type", "duration", "difficulty",
        "question_types", "question_count", "exam_type",
        "total_score", "exam_duration", "lesson_type", "class_size",
    ]
    for field in optional_fields:
        value = getattr(request, field, None)
        if value is not None:
            params[field] = value

    return params


# ============================================
# 路由端点
# ============================================


async def _generate_via_skill_exec(
    request: GenerateRequest, task_id: str, now: datetime
) -> TaskResult:
    """
    通过 1052 Skill 执行服务生成 HTML 互动游戏

    调用 1052 的 /api/skill-exec 端点，由 1052 的 LLM + Skill 系统
    生成完整的 HTML 文件，直接返回给前端 iframe 渲染。
    """
    # 构建生成 prompt：将请求参数拼接为自然语言描述
    prompt_parts = [f"请创建一个互动游戏"]
    if request.subject:
        prompt_parts.append(f"学科：{request.subject}")
    if request.grade:
        prompt_parts.append(f"年级：{request.grade}")
    if request.topic:
        prompt_parts.append(f"主题/知识点：{request.topic}")
    if request.requirements:
        prompt_parts.append(f"具体要求：{request.requirements}")
    prompt = "\n".join(prompt_parts)

    # 根据学科查找对应的 1052 Skill ID
    skill_id = settings.get_skill_id_for_subject(request.subject)

    logger.info(f"调用 1052 skill-exec: {task_id}, skill_id={skill_id}")

    result = await call_skill_exec(
        skill_id=skill_id,
        prompt=prompt,
    )

    html = result.get("html", "")

    return TaskResult(
        task_id=task_id,
        ai_function=request.ai_function.value,
        title=_build_title(request),
        content=html,
        content_type=ContentType.HTML,
        summary=_build_summary(request),
        tags=[request.subject, request.grade] + request.tags,
        created_at=now,
    )

@router.post("/generate", response_model=TaskResult)
async def generate(request: GenerateRequest):
    """
    同步调用 LinkAI 工作流生成内容

    直接调用 LinkAI /v1/workflow/run 接口，等待结果返回。
    不使用后台任务或轮询机制。

    Args:
        request: 生成请求参数

    Returns:
        TaskResult: 包含生成结果的完整响应
    """
    task_id = str(uuid.uuid4())
    now = datetime.now()

    logger.info(
        f"收到生成请求: {task_id}, 功能: {request.ai_function.value}, "
        f"学科: {request.subject}, 主题: {request.topic}"
    )

    try:
        # 判断是否走 1052 skill-exec 路径（互动课件的互动游戏类型）
        if (
            request.ai_function == AIFunction.ANIMATION
            and request.animation_type == "互动游戏"
        ):
            return await _generate_via_skill_exec(request, task_id, now)

        # 其他情况走 LinkAI 工作流
        # 构建参数并调用 LinkAI
        params = _request_to_params(request)
        result = await linkai_service.run_workflow(request.ai_function.value, params)

        output_text = result.get("output_text", "")

        # 检测内容类型
        content_type = _detect_content_type(output_text)

        # 构建返回结果
        task_result = TaskResult(
            task_id=task_id,
            ai_function=request.ai_function.value,
            title=_build_title(request),
            content=output_text,
            content_type=content_type,
            summary=_build_summary(request),
            tags=[request.subject, request.grade] + request.tags,
            created_at=now,
        )

        logger.info(f"生成完成: {task_id}, 内容长度: {len(output_text)}, 类型: {content_type.value}")
        return task_result

    except LinkAIError as e:
        logger.error(f"LinkAI 调用失败: {task_id}, 错误: {e.message}")
        raise HTTPException(
            status_code=502,
            detail=f"AI服务调用失败: {e.message}",
        )
    except SkillExecError as e:
        logger.error(f"1052 skill-exec 调用失败: {task_id}, 错误: {e.message}")
        raise HTTPException(
            status_code=502,
            detail=f"互动课件生成服务调用失败: {e.message}",
        )


async def _build_skill_exec_prompt(request: GenerateRequest) -> str:
    """将请求参数拼接为自然语言 prompt"""
    prompt_parts = ["请创建一个互动游戏"]
    if request.subject:
        prompt_parts.append(f"学科：{request.subject}")
    if request.grade:
        prompt_parts.append(f"年级：{request.grade}")
    if request.topic:
        prompt_parts.append(f"主题/知识点：{request.topic}")
    if request.requirements:
        prompt_parts.append(f"具体要求：{request.requirements}")
    return "\n".join(prompt_parts)


async def _generate_stream_via_skill_exec(request: GenerateRequest, task_id: str):
    """
    通过 1052 Skill 执行服务生成 HTML（流式版本）。

    调用 call_skill_exec_stream 异步生成器，
    将每轮进度实时 yield 为 SSE 事件推送给前端。
    """
    prompt = await _build_skill_exec_prompt(request)
    skill_id = settings.get_skill_id_for_subject(request.subject)

    logger.info(f"[STREAM] 开始流式生成: {task_id}, skill_id={skill_id}")

    async for event in call_skill_exec_stream(skill_id=skill_id, prompt=prompt):
        if event.type == StreamEventType.DONE:
            # 推送完成事件，包含最终 HTML
            yield f"data: {json.dumps(event.json())}\n\n"
            logger.info(f"[STREAM] 流式生成完成: {task_id}")
            break
        elif event.type == StreamEventType.ERROR:
            yield f"data: {json.dumps(event.json())}\n\n"
            logger.error(f"[STREAM] 流式生成错误: {task_id}, {event.content}")
            break
        else:
            # round_start / delta / round_end 等中间事件
            yield f"data: {json.dumps(event.json())}\n\n"


@router.post("/generate/stream")
async def generate_stream(request: GenerateRequest):
    """
    流式调用 1052 skill-exec 生成 HTML 互动游戏。

    使用 SSE（Server-Sent Events）实时推送每轮进度，
    前端通过 ReadableStream 接收并实时渲染。

    事件格式：
      - round_start: 某轮 LLM 开始
      - delta: 文本片段（LLM 回复的增量内容）
      - round_end: 某轮 LLM 结束
      - done: 全部完成，包含最终 HTML
      - error: 发生错误

    仅支持 animation + 互动游戏 类型，其他类型返回 400。
    """
    task_id = str(uuid.uuid4())

    logger.info(
        f"[STREAM] 收到流式生成请求: {task_id}, 功能: {request.ai_function.value}, "
        f"学科: {request.subject}, 主题: {request.topic}"
    )

    # 仅支持 animation 互动游戏类型
    if request.ai_function != AIFunction.ANIMATION or request.animation_type != "互动游戏":
        raise HTTPException(
            status_code=400,
            detail="流式生成仅支持 animation + 互动游戏 类型",
        )

    return StreamingResponse(
        _generate_stream_via_skill_exec(request, task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 Nginx buffer
        },
    )


@router.get("/tasks", response_model=list)
async def list_tasks(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    列出最近的生成任务

    阶段一返回空列表，阶段三改为查询数据库。
    """
    return []
