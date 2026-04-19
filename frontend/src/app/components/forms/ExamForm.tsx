/**
 * ExamForm - AI组题专属表单
 *
 * 提供试卷类型、总分、考试时长、题型比例设置。
 */

"use client";

import React, { useState } from "react";

/** 试卷类型选项 */
const EXAM_TYPES = [
  { value: "单元测试", label: "单元测试" },
  { value: "期中考试", label: "期中考试" },
  { value: "期末考试", label: "期末考试" },
  { value: "模拟考试", label: "模拟考试" },
  { value: "专项练习", label: "专项练习" },
];

/** 总分预设 */
const SCORE_OPTIONS = [60, 80, 100, 120, 150];

/** 考试时长预设（分钟） */
const DURATION_OPTIONS = [45, 60, 90, 120];

/** 题型比例预设 */
const TYPE_RATIOS = [
  {
    value: "standard",
    label: "标准",
    desc: "选择40% + 填空20% + 解答40%",
  },
  {
    value: "basic",
    label: "基础",
    desc: "选择60% + 填空25% + 解答15%",
  },
  {
    value: "advanced",
    label: "综合",
    desc: "选择25% + 填空15% + 解答60%",
  },
];

interface ExamFormProps {
  onChange: (values: {
    exam_type?: string;
    total_score?: number;
    exam_duration?: number;
  }) => void;
  disabled?: boolean;
}

export default function ExamForm({ onChange, disabled = false }: ExamFormProps) {
  const [examType, setExamType] = useState("单元测试");
  const [totalScore, setTotalScore] = useState(100);
  const [examDuration, setExamDuration] = useState(90);
  const [ratioType, setRatioType] = useState("standard");

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="space-y-4">
        {/* 试卷类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            试卷类型
          </label>
          <div className="flex flex-wrap gap-2">
            {EXAM_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setExamType(type.value);
                  onChange({ exam_type: type.value });
                }}
                disabled={disabled || undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  examType === type.value
                    ? "bg-[#0D5C3F] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 总分 + 时长（并排） */}
        <div className="grid grid-cols-2 gap-4">
          {/* 总分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              满分
            </label>
            <div className="flex flex-wrap gap-2">
              {SCORE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                onClick={() => {
                    setTotalScore(s);
                    onChange({ total_score: s });
                  }}
                  disabled={disabled || undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    totalScore === s
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {s}分
                </button>
              ))}
            </div>
          </div>

          {/* 时长 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              考试时长
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                onClick={() => {
                    setExamDuration(d);
                    onChange({ exam_duration: d });
                  }}
                  disabled={disabled || undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    examDuration === d
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {d}分钟
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 题型比例 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题型比例
          </label>
          <div className="flex flex-wrap gap-3">
            {TYPE_RATIOS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRatioType(opt.value)}
                disabled={disabled || undefined}
                className={`flex flex-col items-start px-4 py-2.5 rounded-lg transition-all ${
                  ratioType === opt.value
                    ? "bg-[#0D5C3F]/5 border-2 border-[#0D5C3F]"
                    : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                }`}
              >
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
