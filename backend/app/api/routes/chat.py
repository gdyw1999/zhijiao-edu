"""
智教未来 - AI 对话与生成路由
处理 AI 生成任务创建和状态查询
"""

import asyncio
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logger import get_logger

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


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"         # 等待中
    PROCESSING = "processing"   # 处理中
    COMPLETED = "completed"     # 完成
    FAILED = "failed"           # 失败


class GenerateRequest(BaseModel):
    """生成任务请求"""
    ai_function: AIFunction = Field(..., description="AI功能类型")
    subject: str = Field(..., description="学科（语文/数学/英语等）")
    grade: str = Field(..., description="年级（如：三年级、高一）")
    topic: str = Field(..., description="主题/知识点")
    requirements: Optional[str] = Field(None, description="具体要求/描述")
    tags: List[str] = Field(default_factory=list, description="标签列表")


class GenerateResponse(BaseModel):
    """生成任务响应"""
    task_id: str = Field(..., description="任务ID")
    status: TaskStatus = Field(..., description="任务状态")
    message: str = Field(..., description="状态消息")
    created_at: datetime = Field(..., description="创建时间")


class TaskResult(BaseModel):
    """任务结果"""
    title: str = Field(..., description="生成内容标题")
    content: str = Field(..., description="生成的完整内容")
    summary: str = Field(..., description="内容摘要")
    tags: List[str] = Field(default_factory=list, description="标签")


class TaskStatusResponse(BaseModel):
    """任务状态查询响应"""
    task_id: str = Field(..., description="任务ID")
    status: TaskStatus = Field(..., description="任务状态")
    progress: int = Field(..., description="进度百分比(0-100)", ge=0, le=100)
    message: str = Field(..., description="状态消息")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    result: Optional[TaskResult] = Field(None, description="任务结果（完成后）")
    error: Optional[str] = Field(None, description="错误信息（失败时）")


# ============================================
# 内存任务存储（生产环境应使用 Redis/数据库）
# ============================================

# 任务存储字典
_tasks: Dict[str, dict] = {}


# ============================================
# 辅助函数
# ============================================

def get_workflow_code(ai_function: AIFunction) -> str:
    """
    获取 AI 功能对应的 LinkAI 工作流编码

    Args:
        ai_function: AI 功能类型

    Returns:
        str: LinkAI 工作流编码
    """
    workflow_map = {
        AIFunction.LESSON: settings.LINKAI_WORKFLOW_LESSON,
        AIFunction.QUESTION: settings.LINKAI_WORKFLOW_QUESTION,
        AIFunction.EXAM: settings.LINKAI_WORKFLOW_EXAM,
        AIFunction.ANIMATION: settings.LINKAI_WORKFLOW_ANIMATION,
    }
    return workflow_map.get(ai_function, settings.LINKAI_WORKFLOW_LESSON)


