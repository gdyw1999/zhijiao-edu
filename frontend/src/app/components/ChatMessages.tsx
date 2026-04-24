/**
 * ChatMessages - 对话消息列表组件
 *
 * 简洁文字流：每条消息以「角色：内容」文字行显示，
 * 类似终端对话，无气泡、无卡片。流式内容以打字机效果逐字追加。
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

/**
 * TypewriterText - 打字机效果文本渲染
 *
 * 流式传输时逐步追加显示文本（每 20ms 按剩余差距的 15% 追加），
 * 非流式时直接显示全部内容。
 */
function TypewriterText({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const [len, setLen] = useState(0);
  // 保持最新 text 引用，供 interval 回调读取
  const latestText = useRef(text);
  latestText.current = text;

  useEffect(() => {
    if (!isStreaming) {
      // 非流式：立即显示全部
      setLen(text.length);
      return;
    }

    // 流式：每 20ms 追加一部分字符，形成打字机效果
    const id = setInterval(() => {
      setLen(prev => {
        const target = latestText.current.length;
        if (prev >= target) return prev;
        // 按剩余差距的 15% 追加，最少 1 字符
        const step = Math.max(1, Math.ceil((target - prev) * 0.15));
        return prev + step > target ? target : prev + step;
      });
    }, 20);

    return () => clearInterval(id);
    // isStreaming 变化时才重启定时器，text 变化通过 ref 读取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  if (!isStreaming) return <>{text}</>;
  return <>{text.slice(0, len)}</>;
}

/** 思考过程块：流式展开在消息行内，用户可随时手动折叠/展开 */
function ThinkingBlock({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  // 思考内容超过 2 行就视为"长内容"
  const lines = content.split("\n");
  const isLong = lines.length > 2;

  const wasStreaming = useRef(false);

  useEffect(() => {
    // 流式开始 → 自动展开
    if (isStreaming && !wasStreaming.current) {
      setExpanded(true);
    }
    // 流式结束 → 长内容自动折叠
    if (wasStreaming.current && !isStreaming && isLong) {
      setExpanded(false);
    }
    wasStreaming.current = !!isStreaming;
  }, [isStreaming, isLong]);

  // 用户可随时手动切换折叠/展开（不受 isStreaming 强制展开）
  const shouldShow = expanded || !isLong;

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
          <TypewriterText text={content} isStreaming={isStreaming} />
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
        // 过滤掉 think/tool 标记
        const cleanContent = msg.content
          .replace(/\[\[THINK:[\s\S]*?\]\]/g, "")
          .replace(/\[\[TOOL:[\s\S]*?\]\]/g, "");

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

            {/* 主内容：打字机效果逐字追加 */}
            <span className="text-gray-700 whitespace-pre-wrap">
              <TypewriterText text={cleanContent} isStreaming={msg.isStreaming} />
              {msg.isStreaming && cleanContent.length > 0 && (
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
