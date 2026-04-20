/**
 * LessonForm - AI教案专属表单
 *
 * 提供年级选择（首位）、课时类型、课时数、班额、教材版本选择。
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

/** 课时类型选项 */
const LESSON_TYPES = [
  { value: "新授课", label: "新授课" },
  { value: "复习课", label: "复习课" },
  { value: "讲评课", label: "讲评课" },
  { value: "实验课", label: "实验课" },
  { value: "活动课", label: "活动课" },
];

/** 课时数预设 */
const SESSION_OPTIONS = [1, 2, 3, 4, 5];

/** 班额预设 */
const CLASS_SIZE_OPTIONS = [
  { value: 20, label: "20人（小班）" },
  { value: 30, label: "30人" },
  { value: 40, label: "40人（标准）" },
  { value: 50, label: "50人（大班）" },
  { value: 60, label: "60人以上" },
];

/** 常用教材版本 */
const TEXTBOOK_OPTIONS = [
  { value: "人教版", label: "人教版" },
  { value: "北师大版", label: "北师大版" },
  { value: "苏教版", label: "苏教版" },
  { value: "沪教版", label: "沪教版" },
  { value: "部编版", label: "部编版" },
  { value: "其他", label: "其他" },
];

interface LessonFormProps {
  onChange: (values: {
    grade_level?: string;
    grade?: string;
    lesson_type?: string;
    duration?: number;
    class_size?: number;
  }) => void;
  disabled?: boolean;
}

export default function LessonForm({ onChange, disabled = false }: LessonFormProps) {
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [lessonType, setLessonType] = useState("新授课");
  const [sessions, setSessions] = useState(2);
  const [classSize, setClassSize] = useState(40);
  const [textbook, setTextbook] = useState("人教版");

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

        {/* 课时类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            课时类型
          </label>
          <div className="flex flex-wrap gap-2">
            {LESSON_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setLessonType(type.value);
                  onChange({ lesson_type: type.value });
                }}
                disabled={disabled || undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                  lessonType === type.value
                    ? "bg-[#0D5C3F] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 课时数 + 班额（并排） */}
        <div className="grid grid-cols-2 gap-4">
          {/* 课时数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              课时数
            </label>
            <div className="flex flex-wrap gap-2">
              {SESSION_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                onClick={() => {
                    setSessions(n);
                    // 每课时45分钟
                    onChange({ duration: n * 45 });
                  }}
                  disabled={disabled || undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    sessions === n
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {n} 课时
                </button>
              ))}
            </div>
          </div>

          {/* 班额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              班级人数
            </label>
            <div className="flex flex-wrap gap-2">
              {CLASS_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                onClick={() => {
                    setClassSize(opt.value);
                    onChange({ class_size: opt.value });
                  }}
                  disabled={disabled || undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                    classSize === opt.value
                      ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                      : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 教材版本 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            教材版本
          </label>
          <div className="flex flex-wrap gap-2">
            {TEXTBOOK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTextbook(opt.value)}
                disabled={disabled || undefined}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                  textbook === opt.value
                    ? "bg-[#0D5C3F]/10 text-[#0D5C3F] border-2 border-[#0D5C3F]"
                    : "bg-gray-50 text-gray-500 border-2 border-transparent hover:border-gray-300"
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
