"use client";

import React, { useState } from "react";
import UGCCard from "./UGCCard";
import { ChevronDown } from "lucide-react";

// 模拟UGC数据
const mockUGCData = [
  {
    id: "1",
    title: "祝福",
    subtitle: "教学动画（4.9号已更新）",
    image: "/images/ugc/1.jpg",
    author: { name: "巧克力麦片188", avatar: "/images/avatars/1.svg" },
    heat: 4778,
    tag: "教学动画",
    category: "语文",
    textbook: "统编版",
    grade: "初一",
    semester: "上册",
  },
  {
    id: "2",
    title: "水果主题跨学科语言知识教学课件",
    subtitle: "",
    image: "/images/ugc/2.jpg",
    author: { name: "Cora", avatar: "/images/avatars/2.svg" },
    heat: 4736,
    tag: "教学课件",
    category: "英语",
    textbook: "人教PEP版",
    grade: "三年级",
    semester: "下册",
  },
  {
    id: "3",
    title: "分数意义教学动画",
    subtitle: "",
    image: "/images/ugc/3.jpg",
    author: { name: "林木木", avatar: "/images/avatars/3.svg" },
    heat: 4735,
    tag: "教学动画",
    category: "数学",
    textbook: "人教版",
    grade: "三年级",
    semester: "上册",
  },
  {
    id: "4",
    title: "数字宾果棋，下棋过程中巩固学生加减法",
    subtitle: "掌握数学加减运算技巧",
    image: "/images/ugc/4.jpg",
    author: { name: "程伟老师", avatar: "/images/avatars/4.svg" },
    heat: 4294,
    tag: "教学游戏",
    category: "数学",
    textbook: "北师大版",
    grade: "一年级",
    semester: "下册",
  },
  {
    id: "5",
    title: "智教未来新手指引（新）",
    subtitle: "新手入门必读",
    image: "/images/ugc/5.jpg",
    author: { name: "智教未来1号韩老师", avatar: "/images/avatars/5.svg" },
    heat: 5851,
    tag: "新手指引",
    category: "推荐",
    textbook: "",
    grade: "",
    semester: "",
    isHot: true,
  },
  {
    id: "6",
    title: "智教未来经典案例解析系列合集",
    subtitle: "持续更新",
    image: "/images/ugc/6.jpg",
    author: { name: "智教未来1号韩老师", avatar: "/images/avatars/6.svg" },
    heat: 5662,
    tag: "案例合集",
    category: "推荐",
    textbook: "",
    grade: "",
    semester: "",
    isHot: true,
  },
  {
    id: "7",
    title: "大明书院科举榜——用科举升级制度来管理班级",
    subtitle: "持续更新中",
    image: "/images/ugc/7.jpg",
    author: { name: "历史邓老师", avatar: "/images/avatars/7.svg" },
    heat: 4979,
    tag: "班级管理",
    category: "其他",
    textbook: "",
    grade: "",
    semester: "",
    isHot: true,
  },
  {
    id: "8",
    title: "生成数学错题统计与分析课件",
    subtitle: "",
    image: "/images/ugc/8.jpg",
    author: { name: "程伟", avatar: "/images/avatars/8.svg" },
    heat: 4806,
    tag: "数据分析",
    category: "数学",
    textbook: "苏教版",
    grade: "高一",
    semester: "上册",
  },
];

// 分类标签
const CATEGORIES = ["推荐", "语文", "数学", "英语", "物理", "化学", "信息科技", "其他"];

// 教材按科目差异化配置
const TEXTBOOK_OPTIONS: Record<string, string[]> = {
  语文: ["不限", "统编版"],
  数学: ["不限", "人教版", "北师大版", "苏教版"],
  英语: ["不限", "人教版", "人教PEP版"],
  物理: ["不限", "人教版", "北师大版"],
  化学: ["不限", "人教版"],
  信息科技: ["不限", "人教版", "浙教版"],
};

// 年级选项（通用）
const GRADE_OPTIONS = ["不限", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"];

// 期次选项
const SEMESTER_OPTIONS = ["不限", "上册", "下册"];

interface FilterState {
  textbook: string;
  grade: string;
  semester: string;
}

export default function UGCGrid() {
  const [activeCategory, setActiveCategory] = useState("推荐");
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    textbook: "不限",
    grade: "不限",
    semester: "不限",
  });

  const currentTextbooks = activeCategory !== "推荐" && activeCategory !== "其他"
    ? TEXTBOOK_OPTIONS[activeCategory] || ["不限"]
    : [];

  const handleCategoryClick = (cat: string) => {
    if (cat === activeCategory && showFilter) {
      setShowFilter(false);
    } else {
      setActiveCategory(cat);
      setFilter({ textbook: "不限", grade: "不限", semester: "不限" });
      setShowFilter(true);
    }
  };

  const handleTextbookChange = (v: string) => {
    setFilter((prev) => ({ ...prev, textbook: v }));
  };

  const handleGradeChange = (v: string) => {
    setFilter((prev) => ({ ...prev, grade: v }));
  };

  const handleSemesterChange = (v: string) => {
    setFilter((prev) => ({ ...prev, semester: v }));
  };

  // 筛选数据
  const filteredData = mockUGCData.filter((item) => {
    if (activeCategory === "推荐") return true;
    if (item.category !== activeCategory) return false;
    if (filter.textbook !== "不限" && item.textbook && item.textbook !== filter.textbook) return false;
    if (filter.grade !== "不限" && item.grade && item.grade !== filter.grade) return false;
    if (filter.semester !== "不限" && item.semester && item.semester !== filter.semester) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">大家都在用</h2>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${
              activeCategory === cat
                ? "bg-[#0D5C3F] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 筛选面板 */}
      {showFilter && activeCategory !== "推荐" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {/* 教材行（按科目差异化，有教材选项时显示） */}
          {currentTextbooks.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-2">教材</label>
              <div className="flex flex-wrap gap-2">
                {currentTextbooks.map((tb) => (
                  <button
                    key={tb}
                    type="button"
                    onClick={() => handleTextbookChange(tb)}
                    className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                      filter.textbook === tb
                        ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                        : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                    }`}
                  >
                    {tb}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 年级行 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">年级</label>
            <div className="flex flex-wrap gap-2">
              {GRADE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeChange(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    filter.grade === g
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 期次行 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">期次</label>
            <div className="flex flex-wrap gap-2">
              {SEMESTER_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSemesterChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    filter.semester === s
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
