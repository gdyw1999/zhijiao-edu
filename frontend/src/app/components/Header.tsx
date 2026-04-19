/**
 * Header - 页面标题组件
 *
 * 根据 aiFunction 动态显示不同标题和副标题。
 */

"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { AIFunction } from "@/lib/types";

interface HeaderProps {
  aiFunction: AIFunction;
}

/** 各模块的标题配置 */
const HEADER_CONFIG: Record<
  AIFunction,
  { title: string; subtitle: string }
> = {
  animation: {
    title: "智教未来",
    subtitle: "一句话生成专业级互动课件",
  },
  question: {
    title: "AI命题",
    subtitle: "智能生成高质量试题，精准对标考点",
  },
  exam: {
    title: "AI组题",
    subtitle: "快速组卷，支持多种题型和难度配置",
  },
  lesson: {
    title: "AI教案·大单元",
    subtitle: "大单元教学设计，一键生成完整教案",
  },
};

export default function Header({ aiFunction }: HeaderProps) {
  const config = HEADER_CONFIG[aiFunction];

  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#0D5C3F] to-[#1a7a5a] rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {config.title}
          <span className="text-[#0D5C3F]">，{config.subtitle}</span>
        </h1>
      </div>
    </header>
  );
}
