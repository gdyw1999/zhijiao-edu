/**
 * useGenerate - AI 内容生成 Hook
 *
 * 支持两种模式：
 * 1. 同步模式：generate 直接返回结果
 * 2. SSE 流式模式：generateStream 通过回调实时接收每轮进度，
 *    回调由调用方（GenerationPage）管理状态累积
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
  /** 发起同步生成请求 */
  generate: (request: GenerateRequest) => Promise<void>;
  /** 发起 SSE 流式生成请求（回调由调用方管理状态累积） */
  generateStream: (
    request: GenerateRequest,
    handlers: {
      onRoundStart?: (round: number, total: number) => void;
      /** 文本内容 delta，调用方负责累积 */
      onDelta?: (delta: string, round: number) => void;
      onRoundEnd?: (round: number) => void;
      /** HTML 片段进度，用于实时预览 */
      onHtmlProgress?: (html: string, round: number) => void;
      onDone?: (html: string) => void;
      onError?: (message: string, code?: string) => void;
    }
  ) => Promise<void>;
  /** 重置状态（清除结果和错误） */
  reset: () => void;
}

export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 同步模式
  const generate = useCallback(async (request: GenerateRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

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
  const generateStream = useCallback(
    async (
      request: GenerateRequest,
      handlers: {
        onRoundStart?: (round: number, total: number) => void;
        onDelta?: (delta: string, round: number) => void;
        onRoundEnd?: (round: number) => void;
        onHtmlProgress?: (html: string, round: number) => void;
        onDone?: (html: string) => void;
        onError?: (message: string, code?: string) => void;
      }
    ) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        await submitGenerateStream(request, {
          onRoundStart: (round, total) => {
            handlers.onRoundStart?.(round, total);
          },
          onDelta: (delta, round) => {
            // 直接传递 delta，不做内部累积（由调用方负责）
            handlers.onDelta?.(delta, round);
          },
          onRoundEnd: (round) => {
            handlers.onRoundEnd?.(round);
          },
          onHtmlProgress: (html, round) => {
            handlers.onHtmlProgress?.(html, round);
          },
          onDone: (html) => {
            handlers.onDone?.(html);
          },
          onError: (message, code) => {
            handlers.onError?.(message, code);
          },
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "生成失败，请稍后重试";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    error,
    isLoading,
    generate,
    generateStream,
    reset,
  };
}
