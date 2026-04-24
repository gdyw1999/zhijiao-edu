/**
 * GenerationPage - AI 生成页面共用组件
 *
 * 封装 Header + 专属表单 + ChatInput + UGCGrid + GenerationResult，
 * 根据 aiFunction 动态渲染对应模块的专属表单。
 * animation + 互动游戏：双栏流式对话 UI（文字流 + HTML 实时预览）。
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import Header from "./Header";
import ChatInput from "./ChatInput";
import ChatMessages, { type ChatMessage } from "./ChatMessages";
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

interface GenerationPageProps {
  aiFunction: AIFunction;
}

export default function GenerationPage({ aiFunction }: GenerationPageProps) {
  const { result, error, isLoading, generate, generateStream, reset } = useGenerate();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // 对话消息列表（流式 UI）
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 当前流式 HTML 预览
  const [currentHtml, setCurrentHtml] = useState<string>("");
  // HTML 预览折叠状态（生成完成后默认折叠）
  const [htmlPreviewCollapsed, setHtmlPreviewCollapsed] = useState(false);
  // 当前轮次
  const [roundNum, setRoundNum] = useState(0);

  // 专属表单参数状态（由各 Form 组件 onChange 更新）
  const [formParams, setFormParams] = useState<Record<string, unknown>>({});

  // 根据 formParams 构建显示在 ChatInput 前方的标签
  const tags = useMemo<TagItem[]>(() => {
    const result: TagItem[] = [];

    if (aiFunction === "animation") {
      const animationType = formParams.animation_type as string;
      if (animationType) result.push({ label: animationType, key: "animation_type", value: "" });
    }

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
          选择: "选择题", 填空: "填空题", 判断: "判断题",
          解答: "解答题", 简答: "简答题", 作文: "作文题",
        };
        questionTypes.forEach((type) => {
          const count = typeCounts[type] ?? 0;
          result.push({ label: `${labelMap[type] || type}${count}道`, key: `type_${type}`, value: type });
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
      if (tag.key === "animation_type") return { ...prev, animation_type: "" };
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

  // 判断是否显示对话 UI
  const hasMessages = messages.length > 0;

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

      // animation + 互动游戏走 SSE 流式对话 UI，其他走同步结果
      if (aiFunction === "animation" && formParams.animation_type === "互动游戏") {
        const userMsg: ChatMessage = {
          role: "user",
          content: fullTopic + (requirements ? `\n补充要求：${requirements}` : ""),
        };
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: "",
          thinkContent: "",
          isStreaming: true,
          roundNum: 1,
        };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);

        generateStream(request, {
          onRoundStart: (round) => {
            setRoundNum(round);
            setHtmlPreviewCollapsed(false);
            setMessages((prev) => {
              const idx = prev.length - 1;
              if (idx >= 0 && prev[idx].role === "assistant") {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], roundNum: round, isStreaming: true };
                return updated;
              }
              return prev;
            });
          },
          onDelta: (contentDelta) => {
            setMessages((prev) => {
              const idx = prev.length - 1;
              if (idx >= 0 && prev[idx].role === "assistant") {
                const msg = prev[idx];
                let currentThink = msg.thinkContent || "";
                // 去掉<think>\n...\n<\/plan> 和 [[THINK:...]]，提取思考内容
                let remaining = contentDelta
                  .replace(/<plan>([\s\S]*?)<\/plan>/g, (m, inner) => {
                    currentThink += inner.trim() + "\n";
                    return "";
                  })
                  .replace(/\[\[THINK:([\s\S]*?)\]\]/g, (m, inner) => {
                    currentThink += inner.trim() + "\n";
                    return "";
                  });
                // 过滤 HTML 代码块，不显示在聊天文字中
                remaining = remaining.replace(/```[\s\S]*?```/g, "");
                const updated = [...prev];
                updated[idx] = {
                  ...msg,
                  content: msg.content + remaining,
                  thinkContent: currentThink,
                };
                return updated;
              }
              return prev;
            });
          },
          onRoundEnd: (round) => {
            setRoundNum(round);
          },
          onHtmlProgress: (htmlFragment) => {
            setCurrentHtml(htmlFragment);
          },
          onDone: (finalHtml) => {
            setMessages((prev) => {
              const idx = prev.length - 1;
              if (idx >= 0 && prev[idx].role === "assistant") {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], isStreaming: false };
                return updated;
              }
              return prev;
            });
            setCurrentHtml(finalHtml);
            setHtmlPreviewCollapsed(true);
            setRoundNum(0);
          },
          onError: (message) => {
            setMessages((prev) => {
              const idx = prev.length - 1;
              if (idx >= 0 && prev[idx].role === "assistant") {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], content: `错误：${message}`, isStreaming: false };
                return updated;
              }
              return prev;
            });
          },
        });
      } else {
        generate(request);
      }
    },
    [aiFunction, generate, generateStream, formParams, tags],
  );

  // 关闭结果面板
  const handleCloseResult = useCallback(() => {
    reset();
    setHasSubmitted(false);
    setMessages([]);
    setCurrentHtml("");
    setRoundNum(0);
  }, [reset]);

  const FormComponent = FORM_MAP[aiFunction];

  return (
    <>
      <Header aiFunction={aiFunction} />

      {/* 专属表单（对话 UI 隐藏，只在首次未提交时显示） */}
      {!hasMessages && !result && FormComponent && (
        <FormComponent
          onChange={(values) => setFormParams((prev) => ({ ...prev, ...values }))}
          disabled={isLoading}
        />
      )}

      {/* 双栏布局：左栏对话 + 右栏预览（对话 UI 时） */}
      {hasMessages ? (
        <div className="grid grid-cols-2 gap-6 mb-6" style={{ minHeight: "calc(100vh - 280px)" }}>
          {/* 左栏：对话消息列表 */}
          <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4">
              <ChatMessages messages={messages} />
            </div>
            {/* 固定输入栏 */}
            <div className="p-4 border-t border-gray-100">
              <ChatInput
                aiFunction={aiFunction}
                tags={tags}
                onRemoveTag={handleRemoveTag}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* 右栏：HTML 实时预览 */}
          <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              <span className="font-medium">HTML 实时预览</span>
              {roundNum > 0 && <span className="text-xs text-gray-400">第 {roundNum} 轮</span>}
            </div>
            {currentHtml ? (
              htmlPreviewCollapsed ? (
                <div className="flex-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setHtmlPreviewCollapsed(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline"
                  >
                    点击展开 HTML 预览
                  </button>
                </div>
              ) : (
                <iframe
                  srcDoc={currentHtml}
                  className="flex-1 w-full bg-white"
                  title="HTML 实时预览"
                  sandbox="allow-scripts allow-same-origin"
                />
              )
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                等待生成内容...
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 非对话 UI */}
          {!result && !hasMessages && (
            <ChatInput
              aiFunction={aiFunction}
              tags={tags}
              onRemoveTag={handleRemoveTag}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {isLoading && !hasMessages && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[#0D5C3F]/30 border-t-[#0D5C3F] rounded-full animate-spin" />
                  <span className="text-gray-600 font-medium">
                    {roundNum > 0 ? `第 ${roundNum} 轮生成中...` : "AI 正在生成内容，请稍候..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && !hasMessages && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!hasMessages && result && (
        <GenerationResult result={result} onClose={handleCloseResult} />
      )}
    </>
  );
}
