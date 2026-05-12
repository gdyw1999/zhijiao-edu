"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-[#F5F9F7] overflow-hidden">
      {/* 左侧侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 手机顶部栏 */}
        <div className="md:hidden h-14 px-3 flex items-center justify-between bg-white border-b border-gray-200">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700"
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-800">智教未来</span>
          <div className="w-9 h-9" />
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-8">
            {children}
          </div>
        </div>
      </main>

      {/* 手机抽屉侧栏 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="关闭菜单遮罩"
          />
          <Sidebar
            className="relative flex w-72 max-w-[85vw]"
            onNavigate={() => setMobileMenuOpen(false)}
            headerExtra={(
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="关闭菜单"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          />
        </div>
      )}
    </div>
  );
}