async def process_generation_task(task_id: str, request: GenerateRequest):
    """
    后台处理生成任务（模拟 LinkAI 调用）

    Args:
        task_id: 任务ID
        request: 生成请求
    """
    task = _tasks.get(task_id)
    if not task:
        return

    try:
        # 模拟处理过程
        # 阶段1：提交到 LinkAI (30%)
        task["status"] = TaskStatus.PROCESSING
        task["progress"] = 10
        task["message"] = "正在提交任务到 AI 服务..."
        task["updated_at"] = datetime.now()
        await asyncio.sleep(1)

        # 阶段2：AI 处理中 (60%)
        task["progress"] = 40
        task["message"] = "AI 正在生成内容..."
        task["updated_at"] = datetime.now()
        await asyncio.sleep(2)

        # 阶段3：生成结果 (90%)
        task["progress"] = 80
        task["message"] = "正在整理生成结果..."
        task["updated_at"] = datetime.now()
        await asyncio.sleep(1)

        # 生成结果内容
        ai_func_name = AI_FUNCTIONS.get(request.ai_function, "AI生成")
        title = f"{request.subject}{request.grade}{request.topic}{ai_func_name}"

        # 根据 AI 功能生成不同内容
        if request.ai_function == AIFunction.LESSON:
            content = f"""# {title}

## 一、教学目标
1. 知识与技能：掌握{request.topic}的核心概念和基本原理
2. 过程与方法：通过探究活动，培养学生的分析能力和解决问题的能力
3. 情感态度与价值观：激发学生对{request.subject}的学习兴趣

## 二、教学重难点
- 教学重点：{request.topic}的概念理解和应用
- 教学难点：知识的迁移和综合运用

## 三、教学过程设计

### 第一课时：导入与探究
1. **情境导入**（10分钟）
   - 创设问题情境，激发学习兴趣
   - 引导学生提出探究问题

2. **合作探究**（25分钟）
   - 小组合作完成任务
   - 教师巡视指导

3. **交流展示**（10分钟）
   - 小组展示探究成果
   - 师生共同点评

### 第二课时：巩固与应用
...

## 四、板书设计
...

## 五、教学反思
..."""
        elif request.ai_function == AIFunction.QUESTION:
            content = f"""# {title}

## 一、基础巩固题

### 1. 选择题
**题目：** 关于{request.topic}，下列说法正确的是（  ）

A. ...
B. ...
C. ...
D. ...

**答案：** C

**解析：** 本题考查{request.topic}的基本概念...

### 2. 填空题
**题目：** ...

**答案：** ...

---

## 二、能力提升题

### 3. 解答题
**题目：** ...

**解：** ...

---

## 三、拓展探究题
...

## 参考答案与评分标准
..."""
        elif request.ai_function == AIFunction.EXAM:
            content = f"""# {title}

**考试时间：** 90分钟
**满分：** 100分

---

## 一、选择题（本大题共10小题，每小题3分，共30分）

1.  ...  （  ）

A.     B.     C.     D.

2.  ...  （  ）

...

---

## 二、填空题（本大题共5小题，每小题4分，共20分）

11. ...

12. ...

...

---

## 三、解答题（本大题共5小题，共50分）

16. （8分）...

**解：**

...

---

## 参考答案

### 一、选择题
1-5: CABDA  6-10: BCDAC

### 二、填空题
...

### 三、解答题
...

### 评分标准
..."""
        else:  # animation
            content = f"""# {title}

## 一、动画概述

**动画名称：** {request.topic}互动演示
**适用年级：** {request.grade}
**学科：** {request.subject}
**预计时长：** 50秒

## 二、教学目标

1. 通过动画演示，帮助学生直观理解{request.topic}
2. 培养学生的空间想象能力和逻辑思维能力
3. 激发学生的学习兴趣和探究欲望

## 三、动画脚本设计

### 场景1：引入（0:00-0:10，共10秒）

**画面：**
- 背景：简洁的教室场景
- 出现标题：{request.topic}
- 轻微的背景音乐响起

**旁白：**
"今天，我们一起来探索{request.topic}的奥秘。"

**交互：** 显示"开始探索"按钮

---

### 场景2：主体演示（0:10-0:40，共30秒）

**画面：**
- 动态演示{request.topic}的核心概念
- 关键元素高亮显示
- 配合动态标注

**旁白：**
（根据具体内容设计讲解词）

**交互：**
- 左下角：暂停/播放按钮
- 进度条：可拖动
- 右下角：倍速选择（0.5x/1x/1.5x/2x）

---

### 场景3：总结（0:40-0:50，共10秒）

**画面：**
- 回顾本次动画演示的重点内容
- 显示关键知识点的文字总结
- 渐出效果

**旁白：**
"通过今天的学习，我们了解了{request.topic}，希望能帮助你更好地掌握这个知识点。"

**交互：** 显示"重新观看"和"相关练习"按钮

## 四、技术实现建议

### 动画技术选型
- 推荐使用：HTML5 Canvas / SVG + CSS3 Animation
- 备选方案：Lottie动画、After Effects导出

### 交互功能实现
- 使用 JavaScript 控制播放逻辑
- 事件监听：点击、拖动、键盘快捷键

### 性能优化
- 图片资源压缩
- 懒加载非首屏内容
- 适当的缓存策略

## 五、评估与反馈

### 效果评估指标
- 学生观看完成率
- 互动功能使用频率
- 配套测试成绩提升

### 收集反馈方式
- 课后问卷
- 学习行为数据分析
- 教师观察记录
"""

        # 完成
        task["status"] = TaskStatus.COMPLETED
        task["progress"] = 100
        task["message"] = "生成完成"
        task["updated_at"] = datetime.now()
        task["result"] = {
            "title": title,
            "content": content,
            "summary": f"为{request.grade}{request.subject}学科生成的{ai_func_name}内容，主题是{request.topic}。",
            "tags": [request.subject, request.grade, ai_func_name],
        }

    except Exception as e:
        # 处理错误
        logger.error(f"任务处理失败: {e}", exc_info=True)
        task["status"] = TaskStatus.FAILED
        task["progress"] = 0
        task["message"] = f"生成失败: {str(e)}"
        task["updated_at"] = datetime.now()
        task["error"] = str(e)


