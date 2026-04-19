"""
智教未来 - LinkAI 服务
集成 LinkAI 私有化版的四大 AI 功能工作流

真实 API 参考 docs/linkai接口.md：
  POST /v1/workflow/run
  请求体: { app_code, args: { input_text, ...自定义变量 } }
  响应体: { success, code, message, data: { output_text } }
"""

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class LinkAIError(Exception):
    """LinkAI 服务错误"""

    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(self.message)


class LinkAIService:
    """
    LinkAI 私有化版服务客户端

    封装四大 AI 功能工作流（通过 /v1/workflow/run 接口同步调用）：
    - AI教案·大单元 (lesson)
    - AI命题 (question)
    - AI组题 (exam)
    - AI互动课件/教学动画 (animation)
    """

    def __init__(self):
        self.base_url = settings.LINKAI_API_BASE.rstrip("/")
        self.api_key = settings.LINKAI_API_KEY
        self.timeout = 180.0  # LinkAI 工作流生成可能耗时较长

        # 各 AI 功能对应的工作流 app_code（从配置读取）
        self.app_codes = {
            "lesson": settings.LINKAI_WORKFLOW_LESSON,
            "question": settings.LINKAI_WORKFLOW_QUESTION,
            "exam": settings.LINKAI_WORKFLOW_EXAM,
            "animation": settings.LINKAI_WORKFLOW_ANIMATION,
        }

        logger.info(f"LinkAI 服务初始化完成，API地址: {self.base_url}")

    def _get_headers(self) -> dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _get_app_code(self, ai_function: str) -> str:
        """获取 AI 功能对应的工作流 app_code"""
        code = self.app_codes.get(ai_function)
        if not code:
            raise LinkAIError(f"未知AI功能类型: {ai_function}", "UNKNOWN_FUNCTION")
        return code

    def _build_args(self, ai_function: str, params: dict) -> dict:
        """
        构建工作流输入参数 args

        将通用的学科/年级/主题等信息拼接为 input_text，
        同时保留各模块的专属自定义变量。

        Args:
            ai_function: AI 功能类型 (lesson/question/exam/animation)
            params: 输入参数

        Returns:
            dict: 工作流 args
        """
        # 拼接核心描述文本（所有模块都需要）
        subject = params.get("subject", "")
        grade = params.get("grade", "")
        topic = params.get("topic", "")
        requirements = params.get("requirements", "")

        # 构造 input_text —— 工作流的文字输入变量
        parts = []
        if subject:
            parts.append(f"学科：{subject}")
        if grade:
            parts.append(f"年级：{grade}")
        if topic:
            parts.append(f"主题：{topic}")
        if requirements:
            parts.append(f"要求：{requirements}")

        args = {
            "input_text": "\n".join(parts),
        }

        # 根据功能类型添加专属自定义变量
        if ai_function == "lesson":
            args.update({
                "lesson_type": params.get("lesson_type", "新授课"),
                "class_size": str(params.get("class_size", 40)),
            })
        elif ai_function == "question":
            args.update({
                "difficulty": params.get("difficulty", "中等"),
                "question_types": params.get("question_types", "选择,填空"),
                "question_count": str(params.get("question_count", 10)),
            })
        elif ai_function == "exam":
            args.update({
                "exam_type": params.get("exam_type", "单元测试"),
                "total_score": str(params.get("total_score", 100)),
                "exam_duration": str(params.get("exam_duration", 90)),
            })
        elif ai_function == "animation":
            args.update({
                "animation_type": params.get("animation_type", "演示动画"),
                "duration": str(params.get("duration", 60)),
            })

        return args

    @retry(
        retry=retry_if_exception_type((httpx.NetworkError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def run_workflow(self, ai_function: str, params: dict) -> dict:
        """
        同步调用 LinkAI 工作流（直接返回生成结果）

        Args:
            ai_function: AI 功能类型 (lesson/question/exam/animation)
            params: 工作流输入参数

        Returns:
            dict: { success, output_text } 工作流输出

        Raises:
            LinkAIError: 调用失败时
        """
        app_code = self._get_app_code(ai_function)
        args = self._build_args(ai_function, params)

        payload = {
            "app_code": app_code,
            "args": args,
        }

        logger.info(f"调用 LinkAI 工作流: {ai_function}, app_code: {app_code}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/workflow/run",
                    headers=self._get_headers(),
                    json=payload,
                )

                if response.status_code == 200:
                    result = response.json()

                    # LinkAI 真实响应格式：{ success, code, message, data: { output_text } }
                    if result.get("success"):
                        output_text = result.get("data", {}).get("output_text", "")
                        logger.info(f"LinkAI 工作流调用成功: {ai_function}, 输出长度: {len(output_text)}")
                        return {
                            "success": True,
                            "output_text": output_text,
                        }
                    else:
                        error_msg = result.get("message", "未知错误")
                        error_code = str(result.get("code", "UNKNOWN"))
                        logger.error(f"LinkAI 工作流业务错误: {error_msg}")
                        raise LinkAIError(error_msg, error_code)
                else:
                    error_text = response.text
                    logger.error(f"LinkAI 工作流 HTTP 错误: {response.status_code}, {error_text}")
                    raise LinkAIError(
                        f"工作流调用失败: HTTP {response.status_code}",
                        f"HTTP_{response.status_code}",
                    )

        except httpx.TimeoutException:
            logger.error("LinkAI 请求超时")
            raise LinkAIError("请求超时，请稍后重试", "TIMEOUT")
        except httpx.NetworkError as e:
            logger.error(f"LinkAI 网络错误: {e}")
            raise LinkAIError("网络连接失败，请检查配置", "NETWORK_ERROR")
        except LinkAIError:
            raise  # 直接抛出已处理的 LinkAI 错误
        except Exception as e:
            logger.error(f"LinkAI 未知错误: {e}")
            raise LinkAIError(f"未知错误: {str(e)}", "UNKNOWN_ERROR")


# 全局服务实例
linkai_service = LinkAIService()
