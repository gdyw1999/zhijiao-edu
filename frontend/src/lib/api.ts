/**
 * 智教未来 - 前端 API 服务层
 * 封装所有与后端的 HTTP 请求
 */

import type {
  GenerateRequest,
  TaskResult,
  GenerationsResponse,
} from "./types";

// API 基础地址（从环境变量读取）
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

/**
 * 通用请求封装
 * 统一处理错误和 JSON 解析
 */
async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // 尝试解析错误信息
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail ||
      errorData?.message ||
      `请求失败 (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

// ============================================
// 生成相关 API
// ============================================

/**
 * 同步调用 LinkAI 生成内容
 * 直接返回生成结果，无轮询
 */
export async function submitGenerate(
  params: GenerateRequest,
): Promise<TaskResult> {
  return request<TaskResult>("/chat/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * 获取最近的生成任务列表
 * 阶段一返回空列表，阶段三改为查数据库
 */
export async function getTaskList(params?: {
  limit?: number;
  offset?: number;
}): Promise<TaskResult[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const query = searchParams.toString();
  return request<TaskResult[]>(`/chat/tasks${query ? `?${query}` : ""}`);
}

// ============================================
// UGC 内容 API
// ============================================

/**
 * 获取热门 UGC 生成内容卡片
 */
export async function getHotGenerations(params?: {
  category?: string;
  ai_function?: string;
  page?: number;
  page_size?: number;
}): Promise<GenerationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.ai_function) searchParams.set("ai_function", params.ai_function);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  const query = searchParams.toString();
  return request<GenerationsResponse>(`/generations/hot${query ? `?${query}` : ""}`);
}

/**
 * 获取最新 UGC 生成内容卡片
 */
export async function getLatestGenerations(params?: {
  page?: number;
  page_size?: number;
}): Promise<GenerationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.page_size) searchParams.set("page_size", String(params.page_size));
  const query = searchParams.toString();
  return request<GenerationsResponse>(`/generations/latest${query ? `?${query}` : ""}`);
}
