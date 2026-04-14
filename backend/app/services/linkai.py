"""
智教未来 - LinkAI 服务
集成 LinkAI 私有化版的四大 AI 功能工作流
"""

import json
from typing import Any, Dict, List, Optional

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class LinkAIError(Exception):
    """LinkAI 服务错误"""

    def __init__(self, message: str, code: Optional[str] = None):
        self.message = message
        self.code = code
        super().__init__(self.message)


class LinkAIService:
    """
    LinkAI 私有化版服务客户端

    封装四大 AI 功能工作流：
    - AI教案·大单元 (lesson)
    - AI命题 (question)
    - AI组题 (exam)
    - AI互动课件/教学动画 (animation)
    """

    def __init__(self):
        self.base_url = settings.LINKAI_API_BASE.rstrip("/")
        self.api_key = settings.LINKAI_API_KEY
        self.timeout = 120.0  # LinkAI 生成可能需要较长时间

        # 工作流编码映射
        self.workflow_codes = {
            "lesson": settings.LINKAI_WORKFLOW_LESSON,
            "question": settings.LINKAI_WORKFLOW_QUESTION,
            "exam": settings.LINKAI_WORKFLOW_EXAM,
            "animation": settings.LINKAI_WORKFLOW_ANIMATION,
        }

        logger.info(f"LinkAI 服务初始化完成，API地址: {self.base_url}")

    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _get_workflow_code(self, ai_function: str) -> str:
        """
        获取 AI 功能对应的工作流编码

        Args:
            ai_function: AI 功能类型 (lesson/question/exam/animation)

        Returns:
            str: 工作流编码
        """
        code = self.workflow_codes.get(ai_function)
        if not code:
            raise LinkAIError(f"未知AI功能类型: {ai_function}", "UNKNOWN_FUNCTION")
        return code

    def _build_workflow_input(self, ai_function: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        构建工作流输入参数

        Args:
            ai_function: AI 功能类型
            params: 输入参数

        Returns:
            Dict: 工作流输入
        """
        # 通用参数
        workflow_input = {
            "subject": params.get("subject", ""),
            "grade": params.get("grade", ""),
            "topic": params.get("topic", ""),
            "requirements": params.get("requirements", ""),
            "tags": params.get("tags", []),
        }

        # 根据功能类型添加特定参数
        if ai_function == "lesson":
            workflow_input.update({
                "lesson_type": params.get("lesson_type", "新授课"),
                "duration": params.get("duration", 45),
                "class_size": params.get("class_size", 40),
            })
        elif ai_function == "question":
            workflow_input.update({
                "difficulty": params.get("difficulty", "中等"),
                "question_types": params.get("question_types", ["选择", "填空"]),
                "question_count": params.get("question_count", 10),
            })
        elif ai_function == "exam":
            workflow_input.update({
                "exam_type": params.get("exam_type", "单元测试"),
                "total_score": params.get("total_score", 100),
                "exam_duration": params.get("exam_duration", 90),
            })
        elif ai_function == "animation":
            workflow_input.update({
                "animation_type": params.get("animation_type", "演示动画"),
                "duration": params.get("duration", 60),
                "resolution": params.get("resolution", "1920x1080"),
            })

        return workflow_input

    @retry(
        retry=retry_if_exception_type((httpx.NetworkError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def submit_workflow(
        self,
        ai_function: str,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        提交工作流到 LinkAI

        Args:
            ai_function: AI 功能类型 (lesson/question/exam/animation)
            params: 工作流输入参数

        Returns:
            Dict: 包含 task_id 和初始状态

        Raises:
            LinkAIError: 提交失败时
        """
        workflow_code = self._get_workflow_code(ai_function)
        workflow_input = self._build_workflow_input(ai_function, params)

        # 构建请求体
        payload = {
            "workflow_code": workflow_code,
            "input": workflow_input,
        }

        logger.info(f"提交 LinkAI 工作流: {ai_function}, workflow_code: {workflow_code}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/workflows/execute",
                    headers=self._get_headers(),
                    json=payload,
                )

                # 处理响应
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"LinkAI 工作流提交成功: {result.get('task_id', 'unknown')}")
                    return result
                else:
                    error_text = response.text
                    logger.error(f"LinkAI 工作流提交失败: HTTP {response.status_code}, {error_text}")
                    raise LinkAIError(
                        f"工作流提交失败: HTTP {response.status_code}",
                        f"HTTP_{response.status_code}"
                    )

        except httpx.TimeoutException:
            logger.error("LinkAI 请求超时")
            raise LinkAIError("请求超时，请稍后重试", "TIMEOUT")
        except httpx.NetworkError as e:
            logger.error(f"LinkAI 网络错误: {e}")
            raise LinkAIError("网络连接失败，请检查配置", "NETWORK_ERROR")
        except Exception as e:
            logger.error(f"LinkAI 未知错误: {e}")
            raise LinkAIError(f"未知错误: {str(e)}", "UNKNOWN_ERROR")

    async def query_workflow_status(self, task_id: str) -> Dict[str, Any]:
        """
        查询工作流执行状态

        Args:
            task_id: 任务ID

        Returns:
            Dict: 任务状态和结果

        Raises:
            LinkAIError: 查询失败时
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/v1/workflows/tasks/{task_id}",
                    headers=self._get_headers(),
                )

                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    raise LinkAIError(f"任务不存在: {task_id}", "TASK_NOT_FOUND")
                else:
                    error_text = response.text
                    logger.error(f"查询任务状态失败: HTTP {response.status_code}, {error_text}")
                    raise LinkAIError(
                        f"查询失败: HTTP {response.status_code}",
                        f"HTTP_{response.status_code}"
                    )

        except httpx.TimeoutException:
            raise LinkAIError("查询超时", "TIMEOUT")
        except LinkAIError:
            raise
        except Exception as e:
            logger.error(f"查询任务状态未知错误: {e}")
            raise LinkAIError(f"查询失败: {str(e)}", "UNKNOWN_ERROR")


# 全局服务实例
linkai_service = LinkAIService()


# 便捷函数
async def submit_generation_task(
    ai_function: str,
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    便捷函数：提交生成任务

    Args:
        ai_function: AI 功能类型
        params: 任务参数

    Returns:
        Dict: 任务信息
    """
    return await linkai_service.submit_workflow(ai_function, params)


async def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    便捷函数：查询任务状态

    Args:
        task_id: 任务ID

    Returns:
        Dict: 任务状态
    """
    return await linkai_service.query_workflow_status(task_id)
