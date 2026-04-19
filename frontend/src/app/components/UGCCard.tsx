"use client";

import React from "react";
import { Flame, Eye } from "lucide-react";

interface UGCCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  heat: number;
  tag: string;
  isHot?: boolean;
}

export default function UGCCard({
  title,
  subtitle,
  image,
  author,
  heat,
  tag,
  isHot = false,
}: UGCCardProps) {
  // 格式化热度数字
  const formatHeat = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    }
    return num.toLocaleString();
  };

  return (
    <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* 热门标签 */}
        {isHot && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Flame className="w-3 h-3" />
            热门
          </div>
        )}

        {/* 分类标签 */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
          {tag}
        </div>

        {/* 热度 */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Eye className="w-3 h-3" />
          {formatHeat(heat)}热度
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-base line-clamp-2 mb-1">
          《{title}》{subtitle}
        </h3>

        {/* 作者信息 */}
        <div className="flex items-center gap-2 mt-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-6 h-6 rounded-full bg-gray-100"
          />
          <span className="text-sm text-gray-600 truncate">{author.name}</span>
        </div>
      </div>
    </article>
  );
}
