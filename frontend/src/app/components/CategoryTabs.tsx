"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

const categories = [
  { id: "recommend", name: "推荐" },
  { id: "chinese", name: "语文" },
  { id: "math", name: "数学", hot: true },
  { id: "english", name: "英语" },
  { id: "physics", name: "物理" },
  { id: "chemistry", name: "化学" },
  { id: "biology", name: "生物" },
  { id: "history", name: "历史" },
  { id: "geography", name: "地理" },
  { id: "politics", name: "政治" },
  { id: "pe", name: "体育" },
  { id: "art", name: "美术" },
  { id: "music", name: "音乐" },
  { id: "it", name: "信息科技" },
  { id: "comprehensive", name: "综合实践" },
];

interface CategoryTabsProps {
  onCategoryChange?: (categoryId: string) => void;
}

export default function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState("recommend");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <div className="mb-6">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="快速搜索资源"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3F]/20 focus:border-[#0D5C3F] transition-all"
        />
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activeCategory === category.id
                ? "bg-[#0D5C3F] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
            }`}
          >
            {category.name}
            {category.hot && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
