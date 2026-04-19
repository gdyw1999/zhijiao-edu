/**
 * ExamResult - AI组卷结构化结果展示
 *
 * 试卷信息栏 + 大题分组展示。
 * 阶段二完成后增加参考答案Tab和评分标准Tab。
 */

"use client";

import React, { useState } from "react";
import { FileText, Clock, Award } from "lucide-react";
import type { TaskResult } from "@/lib/types";

interface ExamResultProps {
  result: TaskResult;
}

export default function ExamResult({ result }: ExamResultProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  // 按大题标题分割（## 一、... ## 二、...）
  const sections = result.content.split(/\n(?=#{1,2}\s)/).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* 试卷信息栏 */}
      <div className="bg-gradient-to-r from-[#0D5C3F] to-[#1a7a5a] rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h3 className="font-bold">{result.title}</h3>
              <p className="text-sm text-white/70 mt-0.5">{result.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Clock className="w-4 h-4 mx-auto mb-0.5 text-white/70" />
              <span className="text-xs text-white/70">90分钟</span>
            </div>
            <div className="text-center">
              <Award className="w-4 h-4 mx-auto mb-0.5 text-white/70" />
              <span className="text-xs text-white/70">100分</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAnswer(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showAnswer
              ? "bg-[#0D5C3F] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          试卷内容
        </button>
        <button
          onClick={() => setShowAnswer(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showAnswer
              ? "bg-[#0D5C3F] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          参考答案
        </button>
      </div>

      {/* 试卷内容 / 参考答案 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans overflow-auto max-h-[600px]">
          {result.content}
        </pre>
      </div>
    </div>
  );
}
