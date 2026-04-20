/**
 * AnimationForm - AI互动课件专属表单
 *
 * 提供课件类型选择（演示动画/教学游戏/多页课件）和年级选择。
 */

"use client";

import React, { useState } from "react";

/** 动画类型选项 */
const ANIMATION_TYPES = [
  { value: "演示动画", label: "演示动画" },
  { value: "教学游戏", label: "教学游戏" },
  { value: "多页课件", label: "多页课件" },
];

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

interface AnimationFormProps {
  /** 表单值变更回调 */
  onChange: (values: {
    animation_type?: string;
    grade_level?: string;
    grade?: string;
  }) => void;
  /** 是否禁用（生成中） */
  disabled?: boolean;
}

export default function AnimationForm({ onChange, disabled = false }: AnimationFormProps) {
  const [animationType, setAnimationType] = useState("演示动画");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [grade, setGrade] = useState<string>("");

  const handleTypeChange = (value: string) => {
    setAnimationType(value);
    onChange({ animation_type: value });
  };

  const handleGradeLevelChange = (value: string) => {
    setGradeLevel(value);
    setGrade("");
    onChange({ grade_level: value, grade: "" });
  };

  const handleGradeChange = (value: string) => {
    setGrade(value);
    onChange({ grade: value });
  };

  const grades = gradeLevel ? GRADES_BY_LEVEL[gradeLevel] : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="space-y-4">
        {/* 课件类型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            课件类型
          </label>
          <div className="flex flex-wrap gap-2">
            {ANIMATION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                disabled={disabled || undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  animationType === type.value
                    ? "bg-[#0D5C3F] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

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

        {/* 具体年级选择（根据档位动态显示） */}
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
      </div>
    </div>
  );
}
