/**
 * useGenerate - AI 内容生成 Hook
 *
 * 支持两种模式：
 * 1. 同步模式：submitGenerate 直接返回结果
 * 2. SSE 流式模式：submitGenerateStream 实时接收每轮进度
 */

import { useState, useCallback } from "react";
import { submitGenerate, submitGenerateStream } from "@/lib/api";
import type { GenerateRequest, TaskResult } from "@/lib/types";

interface UseGenerateReturn {
  /** 调用结果（同步模式完成时有效） */
  result: TaskResult | null;
  /** 错误信息 */
  error: string | null;
  /** 是否正在生成中 */
  isLoading: boolean;
  /** 实时内容片段（SSE 模式有效） */
  content: string;
  /** 当前轮次（SSE 模式有效） */
  roundNum: number;
  /** 总轮次（SSE 模式有效） */
  totalRounds: number;
  /** 发起同步生成请求 */
  generate: (request: GenerateRequest) => Promise<void>;
  /** 发起 SSE 流式生成请求 */
  generateStream: (request: GenerateRequest) => Promise<void>;
  /** 重置状态（清除结果和错误） */
  reset: () => void;
}

export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // SSE 模式专用状态
  const [content, setContent] = useState("");
  const [roundNum, setRoundNum] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);

  // 同步模式
  const generate = useCallback(async (request: GenerateRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setContent("");
    setRoundNum(0);
    setTotalRounds(0);

    try {
      const data = await submitGenerate(request);
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "生成失败，请稍后重试";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SSE 流式模式
  const generateStream = useCallback(async (request: GenerateRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setContent("");
    setRoundNum(0);
    setTotalRounds(0);

    try {
      await submitGenerateStream(request, {
        onRoundStart: (round, total) => {
          setRoundNum(round);
          setTotalRounds(total);
        },
        onDelta: (delta) => {
          setContent((prev) => prev + delta);
        },
        onRoundEnd: () => {
          // 可选：每轮结束做点什么
        },
        onDone: (html) => {
          // SSE 模式：done 事件中的 html 即为最终结果
          // 构建 TaskResult 格式给前端一致使用
          const mockResult: TaskResult = {
            task_id: "",
            ai_function: request.ai_function,
            title: `${request.subject}${request.grade}${request.topic}AI互动课件`,
            content: html,
            content_type: "html",
            summary: `为${request.grade}${request.subject}生成的AI互动课件内容，主题是${request.topic}。`,
            tags: [request.subject, request.grade],
            created_at: new Date(),
          };
          setResult(mockResult);
          setContent(html);
        },
        onError: (message, code) => {
          setError(message);
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "生成失败，请稍后重试";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setContent("");
    setRoundNum(0);
    setTotalRounds(0);
  }, []);

  return {
    result,
    error,
    isLoading,
    content,
    roundNum,
    totalRounds,
    generate,
    generateStream,
    reset,
  };
}
