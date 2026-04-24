/**
 * ChatMessages - 对话消息列表组件
 *
 * 简洁文字流：每条消息直接以「角色：内容」文字行显示，
 * 类似终端对话，无气泡、无卡片。流式内容实时追加。
 * AI 思考过程（thinkContent）流式展开在消息行内，生成完毕后自动折叠。
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** AI 思考过程内容（流式追加，生成完毕后自动折叠） */
  thinkContent?: string;
  isStreaming?: boolean;
  roundNum?: number;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

/** 思考过程块：流式展开在消息行内，折叠时只显示一行标题 */
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  // 思考内容超过 2 行就默认折叠
  const lines = content.split("\n");
  const isLong = lines.length > 2;

  // 生成完毕（isStreaming: true→false）且内容较长时，自动折叠
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming && isLong) {
      setExpanded(false);
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, isLong]);

  // 生成中始终展开；完成后：长内容默认折叠，短内容默认展开
  const shouldShow = isStreaming || expanded || !isLong;

  return (
    <div className="my-1 border border-purple-100 rounded-lg overflow-hidden bg-purple-50/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs cursor-pointer hover:bg-purple-100/50 transition-colors"
      >
        <span className="text-purple-400 text-xs">{expanded ? "▼" : "▶"}</span>
        <span className="text-purple-600 font-medium">🤔 思考过程</span>
        {isStreaming && <span className="text-purple-300 animate-pulse">生成中...</span>}
        {!expanded && isLong && <span className="text-gray-400 ml-1">({lines.length} 行)</span>}
      </button>
      {shouldShow && (
        <div className="px-3 pb-2 text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-col gap-1 py-2 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 320px)" }}
    >
      {messages.map((msg, idx) => {
        return (
          <div key={idx} className="text-sm leading-relaxed">
            {/* 角色标签 */}
            <span
              className={
                msg.role === "user" ? "text-green-600 font-medium" : "text-[#0D5C3F] font-medium"
              }
            >
              {msg.role === "user" ? "我" : "AI"}
              {msg.roundNum ? ` · 第${msg.roundNum}轮` : ""}
              {msg.isStreaming ? " · 生成中..." : ""}
              ：
            </span>

            {/* AI 思考过程：流式展开在消息行内 */}
            {msg.role === "assistant" && msg.thinkContent !== undefined && (
              <ThinkingBlock content={msg.thinkContent} isStreaming={msg.isStreaming} />
            )}

            {/* 主内容（过滤掉 think/tool 标记） */}
            <span className="text-gray-700 whitespace-pre-wrap">
              {msg.content.replace(/\[\[THINK:[\s\S]*?\]\]/g, "").replace(/\[\[TOOL:[\s\S]*?\]\]/g, "")}
              {msg.isStreaming && !msg.thinkContent && (
                <span className="inline-block w-1.5 h-4 bg-[#0D5C3F] animate-pulse ml-0.5 align-middle" />
              )}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
