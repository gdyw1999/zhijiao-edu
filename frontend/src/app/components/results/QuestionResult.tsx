/**
 * QuestionResult - AI命题结构化结果展示
 *
 * 题目卡片列表 + 答案解析（可折叠）。
 * 阶段二完成后根据 LinkAI 实际返回格式调试。
 */

"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import type { TaskResult } from "@/lib/types";

interface QuestionResultProps {
  result: TaskResult;
}

export default function QuestionResult({ result }: QuestionResultProps) {
  // 简单按 "---" 分隔符拆分题目（阶段二替换为结构化解析）
  const questions = result.content.split(/\n---\n|\n#{1,3}\s/).filter(Boolean);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {questions.map((q, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          {/* 题目卡片（可折叠） */}
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 w-7 h-7 bg-[#0D5C3F]/10 rounded-lg flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-[#0D5C3F]">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 line-clamp-2 whitespace-pre-wrap">
                {q.trim().substring(0, 100)}
                {q.trim().length > 100 ? "..." : ""}
              </p>
            </div>
            {expandedIndex === index ? (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
          </button>

          {/* 展开详情 */}
          {expandedIndex === index && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans mt-3">
                {q.trim()}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
