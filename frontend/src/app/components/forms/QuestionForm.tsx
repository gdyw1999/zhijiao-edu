/**
 * QuestionForm - AI命题专属表单
 *
 * 提供题型多选、难度选择、题目数量设置。
 */

"use client";

import React, { useState } from "react";

/** 可选题型 */
const QUESTION_TYPES = [
  { value: "选择", label: "选择题" },
  { value: "填空", label: "填空题" },
  { value: "判断", label: "判断题" },
  { value: "解答", label: "解答题" },
  { value: "简答", label: "简答题" },
  { value: "作文", label: "作文题" },
];

/** 难度选项 */
const DIFFICULTY_OPTIONS = [
  { value: "简单", label: "基础", color: "text-green-600 bg-green-50" },
  { value: "中等", label: "中等", color: "text-yellow-600 bg-yellow-50" },
  { value: "困难", label: "挑战", color: "text-red-600 bg-red-50" },
  { value: "混合", label: "混合难度", color: "text-blue-600 bg-blue-50" },
];

/** 题目数量预设 */
const COUNT_OPTIONS = [5, 10, 15, 20, 30];

interface QuestionFormProps {
  onChange: (values: {
    difficulty?: string;
    question_types?: string[];
    question_count?: number;
  }) => void;
  disabled?: boolean;
}

export default function QuestionForm({ onChange, disabled = false }: QuestionFormProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["选择", "填空"]);
  const [difficulty, setDifficulty] = useState("中等");
  const [count, setCount] = useState(10);

  const toggleType = (value: string) => {
    const newTypes = selectedTypes.includes(value)
      ? selectedTypes.filter((t) => t !== value)
      : [...selectedTypes, value];
    setSelectedTypes(newTypes);
    onChange({ question_types: newTypes });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="space-y-4">
        {/* 题型多选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题型选择 <span className="text-gray-400 font-normal">（可多选）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleType(type.value)}
                disabled={disabled || undefined}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                  selectedTypes.includes(type.value)
                    ? "bg-[#0D5C3F] text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
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

        {/* 题目数量 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目数量
          </label>
          <div className="flex flex-wrap gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setCount(n);
                  onChange({ question_count: n });
                }}
                disabled={disabled || undefined}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                  count === n
                    ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                    : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                }`}
              >
                {n} 题
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
