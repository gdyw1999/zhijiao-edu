/**
 * QuestionForm - AI命题专属表单
 *
 * 提供年级选择（首位）、题型多选（竖排+每题型独立数量）、难度选择。
 */

"use client";

import React, { useState } from "react";

/** 年级档位 */
const GRADE_LEVELS = [
  { value: "小学", label: "小学" },
  { value: "初中", label: "初中" },
  { value: "高中", label: "高中" },
];

/** 各档位对应年级 */
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
};

/** 可选题型 + 默认数量 */
const QUESTION_TYPES = [
  { value: "选择", label: "选择题", defaultCount: 10 },
  { value: "填空", label: "填空题", defaultCount: 5 },
  { value: "判断", label: "判断题", defaultCount: 10 },
  { value: "解答", label: "解答题", defaultCount: 3 },
  { value: "简答", label: "简答题", defaultCount: 3 },
  { value: "作文", label: "作文题", defaultCount: 1 },
];

/** 题目数量选项（普通题型） */
const COUNT_OPTIONS = [3, 5, 8, 10, 15, 20];

/** 作文题数量选项（0=不写/1篇/2篇） */
const COMPOSITION_COUNT_OPTIONS = [0, 1, 2];

/** 难度选项 */
const DIFFICULTY_OPTIONS = [
  { value: "简单", label: "基础", color: "text-green-600 bg-green-50" },
  { value: "中等", label: "中等", color: "text-yellow-600 bg-yellow-50" },
  { value: "困难", label: "挑战", color: "text-red-600 bg-red-50" },
  { value: "混合", label: "混合难度", color: "text-blue-600 bg-blue-50" },
];

interface QuestionFormProps {
  onChange: (values: {
    grade_level?: string;
    grade?: string;
    question_types?: string[];
    type_counts?: Record<string, number>;
    difficulty?: string;
  }) => void;
  disabled?: boolean;
}

export default function QuestionForm({ onChange, disabled = false }: QuestionFormProps) {
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["选择", "填空"]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
    选择: 10,
    填空: 5,
    判断: 10,
    解答: 3,
    简答: 3,
    作文: 1,
  });
  const [difficulty, setDifficulty] = useState("中等");

  const grades = gradeLevel ? GRADES_BY_LEVEL[gradeLevel] : [];

  const handleGradeLevelChange = (value: string) => {
    setGradeLevel(value);
    setGrade("");
    onChange({ grade_level: value, grade: "" });
  };

  const handleGradeChange = (value: string) => {
    setGrade(value);
    onChange({ grade: value });
  };

  const toggleType = (value: string) => {
    const newTypes = selectedTypes.includes(value)
      ? selectedTypes.filter((t) => t !== value)
      : [...selectedTypes, value];
    setSelectedTypes(newTypes);
    onChange({ question_types: newTypes });
  };

  const handleCountChange = (type: string, count: number) => {
    const newCounts = { ...typeCounts, [type]: count };
    setTypeCounts(newCounts);
    onChange({ type_counts: newCounts });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="space-y-4">
        {/* 年级档位选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年级
          </label>
          <div className="flex flex-wrap gap-2">
            {GRADE_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleGradeLevelChange(level.value)}
                disabled={disabled || undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  gradeLevel === level.value
                    ? "bg-[#0D5C3F] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* 具体年级选择 */}
        {gradeLevel && grades.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择{gradeLevel}
            </label>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeChange(g)}
                  disabled={disabled || undefined}
                  className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                    grade === g
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 题型多选（竖排+每题型独立数量） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题型选择 <span className="text-gray-400 font-normal">（可多选）</span>
          </label>
          <div className="space-y-2">
            {QUESTION_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type.value);
              const countOptions = type.value === "作文" ? COMPOSITION_COUNT_OPTIONS : COUNT_OPTIONS;
              return (
                <div
                  key={type.value}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-[#0D5C3F] bg-[#0D5C3F]/5"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  {/* 题型名称 */}
                  <button
                    type="button"
                    onClick={() => toggleType(type.value)}
                    disabled={disabled || undefined}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#0D5C3F] border-[#0D5C3F]"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${isSelected ? "text-[#0D5C3F]" : "text-gray-500"}`}>
                      {type.label}
                    </span>
                  </button>

                  {/* 题目数量（仅选中时显示） */}
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500">题数：</span>
                      <div className="flex gap-1">
                        {countOptions.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleCountChange(type.value, n)}
                            disabled={disabled || undefined}
                            className={`min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                              typeCounts[type.value] === n
                                ? "bg-[#0D5C3F] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 难度选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            难度等级
          </label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setDifficulty(opt.value);
                  onChange({ difficulty: opt.value });
                }}
                disabled={disabled || undefined}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  difficulty === opt.value
                    ? `${opt.color} ring-2 ring-offset-1 ring-current`
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
