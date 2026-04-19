/**
 * LessonResult - AI教案结构化结果展示
 *
 * 教学目标 + 课时展示 + 板书设计区域。
 * 阶段二完成后替换为 Tab 切换的多课时展示。
 */

"use client";

import React from "react";
import { BookOpen, Target, Clock, Lightbulb } from "lucide-react";
import type { TaskResult } from "@/lib/types";

interface LessonResultProps {
  result: TaskResult;
}

export default function LessonResult({ result }: LessonResultProps) {
  return (
    <div className="space-y-4">
      {/* 教案概览卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#0D5C3F]/5 to-[#0D5C3F]/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0D5C3F]/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#0D5C3F]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">教案类型</p>
            <p className="text-sm font-medium text-gray-800">大单元教学设计</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">核心素养</p>
            <p className="text-sm font-medium text-gray-800">多维度培养</p>
          </div>
        </div>
      </div>

      {/* 完整教案内容 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans overflow-auto max-h-[600px]">
          {result.content}
        </pre>
      </div>
    </div>
  );
}
