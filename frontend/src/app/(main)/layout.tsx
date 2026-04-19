import React from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-[#F5F9F7] overflow-hidden">
      {/* 左侧侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
