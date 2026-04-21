/**
 * AnimationResult - 互动课件结构化结果展示
 *
 * 展示概览卡片 + 教学目标。
 * HTML 内容由 GenerationResult 右栏统一预览，此组件仅展示 Markdown 兜底。
 */

"use client";

import React from "react";
import { Play, Target } from "lucide-react";
import type { TaskResult } from "@/lib/types";

interface AnimationResultProps {
  result: TaskResult;
}

export default function AnimationResult({ result }: AnimationResultProps) {
  const isHtml = result.content_type === "html";

  return (
    <div className="space-y-4">
      {/* 概览信息卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#0D5C3F]/5 to-[#0D5C3F]/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0D5C3F]/10 rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-[#0D5C3F]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">内容类型</p>
            <p className="text-sm font-medium text-gray-800">
              {isHtml ? "互动文件" : "脚本方案"}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">教学目标</p>
            <p className="text-sm font-medium text-gray-800">按生成内容</p>
          </div>
        </div>
      </div>

      {/* HTML 内容不在此渲染，由 GenerationResult 右栏统一预览 */}
      {!isHtml && (
        /* Markdown 内容展示 */
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans overflow-auto max-h-[600px]">
            {result.content}
          </pre>
        </div>
      )}
    </div>
  );
}
