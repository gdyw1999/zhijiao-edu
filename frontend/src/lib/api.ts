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
 * SSE 事件类型（与后端 StreamEventType 对应）
 */
export type StreamEventType = "round_start" | "delta" | "round_end" | "done" | "error";

/**
 * SSE 流式事件数据结构
 */
export interface StreamEvent {
  type: StreamEventType;
  round_num?: number;
  content?: string;
  total_rounds?: number;
  html?: string;
  error_code?: string;
}

/**
 * SSE 事件处理器
 */
export interface StreamHandlers {
  onDelta?: (content: string, roundNum: number) => void;
  onRoundStart?: (roundNum: number, totalRounds: number) => void;
  onRoundEnd?: (roundNum: number) => void;
  onDone?: (html: string) => void;
  onError?: (message: string, code?: string) => void;
}

/**
 * 流式调用 skill-exec 生成 HTML 互动游戏
 *
 * 使用 SSE（Server-Sent Events）实时接收每轮进度，
 * 通过 ReadableStream 解析事件并回调给上层。
 *
 * @param params - 生成请求参数
 * @param handlers - 事件处理器
 */
export async function submitGenerateStream(
  params: GenerateRequest,
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `请求失败 (${response.status})`;
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("响应体为空，无法读取流");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按双换行符分割，提取完整的 SSE 事件
    const events = buffer.split("\n\n");
    // 最后一个事件可能不完整，保留在 buffer 中
    buffer = events.pop() || "";

    for (const eventStr of events) {
      const line = eventStr.trim();
      if (!line.startsWith("data: ")) continue;

      const data = line.slice(6); // 去掉 "data: " 前缀
      const event: StreamEvent = JSON.parse(data);

      switch (event.type) {
        case "round_start":
          handlers.onRoundStart?.(event.round_num ?? 0, event.total_rounds ?? 0);
          break;
        case "delta":
          handlers.onDelta?.(event.content ?? "", event.round_num ?? 0);
          break;
        case "round_end":
          handlers.onRoundEnd?.(event.round_num ?? 0);
          break;
        case "done":
          handlers.onDone?.(event.html ?? "");
          break;
        case "error":
          handlers.onError?.(event.content ?? "未知错误", event.error_code);
          break;
      }
    }
  }
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
