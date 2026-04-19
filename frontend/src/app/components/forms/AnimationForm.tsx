/**
 * AnimationForm - AI互动课件专属表单
 *
 * 提供动画类型选择和时长设置。
 */

"use client";

import React, { useState } from "react";

/** 动画类型选项 */
const ANIMATION_TYPES = [
  { value: "演示动画", label: "演示动画" },
  { value: "教学游戏", label: "教学游戏" },
  { value: "多页课件", label: "多页课件" },
  { value: "互动问答", label: "互动问答" },
];

/** 预设时长选项（秒） */
const DURATION_OPTIONS = [
  { value: 30, label: "30秒" },
  { value: 60, label: "1分钟" },
  { value: 120, label: "2分钟" },
  { value: 180, label: "3分钟" },
  { value: 300, label: "5分钟" },
];

interface AnimationFormProps {
  /** 表单值变更回调 */
  onChange: (values: {
    animation_type?: string;
    duration?: number;
  }) => void;
  /** 是否禁用（生成中） */
  disabled?: boolean;
}

export default function AnimationForm({ onChange, disabled = false }: AnimationFormProps) {
  const [animationType, setAnimationType] = useState("演示动画");
  const [duration, setDuration] = useState(60);

  const handleTypeChange = (value: string) => {
    setAnimationType(value);
    onChange({ animation_type: value });
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    onChange({ duration: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
      <div className="space-y-4">
        {/* 动画类型选择 */}
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

        {/* 时长选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            预计时长
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleDurationChange(opt.value)}
                disabled={disabled || undefined}
                className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${
                  duration === opt.value
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
