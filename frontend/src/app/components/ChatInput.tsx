/**
 * ChatInput - AI 生成输入组件
 *
 * 接收 aiFunction 和 onSubmit 回调，
 * 将用户输入组装为 GenerateRequest 提交给父组件。
 */

"use client";

import React, { useState } from "react";
import {
  Paperclip,
  Image as ImageIcon,
  Mic,
  Send,
  X,
} from "lucide-react";
import type { AIFunction } from "@/lib/types";

interface TagItem {
  label: string;
  key: string;
  value: unknown;
}

interface ChatInputProps {
  /** 当前 AI 功能类型 */
  aiFunction: AIFunction;
  /** 提交回调，由父组件（GenerationPage）调用 useGenerate */
  onSubmit: (topic: string, requirements: string) => void;
  /** 是否正在加载中 */
  isLoading?: boolean;
  /** 前置标签列表 */
  tags?: TagItem[];
  /** 移除标签回调 */
  onRemoveTag?: (tag: TagItem) => void;
}

export default function ChatInput({
  aiFunction,
  onSubmit,
  isLoading = false,
  tags = [],
  onRemoveTag,
}: ChatInputProps) {
  const [topic, setTopic] = useState("");
  const [requirements, setRequirements] = useState("");

  const handleSubmit = () => {
    if (!topic.trim() || isLoading) return;
    onSubmit(topic.trim(), requirements.trim());
  };

  // 根据不同模块显示不同 placeholder
  const placeholders: Record<AIFunction, string> = {
    animation:
      "例如：结合初中语文文言文常见18个虚词，生成虚词互动知识问答...",
    question:
      "例如：三年级数学分数的初步认识，生成10道选择题和5道填空题...",
    exam:
      "例如：高一物理牛顿运动定律，期中考试卷，满分100分...",
    lesson:
      "例如：七年级语文《背影》，新课讲授，2课时...",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      {/* 前置标签行 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D5C3F]/10 text-[#0D5C3F] rounded-full text-sm font-medium"
            >
              {tag.label}
              <button
                type="button"
                onClick={() => onRemoveTag?.(tag)}
                disabled={isLoading || undefined}
                className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#0D5C3F]/20 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 主题输入框 */}
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={placeholders[aiFunction]}
        className="w-full min-h-[60px] max-h-[200px] p-3 text-gray-700 placeholder-gray-400 border-0 resize-none focus:outline-none focus:ring-0"
        rows={2}
        disabled={isLoading}
      />

      {/* 补充要求输入框（折叠显示） */}
      <input
        type="text"
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="补充要求（可选）：如难度、课时数等"
        className="w-full px-3 py-2 text-sm text-gray-600 placeholder-gray-400 border-0 focus:outline-none focus:ring-0"
        disabled={isLoading}
      />

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled
            className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled
            className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!topic.trim() || isLoading) return;
            handleSubmit();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium cursor-pointer transition-all ${
            topic.trim() && !isLoading
              ? "bg-[#0D5C3F] text-white hover:bg-[#0a4a32] shadow-md"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>发送</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
