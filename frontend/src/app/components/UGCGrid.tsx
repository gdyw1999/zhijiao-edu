"use client";

import React from "react";
import UGCCard from "./UGCCard";

// 模拟UGC数据 - 匹配智教未来UI风格
const mockUGCData = [
  {
    id: "1",
    title: "祝福",
    subtitle: "教学动画（4.9号已更新）",
    image: "/images/ugc/1.jpg",
    author: {
      name: "巧克力麦片188",
      avatar: "/images/avatars/1.svg",
    },
    heat: 4778,
    tag: "教学动画",
    category: "语文",
  },
  {
    id: "2",
    title: "水果主题跨学科语言知识教学课件",
    subtitle: "",
    image: "/images/ugc/2.jpg",
    author: {
      name: "Cora",
      avatar: "/images/avatars/2.svg",
    },
    heat: 4736,
    tag: "教学课件",
    category: "英语",
  },
  {
    id: "3",
    title: "分数意义教学动画",
    subtitle: "",
    image: "/images/ugc/3.jpg",
    author: {
      name: "林木木",
      avatar: "/images/avatars/3.svg",
    },
    heat: 4735,
    tag: "教学动画",
    category: "数学",
  },
  {
    id: "4",
    title: "数字宾果棋，下棋过程中巩固学生加减法",
    subtitle: "掌握数学加减运算技巧",
    image: "/images/ugc/4.jpg",
    author: {
      name: "程伟老师",
      avatar: "/images/avatars/4.svg",
    },
    heat: 4294,
    tag: "教学游戏",
    category: "数学",
  },
  {
    id: "5",
    title: "智教未来新手指引（新）",
    subtitle: "新手入门必读",
    image: "/images/ugc/5.jpg",
    author: {
      name: "智教未来1号韩老师",
      avatar: "/images/avatars/5.svg",
    },
    heat: 5851,
    tag: "新手指引",
    category: "推荐",
    isHot: true,
  },
  {
    id: "6",
    title: "智教未来经典案例解析系列合集",
    subtitle: "持续更新",
    image: "/images/ugc/6.jpg",
    author: {
      name: "智教未来1号韩老师",
      avatar: "/images/avatars/6.svg",
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
    image: "/images/ugc/7.jpg",
    author: {
      name: "历史邓老师",
      avatar: "/images/avatars/7.svg",
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
    image: "/images/ugc/8.jpg",
    author: {
      name: "飞象用户0227",
      avatar: "/images/avatars/8.svg",
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
        <button
          type="button"
          disabled
          title="案例浏览功能即将上线"
          className="text-sm text-gray-400 flex items-center gap-1 cursor-not-allowed"
        >
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
        <button
          type="button"
          disabled
          title="更多案例即将上线"
          className="px-6 py-2 bg-gray-100 text-gray-400 rounded-full text-sm font-medium cursor-not-allowed"
        >
          加载更多
        </button>
      </div>
    </div>
  );
}