# ============================================
# 路由端点
# ============================================

@router.post("/generate", response_model=GenerateResponse)
async def create_generation_task(
    request: GenerateRequest,
    background_tasks: BackgroundTasks,
):
    """
    创建 AI 生成任务

    提交一个内容生成任务到 LinkAI 工作流，返回任务ID用于后续查询。

    Args:
        request: 生成任务请求参数
        background_tasks: 后台任务

    Returns:
        GenerateResponse: 包含任务ID和初始状态
    """
    # 生成任务ID
    task_id = str(uuid.uuid4())

    # 创建任务记录
    now = datetime.now()
    _tasks[task_id] = {
        "id": task_id,
        "status": TaskStatus.PENDING,
        "progress": 0,
        "message": "任务已提交，等待处理...",
        "created_at": now,
        "updated_at": now,
        "request": request.model_dump(),
        "result": None,
        "error": None,
    }

    # 启动后台处理任务
    background_tasks.add_task(process_generation_task, task_id, request)

    logger.info(f"创建生成任务: {task_id}, 功能: {request.ai_function}, 学科: {request.subject}")

    return GenerateResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        message="任务已提交，等待处理...",
        created_at=now,
    )


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    查询生成任务状态

    根据任务ID查询生成任务的当前状态和进度。

    Args:
        task_id: 任务ID

    Returns:
        TaskStatusResponse: 任务状态详情

    Raises:
        HTTPException: 任务不存在时返回 404
    """
    task = _tasks.get(task_id)

    if not task:
        raise HTTPException(status_code=404, detail=f"任务不存在: {task_id}")

    # 构建响应
    response = TaskStatusResponse(
        task_id=task["id"],
        status=task["status"],
        progress=task["progress"],
        message=task["message"],
        created_at=task["created_at"],
        updated_at=task["updated_at"],
    )

    # 添加结果（如果已完成）
    if task["result"]:
        response.result = TaskResult(**task["result"])

    # 添加错误信息（如果失败）
    if task["error"]:
        response.error = task["error"]

    return response


@router.get("/tasks", response_model=List[TaskStatusResponse])
async def list_tasks(
    status: Optional[TaskStatus] = Query(None, description="按状态筛选"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    列出最近的生成任务

    用于查看最近的生成任务列表。

    Args:
        status: 按状态筛选
        limit: 返回数量
        offset: 偏移量

    Returns:
        List[TaskStatusResponse]: 任务列表
    """
    # 获取所有任务并按时间排序
    tasks = list(_tasks.values())
    tasks.sort(key=lambda x: x["created_at"], reverse=True)

    # 状态筛选
    if status:
        tasks = [t for t in tasks if t["status"] == status]

    # 分页
    tasks = tasks[offset:offset + limit]

    # 构建响应
    results = []
    for task in tasks:
        response = TaskStatusResponse(
            task_id=task["id"],
            status=task["status"],
            progress=task["progress"],
            message=task["message"],
            created_at=task["created_at"],
            updated_at=task["updated_at"],
        )
        if task["result"]:
            response.result = TaskResult(**task["result"])
        if task["error"]:
            response.error = task["error"]
        results.append(response)

    return results
