"use client";

import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ChatInput from "./components/ChatInput";
import CategoryTabs from "./components/CategoryTabs";
import UGCGrid from "./components/UGCGrid";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("recommend");

  return (
    <div className="flex h-screen bg-[#F5F9F7] overflow-hidden">
      {/* 左侧侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* 标题区 */}
            <Header />

            {/* 输入框区 */}
            <ChatInput />

            {/* 分类标签 */}
            <CategoryTabs
              onCategoryChange={(category) => setActiveCategory(category)}
            />

            {/* UGC卡片网格 */}
            <UGCGrid category={activeCategory} />
          </div>
        </div>
      </main>
    </div>
  );
}
