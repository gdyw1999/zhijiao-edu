/**
 * GenerationResult - AI 生成结果展示组件
 *
 * 三栏布局（中栏 + 右栏 iframe）：
 * - 中栏：标题 + 标签 + 摘要 + 结构化结果组件/Markdown + 追问输入框 + 操作栏
 * - 右栏（条件渲染）：HTML 文件实时预览区
 * - 操作栏预留"提交到作业批改中台"按钮
 */

"use client";

import React, { useState } from "react";
import {
  Download,
  Heart,
  Share2,
  Maximize2,
  Minimize2,
  X,
  Send,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { TaskResult, AIFunction } from "@/lib/types";

// 结构化结果组件
import AnimationResult from "./results/AnimationResult";
import QuestionResult from "./results/QuestionResult";
import ExamResult from "./results/ExamResult";
import LessonResult from "./results/LessonResult";

/** 各模块对应的结构化结果组件映射 */
const RESULT_COMPONENT_MAP: Record<AIFunction, React.ComponentType<{ result: TaskResult }>> = {
  animation: AnimationResult,
  question: QuestionResult,
  exam: ExamResult,
  lesson: LessonResult,
};

interface GenerationResultProps {
  /** 生成结果数据 */
  result: TaskResult;
  /** 关闭结果面板 */
  onClose?: () => void;
  /** 追问回调（可选，阶段一仅展示输入框） */
  onFollowUp?: (question: string) => void;
}

export default function GenerationResult({
  result,
  onClose,
  onFollowUp,
}: GenerationResultProps) {
  const [followUpText, setFollowUpText] = useState("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  // 提交追问
  const handleFollowUp = async () => {
    if (!followUpText.trim()) return;
    setIsFollowUpLoading(true);
    try {
      onFollowUp?.(followUpText.trim());
      setFollowUpText("");
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const isHtml = result.content_type === "html";
  const handleDownload = () => {
    const extension = isHtml ? "html" : "md";
    const safeTitle = result.title.replace(/[\\/:*?"<>|]/g, "-").trim() || "generation-result";
    const blob = new Blob([result.content], {
      type: isHtml ? "text/html;charset=utf-8" : "text/markdown;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${safeTitle}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-6">
      {/* 中栏：标题 + 标签 + 摘要 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* 头部：标题 + 关闭按钮 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {result.title}
            </h2>
            {/* 标签 */}
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-[#0D5C3F]/10 text-[#0D5C3F] text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="关闭结果"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* 摘要 */}
        <p className="text-sm text-gray-500 mb-4">{result.summary}</p>

        {/* 内容区：结构化结果组件（按模块分发） */}
        <div className="border-t border-gray-100 pt-4">
          {(() => {
            const StructuredComponent = RESULT_COMPONENT_MAP[result.ai_function as AIFunction];
            if (StructuredComponent) {
              return <StructuredComponent result={result} />;
            }
            // 兜底：直接展示 Markdown
            return (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
                {result.content}
              </pre>
            );
          })()}
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {/* 下载按钮 */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-[#0D5C3F] hover:bg-[#0D5C3F]/5 rounded-lg transition-colors"
            title="下载结果"
          >
            <Download className="w-4 h-4" />
            <span>下载</span>
          </button>

          {/* 收藏按钮（占位） */}
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <Heart className="w-4 h-4" />
            <span>收藏</span>
          </button>

          {/* 分享按钮（占位） */}
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>

          {/* 分隔符 */}
          <div className="flex-1" />

          {/* 提交到作业批改中台（占位，disabled） */}
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
            title="即将上线"
          >
            <FileText className="w-4 h-4" />
            <span>提交批改</span>
          </button>
        </div>

        {/* 追问输入框 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
              placeholder="基于当前结果追问，例如：请增加一道填空题..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D5C3F]/20 focus:border-[#0D5C3F] transition-all"
              disabled={isFollowUpLoading}
            />
            <button
              type="button"
              onClick={handleFollowUp}
              disabled={!followUpText.trim() || isFollowUpLoading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                followUpText.trim() && !isFollowUpLoading
                  ? "bg-[#0D5C3F] text-white hover:bg-[#0a4a32]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isFollowUpLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>追问</span>
            </button>
          </div>
        </div>
      </div>

      {/* 右栏：HTML 文件实时预览（仅 content_type=html 时显示） */}
      {isHtml && (
        <div
          className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
            isPreviewFullscreen ? "fixed inset-4 z-50" : ""
          }`}
        >
          {/* 预览控制栏 */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="font-medium">HTML 预览</span>
              {result.html_url && (
                <a
                  href={result.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0D5C3F] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  新窗口打开
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
              type="button"
                onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title={isPreviewFullscreen ? "退出全屏" : "全屏预览"}
              >
                {isPreviewFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-500" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* 预览 iframe */}
          <iframe
            srcDoc={result.content}
            className="w-full bg-white"
            style={{ height: isPreviewFullscreen ? "calc(100% - 40px)" : "500px" }}
            title="HTML 实时预览"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
