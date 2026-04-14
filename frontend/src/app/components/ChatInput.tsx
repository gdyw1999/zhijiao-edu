"use client";

import React, { useState } from "react";
import {
  Paperclip,
  Image,
  Mic,
  Send,
  X,
  Sparkles,
} from "lucide-react";

const quickTags = [
  { id: "animation", label: "教学动画", icon: "🎬" },
  { id: "game", label: "教学游戏", icon: "🎮" },
  { id: "multipage", label: "多页课件", icon: "📑" },
];

export default function ChatInput() {
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTagClick = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);

    // 模拟API调用
    setTimeout(() => {
      setIsLoading(false);
      setInputValue("");
      setSelectedTags([]);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tagId) => {
            const tag = quickTags.find((t) => t.id === tagId);
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#0D5C3F]/10 text-[#0D5C3F] text-sm rounded-full"
              >
                {tag?.icon} {tag?.label}
                <button
                  onClick={() => handleTagClick(tagId)}
                  className="hover:text-[#0D5C3F]/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* 输入框 */}
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="结合初中语文文言文常见18个虚词，给我生成一个虚词互动知识问答，让学生在互动答题中培养文言文理解语感。"
        className="w-full min-h-[80px] max-h-[200px] p-3 text-gray-700 placeholder-gray-400 border-0 resize-none focus:outline-none focus:ring-0"
        rows={3}
      />

      {/* 快捷标签 */}
      <div className="flex flex-wrap items-center gap-2 mt-2 px-2">
        {quickTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border transition-all ${
              selectedTags.includes(tag.id)
                ? "bg-[#0D5C3F] text-white border-[#0D5C3F]"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0D5C3F] hover:text-[#0D5C3F]"
            }`}
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
          </button>
        ))}
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="添加附件">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="上传图片">
            <Image className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="语音输入">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            inputValue.trim() && !isLoading
              ? "bg-[#0D5C3F] text-white hover:bg-[#0a4a32] shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
