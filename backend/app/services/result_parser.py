"""
智教未来 - 结果结构化解析器

将 LinkAI 返回的 Markdown 文本解析为结构化 JSON。
按 ai_function 分发到不同的解析器。

阶段二完成后需根据 LinkAI 实际返回格式调试。
"""

from typing import Any, Dict, List, Optional

from app.core.logger import get_logger

logger = get_logger(__name__)


def parse_result(ai_function: str, content: str) -> Dict[str, Any]:
    """
    根据 AI 功能类型解析生成结果为结构化数据

    Args:
        ai_function: AI 功能类型 (lesson/question/exam/animation)
        content: LinkAI 返回的原始文本内容

    Returns:
        Dict: 结构化数据
    """
    parsers = {
        "lesson": parse_lesson,
        "question": parse_question,
        "exam": parse_exam,
        "animation": parse_animation,
    }

    parser = parsers.get(ai_function)
    if not parser:
        logger.warning(f"未知 AI 功能类型: {ai_function}，返回原始内容")
        return {"raw": content}

    try:
        return parser(content)
    except Exception as e:
        logger.error(f"解析 {ai_function} 结果失败: {e}")
        return {"raw": content, "parse_error": str(e)}


def _split_sections(content: str, pattern: str = "##") -> List[Dict[str, str]]:
    """
    按 Markdown 标题分割内容为段落

    Args:
        content: 原始 Markdown 文本
        pattern: 分隔符（默认 ## 二级标题）

    Returns:
        List[Dict]: [{"title": "...", "content": "..."}]
    """
    sections = []
    current_title = "概览"
    current_content = []

    for line in content.split("\n"):
        if line.startswith(f"{pattern} "):
            # 保存上一个段落
            if current_content:
                sections.append({
                    "title": current_title,
                    "content": "\n".join(current_content).strip(),
                })
            current_title = line[len(pattern) + 1:].strip()
            current_content = []
        else:
            current_content.append(line)

    # 保存最后一个段落
    if current_content:
        sections.append({
            "title": current_title,
            "content": "\n".join(current_content).strip(),
        })

    return sections


def parse_animation(content: str) -> Dict[str, Any]:
    """解析互动课件/教学动画结果"""
    sections = _split_sections(content)

    # 提取教学目标（从包含"教学目标"的段落中提取列表项）
    objectives = []
    for section in sections:
        if "教学目标" in section["title"]:
            objectives = [
                line.strip().lstrip("0123456789.-) ")
                for line in section["content"].split("\n")
                if line.strip() and (line.strip()[0].isdigit() or line.strip().startswith("-"))
            ]
            break

    return {
        "type": "animation",
        "sections": sections,
        "objectives": objectives,
    }


def parse_question(content: str) -> Dict[str, Any]:
    """解析 AI命题结果"""
    sections = _split_sections(content, "#")

    # 提取题目列表（从包含"###"的段落提取）
    questions = []
    for section in sections:
        if section["title"].strip():
            questions.append({
                "title": section["title"].strip(),
                "content": section["content"],
            })

    return {
        "type": "question",
        "sections": sections,
        "question_count": len(questions),
    }


def parse_exam(content: str) -> Dict[str, Any]:
    """解析 AI组卷结果"""
    sections = _split_sections(content)

    # 提取试卷元信息（考试时长、满分）
    metadata = {}
    for line in content.split("\n")[:10]:
        line = line.strip()
        if "考试时间" in line or "时长" in line:
            metadata["duration"] = line
        elif "满分" in line:
            metadata["total_score"] = line

    return {
        "type": "exam",
        "sections": sections,
        "metadata": metadata,
    }


def parse_lesson(content: str) -> Dict[str, Any]:
    """解析 AI教案结果"""
    sections = _split_sections(content)

    # 提取教学目标
    objectives = []
    for section in sections:
        if "教学目标" in section["title"]:
            objectives = [
                line.strip().lstrip("0123456789.-) ")
                for line in section["content"].split("\n")
                if line.strip() and (line.strip()[0].isdigit() or line.strip().startswith("-"))
            ]
            break

    # 提取重难点
    key_points = []
    for section in sections:
        if "重难点" in section["title"] or "重点" in section["title"]:
            key_points = [
                line.strip().lstrip("-* ")
                for line in section["content"].split("\n")
                if line.strip().startswith("-") or line.strip().startswith("*")
            ]
            break

    return {
        "type": "lesson",
        "sections": sections,
        "objectives": objectives,
        "key_points": key_points,
    }
