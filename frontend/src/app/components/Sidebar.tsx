"use client";

import React from "react";
import {
  Plus,
  Video,
  FileText,
  ListTodo,
  BookOpen,
  Clock,
  Coins,
  User,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { id: "animation", label: "AI互动课件", icon: Video, path: "/animation" },
  { id: "question", label: "AI命题", icon: FileText, path: "/question" },
  { id: "exam", label: "AI组题", icon: ListTodo, path: "/exam" },
  { id: "lesson", label: "AI教案·大单元", icon: BookOpen, path: "/lesson" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [points] = useState(57);

  return (
    <aside className="w-64 bg-[#0D5C3F] text-white h-screen flex flex-col flex-shrink-0">
      {/* Logo区域 */}
      <div className="p-4 border-b border-[#1a7a5a]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">智教未来</span>
        </div>
      </div>

      {/* 新建任务按钮 */}
      <div className="p-4">
        <button
          type="button"
          disabled
          title="任务管理即将上线"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 flex items-center gap-2 cursor-not-allowed opacity-70"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">新建任务</span>
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#0D5C3F] font-medium shadow-lg"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[#0D5C3F]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 今日任务 */}
      <div className="px-4 py-3 border-t border-[#1a7a5a]">
        <div className="flex items-center justify-between text-white/80 mb-2">
          <span className="text-sm">今日任务</span>
          <Clock className="w-4 h-4" />
        </div>
        <div className="bg-white/10 rounded-lg p-2">
          <p className="text-xs text-white/60 truncate">初中文言文虚词互动问...</p>
        </div>
      </div>

      {/* 底部：积分和用户信息 */}
      <div className="p-4 border-t border-[#1a7a5a] space-y-3">
        {/* 剩余积分 */}
        <div className="flex items-center gap-2 text-white/80">
          <Coins className="w-4 h-4" />
          <span className="text-sm">剩余积分: <span className="font-bold text-white">{points}</span></span>
        </div>

        {/* 用户头像 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-white/80">一起学ai的韩老师</span>
        </div>
      </div>
    </aside>
  );
}
