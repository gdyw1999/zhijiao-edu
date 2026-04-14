"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#0D5C3F] to-[#1a7a5a] rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          智教未来<span className="text-[#0D5C3F]">，一句话生成专业级互动课件</span>
        </h1>
      </div>
    </header>
  );
}
