/**
 * 智教未来 - 前端类型定义
 * 与后端 chat.py 的 Pydantic 模型保持一致
 */

// ============================================
// AI 功能类型
// ============================================

/** AI 功能类型枚举 */
export type AIFunction = "lesson" | "question" | "exam" | "animation";

/** AI 功能中文名称映射 */
export const AI_FUNCTION_NAMES: Record<AIFunction, string> = {
  lesson: "AI教案·大单元",
  question: "AI命题",
  exam: "AI组题",
  animation: "AI互动课件",
};

/** 内容类型：Markdown 文本或 HTML 文件 */
export type ContentType = "markdown" | "html";

// ============================================
// 生成请求/响应
// ============================================

/** 生成任务请求参数 */
export interface GenerateRequest {
  ai_function: AIFunction;
  subject: string;
  grade: string;
  topic: string;
  requirements?: string;
  tags?: string[];

  // 模块专属参数（可选）
  animation_type?: string;
  duration?: number;
  difficulty?: string;
  question_types?: string[];
  question_count?: number;
  exam_type?: string;
  total_score?: number;
  exam_duration?: number;
  lesson_type?: string;
  class_size?: number;
}

/** 生成任务结果（后端直接返回） */
export interface TaskResult {
  task_id: string;
  ai_function: AIFunction;
  title: string;
  content: string;
  content_type: ContentType;
  summary: string;
  tags: string[];
  html_url?: string;
  structured_data?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// UGC 卡片（与后端 generations.py 一致）
// ============================================

/** UGC 内容卡片 */
export interface GenerationCard {
  id: string;
  title: string;
  content: string;
  category: string;
  ai_function: string;
  author: {
    name: string;
    avatar?: string;
  };
  likes: number;
  views: number;
  created_at: string;
  tags: string[];
}

/** 卡片列表分页响应 */
export interface GenerationsResponse {
  items: GenerationCard[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================
// 分类
// ============================================

/** 学科分类 */
export interface Category {
  id: string;
  name: string;
  hot?: boolean;
}
