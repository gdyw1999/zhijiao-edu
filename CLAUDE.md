# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

智教未来 AI 教育平台，支持 AI 互动课件、AI命题、AI组题、AI教案四种生成模式。前端基于 Next.js 16 + React 19 + TypeScript，后端基于 Python FastAPI，通过 LinkAI 工作流调用 AI 生成能力。

## 常用命令

```bash
# 启动开发服务（推荐，自动安装依赖、检测端口）
python start_dev.py

# 前端单独启动
cd frontend && npm run dev

# 后端单独启动
cd backend && uvicorn app.main:app --reload --port 8000

# TypeScript 类型检查
cd frontend && npx tsc --noEmit

# 前端构建
cd frontend && npm run build
```

## 架构要点

### 前端结构 (Next.js App Router)

- `frontend/src/app/(main)/` - 共享布局的路由组，包含 Sidebar + 内容区
- `frontend/src/app/components/` - 核心组件
  - `GenerationPage.tsx` - AI生成页面共用组件，根据 aiFunction 动态渲染专属表单
  - `ChatInput.tsx` - 输入框组件，接收 tags/onRemoveTag/onSubmit props
  - `UGCGrid.tsx` - UGC卡片网格，支持8分类点击展开筛选面板
  - `forms/` - 4个模块专属表单（AnimationForm/QuestionForm/ExamForm/LessonForm）
  - `results/` - 4个结构化结果展示组件
- `frontend/src/lib/` - 类型定义(api.ts/types.ts)和 API 服务层
- `frontend/src/hooks/useGenerate.ts` - AI生成请求 Hook

### 后端结构 (FastAPI)

- `backend/app/main.py` - 应用入口，路由注册在 `/api` 前缀下
- `backend/app/api/routes/chat.py` - AI生成核心接口 `POST /api/chat/generate`
- `backend/app/services/linkai.py` - LinkAI API 封装，接口为 `/v1/workflow/run`
- `backend/app/services/result_parser.py` - 将 AI 返回的 Markdown 解析为结构化 JSON

### 4个AI模块的 aiFunction 值

`animation` | `question` | `exam` | `lesson`

对应的 LinkAI 工作流通过 `.env` 配置：
- `LINKAI_WORKFLOW_ANIMATION`
- `LINKAI_WORKFLOW_QUESTION`
- `LINKAI_WORKFLOW_EXAM`
- `LINKAI_WORKFLOW_LESSON`

### 表单标签系统

`GenerationPage.tsx` 根据 formParams 构建 `TagItem[]`，传递给 `ChatInput` 在 textarea 前方渲染。标签格式 `年级：初中，初一` 或 `题型数量：选择题10道，填空题5道`。提交时标签拼入 topic 前缀，供后端 Agent 路由。

### 重要配置

- `frontend/next.config.ts` - Next.js 配置，`allowedDevOrigins` 解决开发模式跨域
- `frontend/.env.local` - 前端环境变量，`NEXT_PUBLIC_API_BASE` 指向后端地址
- `.env` - 后端配置，包含 LinkAI API 地址/密钥和4个工作流编码

## PACE 工作流

项目使用 PACE 工作流管理变更：
- `task.md` - 任务追踪，按 CHG-ID 分组，状态标记 `[ ]`/`[/]`/`[x]`
- `implementation_plan.md` - 实施计划，变更索引 + 详情
- `walkthrough.md` - 工作记录，索引表 + 详情段落
- `findings.md` - 调研记录
- 变更 ID 格式：`CHG-YYYYMMDD-NN`（常规变更）或 `HOTFIX-YYYYMMDD-NN`（紧急修复）

## 注意事项

- 前端使用 Next.js 16 + React 19 + Tailwind CSS 4，样式变化较多
- 后端为同步调用 LinkAI，无 task_id 轮询机制
- 所有对话、代码注释及文档均使用中文