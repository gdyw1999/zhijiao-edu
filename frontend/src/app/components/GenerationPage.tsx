/**
 * GenerationPage - AI 生成页面共用组件
 *
 * 封装 Header + 专属表单 + ChatInput + CategoryTabs + UGCGrid + GenerationResult，
 * 根据 aiFunction 动态渲染对应模块的专属表单。
 */

"use client";

import React, { useState, useCallback } from "react";
import Header from "./Header";
import ChatInput from "./ChatInput";
import CategoryTabs from "./CategoryTabs";
import UGCGrid from "./UGCGrid";
import GenerationResult from "./GenerationResult";
import AnimationForm from "./forms/AnimationForm";
import QuestionForm from "./forms/QuestionForm";
import ExamForm from "./forms/ExamForm";
import LessonForm from "./forms/LessonForm";
import { useGenerate } from "@/hooks/useGenerate";
import type { AIFunction, GenerateRequest } from "@/lib/types";

interface GenerationPageProps {
  aiFunction: AIFunction;
}

/** 各模块专属表单组件映射 */
const FORM_MAP: Record<AIFunction, React.ComponentType<{
  onChange: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}>> = {
  animation: AnimationForm,
  question: QuestionForm,
  exam: ExamForm,
  lesson: LessonForm,
};

export default function GenerationPage({ aiFunction }: GenerationPageProps) {
  const [activeCategory, setActiveCategory] = useState("recommend");
  const { result, error, isLoading, generate, reset } = useGenerate();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 专属表单参数状态（由各 Form 组件 onChange 更新）
  const [formParams, setFormParams] = useState<Record<string, unknown>>({});

  // ChatInput 提交回调：组装参数并调用生成接口
  const handleSubmit = useCallback(
    (topic: string, requirements: string, tags: string[]) => {
      const request: GenerateRequest = {
        ai_function: aiFunction,
        subject: "语文",
        grade: "七年级",
        topic,
        requirements: requirements || undefined,
        tags,
        // 合并专属表单参数
        ...formParams,
      };

      setHasSubmitted(true);
      generate(request);
    },
    [aiFunction, generate, formParams],
  );

  // 关闭结果面板
  const handleClose = useCallback(() => {
    reset();
    setHasSubmitted(false);
  }, [reset]);

  // 获取当前模块的专属表单组件
  const FormComponent = FORM_MAP[aiFunction];

  return (
    <>
      <Header aiFunction={aiFunction} />

      {/* 专属表单（ChatInput 上方） */}
      {!result && FormComponent && (
        <FormComponent
          onChange={(values) => setFormParams((prev) => ({ ...prev, ...values }))}
          disabled={isLoading}
        />
      )}

      {/* 输入框 */}
      {!result && (
        <ChatInput
          aiFunction={aiFunction}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#0D5C3F]/30 border-t-[#0D5C3F] rounded-full animate-spin" />
            <span className="text-gray-600 font-medium">
              AI 正在生成内容，请稍候...
            </span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleClose}
              className="text-sm text-red-500 hover:text-red-700 underline cursor-pointer"
            >
              重新输入
            </button>
          </div>
        </div>
      )}

      {/* 生成结果 */}
      {result && (
        <GenerationResult
          result={result}
          onClose={handleClose}
        />
      )}

      {/* 分类 + UGC（未提交时） */}
      {!hasSubmitted && (
        <>
          <CategoryTabs
            onCategoryChange={(category) => setActiveCategory(category)}
          />
          <UGCGrid category={activeCategory} />
        </>
      )}
    </>
  );
}
