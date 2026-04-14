"use client";

import React from "react";
import UGCCard from "./UGCCard";

// 模拟UGC数据 - 匹配飞象老师UI风格
const mockUGCData = [
  {
    id: "1",
    title: "祝福",
    subtitle: "教学动画（4.9号已更新）",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300",
    author: {
      name: "巧克力麦片188",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    },
    heat: 4778,
    tag: "教学动画",
    category: "语文",
  },
  {
    id: "2",
    title: "水果主题跨学科语言知识教学课件",
    subtitle: "",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300",
    author: {
      name: "Cora",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    },
    heat: 4736,
    tag: "教学课件",
    category: "英语",
  },
  {
    id: "3",
    title: "分数意义教学动画",
    subtitle: "",
    image: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400&h=300",
    author: {
      name: "林木木",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    },
    heat: 4735,
    tag: "教学动画",
    category: "数学",
  },
  {
    id: "4",
    title: "数字宾果棋，下棋过程中巩固学生加减法",
    subtitle: "掌握数学加减运算技巧",
    image: "https://images.unsplash.com/photo-1611996902537-f403c7bf33fc?w=400&h=300",
    author: {
      name: "程伟老师",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    },
    heat: 4294,
    tag: "教学游戏",
    category: "数学",
  },
  {
    id: "5",
    title: "飞象老师新手指引（新）",
    subtitle: "新手入门必读",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300",
    author: {
      name: "飞象老师1号YOYO",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
    },
    heat: 5851,
    tag: "新手指引",
    category: "推荐",
    isHot: true,
  },
  {
    id: "6",
    title: "飞象老师经典案例解析系列合集",
    subtitle: "持续更新",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=300",
    author: {
      name: "飞象老师1号YOYO",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
    },
    heat: 5662,
    tag: "案例合集",
    category: "推荐",
    isHot: true,
  },
  {
    id: "7",
    title: "大明书院科举榜——用科举升级制度来管理班级",
    subtitle: "持续更新中",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300",
    author: {
      name: "历史邓老师",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=7",
    },
    heat: 4979,
    tag: "班级管理",
    category: "其他",
    isHot: true,
  },
  {
    id: "8",
    title: "生成数学错题统计与分析课件",
    subtitle: "",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300",
    author: {
      name: "飞象用户0227",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=8",
    },
    heat: 4806,
    tag: "数据分析",
    category: "数学",
  },
];

interface UGCGridProps {
  category?: string;
}

export default function UGCGrid({ category = "all" }: UGCGridProps) {
  // 根据分类筛选
  const filteredData =
    category === "all" || category === "recommend"
      ? mockUGCData
      : mockUGCData.filter(
          (item) =>
            item.category === category || item.category === "推荐"
        );

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">大家都在用</h2>
        <button className="text-sm text-gray-500 hover:text-[#0D5C3F] transition-colors flex items-center gap-1">
          探索使用案例
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredData.map((item) => (
          <UGCCard key={item.id} {...item} />
        ))}
      </div>

      {/* 加载更多 */}
      <div className="flex justify-center pt-4">
        <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-sm font-medium transition-colors">
          加载更多
        </button>
      </div>
    </div>
  );
}
