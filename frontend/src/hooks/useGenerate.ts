/**
 * useGenerate - AI 内容生成 Hook
 *
 * 封装生成请求的状态管理，直接调用 LinkAI 同步接口。
 * 无轮询机制，提交后等待结果返回。
 */

import { useState, useCallback } from "react";
import { submitGenerate } from "@/lib/api";
import type { GenerateRequest, TaskResult } from "@/lib/types";

interface UseGenerateReturn {
  /** 调用结果 */
  result: TaskResult | null;
  /** 错误信息 */
  error: string | null;
  /** 是否正在生成中 */
  isLoading: boolean;
  /** 发起生成请求 */
  generate: (request: GenerateRequest) => Promise<void>;
  /** 重置状态（清除结果和错误） */
  reset: () => void;
}

export function useGenerate(): UseGenerateReturn {
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generate = useCallback(async (request: GenerateRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await submitGenerate(request);
      setResult(data);
    } catch (err) {
      // 提取错误消息
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
  }, []);

  return { result, error, isLoading, generate, reset };
}
