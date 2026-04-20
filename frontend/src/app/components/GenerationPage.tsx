/**
 * GenerationPage - AI 生成页面共用组件
 *
 * 封装 Header + 专属表单 + ChatInput + UGCGrid + GenerationResult，
 * 根据 aiFunction 动态渲染对应模块的专属表单。
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import Header from "./Header";
import ChatInput from "./ChatInput";
import UGCGrid from "./UGCGrid";
import GenerationResult from "./GenerationResult";
import AnimationForm from "./forms/AnimationForm";
import QuestionForm from "./forms/QuestionForm";
import ExamForm from "./forms/ExamForm";
import LessonForm from "./forms/LessonForm";
import { useGenerate } from "@/hooks/useGenerate";
import type { AIFunction, GenerateRequest } from "@/lib/types";

interface TagItem {
  label: string;
  key: string;
  value: unknown;
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
  const { result, error, isLoading, generate, reset } = useGenerate();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 专属表单参数状态（由各 Form 组件 onChange 更新）
  const [formParams, setFormParams] = useState<Record<string, unknown>>({});

  // 根据 formParams 构建显示在 ChatInput 前方的标签
  const tags = useMemo<TagItem[]>(() => {
    const result: TagItem[] = [];

    if (aiFunction === "animation" || aiFunction === "exam" || aiFunction === "lesson") {
      const gradeLevel = formParams.grade_level as string;
      const grade = formParams.grade as string;
      if (gradeLevel) result.push({ label: gradeLevel, key: "grade_level", value: "" });
      if (grade) result.push({ label: grade, key: "grade", value: "" });
    }

    if (aiFunction === "question") {
      const typeCounts = formParams.type_counts as Record<string, number> | undefined;
      const questionTypes = formParams.question_types as string[] | undefined;
      if (typeCounts && questionTypes) {
        const labelMap: Record<string, string> = {
          选择: "选择题",
          填空: "填空题",
          判断: "判断题",
          解答: "解答题",
          简答: "简答题",
          作文: "作文题",
        };
        questionTypes.forEach((type) => {
          const count = typeCounts[type] ?? 0;
          result.push({
            label: `${labelMap[type] || type}${count}道`,
            key: `type_${type}`,
            value: type,
          });
        });
      }
    }

    return result;
  }, [formParams, aiFunction]);

  // 移除标签时恢复对应表单状态
  const handleRemoveTag = useCallback((tag: TagItem) => {
    setFormParams((prev) => {
      if (tag.key === "grade_level") return { ...prev, grade_level: "", grade: "" };
      if (tag.key === "grade") return { ...prev, grade: "" };
      if (tag.key.startsWith("type_")) {
        const type = tag.value as string;
        const typeCounts = (prev.type_counts as Record<string, number>) || {};
        const questionTypes = (prev.question_types as string[]) || [];
        const next = { ...prev };
        next.question_types = questionTypes.filter((t) => t !== type);
        const newCounts = { ...typeCounts };
        delete newCounts[type];
        next.type_counts = newCounts;
        return next;
      }
      return prev;
    });
  }, []);

  // ChatInput 提交回调：组装参数并调用生成接口
  const handleSubmit = useCallback(
    (topic: string, requirements: string) => {
      const tagPrefix = tags.map((t) => t.label).join(" ");
      const fullTopic = tagPrefix ? `${tagPrefix}：${topic}` : topic;

      const request: GenerateRequest = {
        ai_function: aiFunction,
        subject: "语文",
        grade: (formParams.grade as string) || "七年级",
        topic: fullTopic,
        requirements: requirements || undefined,
        tags: tags.map((t) => t.label),
        ...formParams,
      };

      setHasSubmitted(true);
      generate(request);
    },
    [aiFunction, generate, formParams, tags],
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
          tags={tags}
          onRemoveTag={handleRemoveTag}
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

      {/* UGC（未提交时） */}
      {!hasSubmitted && <UGCGrid />}
    </>
  );
}
