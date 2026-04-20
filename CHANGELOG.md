# 更新日志 (Changelog)

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 新增

#### 阶段二 - 4个模块差异化 UI
- 互动课件/AI命题/AI组题/AI教案各自拥有专属表单和结构化结果展示
- 新增 `forms/` 目录下 4 个模块专属表单组件（AnimationForm/QuestionForm/ExamForm/LessonForm）
- 新增 `results/` 目录下 4 个结构化结果展示组件
- 后端新增 `result_parser.py`，将 AI 返回的 Markdown 解析为结构化 JSON

#### 表单交互优化
- 互动课件/AI命题/AI组题/AI教案页面新增两级年级选择（小学/初中/高中 → 具体年级）
- AI命题页面题型改为竖排布局，每种题型独立勾选并设置题目数量（作文0/1/2）
- ChatInput 前置表单选项标签（年级/题型数量），点击叉号移除并恢复表单状态
- 表单选项标签拼入 topic 前缀，发送给后端 Agent 用于区分处理逻辑

#### UGCGrid 交互优化
- UGCGrid 分类点击直接展开筛选面板（移除"探索使用案例"独立按钮）
- UGCGrid 教材选项按科目差异化配置（语文/数学/英语/物理/化学/信息科技）

### 修复
- 修复所有按钮因 Tailwind v4 cursor 缺失和 React disabled 渲染问题导致的不可点击
- 修复 Next.js 16 开发服务跨域拦截导致的 hydration 失败
- 修复分类标签重复问题（CategoryTabs 与 UGCGrid 8分类重叠）
- 移除 Next.js 无效的 `--verbose` 和 `--webpack` 标志
- 移除 outputFileTracingRoot 导致的客户端 JS bundle 路径解析错误

### 变更
- 前端启动改用 webpack 模式解决 Turbopack 渲染和 JS 兼容性问题
- 启动脚本日志输出增强（添加时间戳、环境信息）
- UGC 卡片图片和头像资源本地化，不再依赖外部 CDN（unsplash、dicebear）
- GenerationResult 下载按钮改为真实 Blob 下载实现
- 互动课件表单移除"预计时长"选择器和"互动问答"类型选项

---

## [1.1.0] - 2026-04-13

### 重大变更

#### 后端重构：Node.js → Python/FastAPI

后端技术栈从 **Express (Node.js)** 全面迁移至 **FastAPI (Python 3.8+)**，提供更强大的异步性能和类型安全。

**主要变更：**
- 后端框架：`Express 4.x` → `FastAPI 0.109.x`
- 后端语言：`JavaScript (ES6+)` → `Python 3.8+`
- ASGI 服务器：新增 `Uvicorn` 作为 ASGI 服务器
- 数据验证：`Joi` → `Pydantic v2`
- 配置管理：新增 `pydantic-settings` 统一管理配置

**新增后端模块：**
- `app/core/config.py` - 统一配置管理，从根目录 `.env` 读取
- `app/core/logger.py` - 结构化 JSON 日志和彩色控制台日志
- `app/api/routes/` - API 路由模块
  - `categories.py` - 学科分类接口
  - `chat.py` - AI 生成任务接口
  - `generations.py` - UGC 内容接口
  - `health.py` - 健康检查接口
- `app/services/linkai.py` - LinkAI 私有化版服务封装

**启动脚本更新：**
- `start_dev.py`（Python）替代原来的 `start-dev.js`/`start-dev.bat`/`start-dev.sh`
- 自动检测 Python 和 Node.js 环境
- 自动创建虚拟环境并安装依赖
- 自动检测端口占用

### 改进
- 配置管理：从分散的 `.env` 文件统一到项目根目录单一 `.env`
- 日志系统：新增结构化 JSON 日志，便于生产环境监控
- API 文档：自动生成的 OpenAPI/Swagger 文档 (http://localhost:8000/docs)
- 类型安全：全链路 Python 类型注解

---

## [1.0.0] - 2026-04-13

### 新增

#### 后端 (Backend)
- **Express 服务器框架** - RESTful API 架构
- **Mock API 接口**
  - `GET /api/health` - 健康检查
  - `GET /api/categories` - 学科分类列表
  - `GET /api/generations/hot` - 热门UGC卡片数据
  - `POST /api/chat/generate` - AI生成任务创建
  - `GET /api/chat/status/:taskId` - 任务状态查询
- **环境变量配置** - `.env` 文件支持
- **CORS 跨域支持**

#### 前端 (Frontend)
- **Next.js 14 框架** - React 18 + TypeScript
- **飞象老师 UI 复刻**
  - 深绿色侧边栏导航
  - 主内容区布局
  - 输入框组件
  - UGC 卡片网格
  - 分类标签页
- **组件列表**
  - `Sidebar` - 侧边栏导航
  - `Header` - 顶部标题
  - `ChatInput` - 输入框
  - `CategoryTabs` - 分类标签
  - `UGCGrid/UGCCard` - 卡片网格
- **Tailwind CSS** - 原子化样式系统
- **Lucide Icons** - 图标库

#### 开发工具
- **跨平台启动脚本** (`start-dev.js`)
  - Node.js 版本（推荐）
  - 自动检测环境
  - 自动安装依赖
  - 端口占用检测
  - 配置文件支持
- **Windows 批处理** (`start-dev.bat`)
- **Linux/macOS Shell** (`start-dev.sh`)

#### 文档
- **README.md** - 项目说明文档
- **CHANGELOG.md** - 更新日志
- **.env.example** - 环境变量模板

### 技术栈 (v1.0.0)

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 14.x |
| 前端语言 | TypeScript | 5.x |
| 前端样式 | Tailwind CSS | 3.x |
| 后端框架 | Express | 4.x |
| 后端语言 | JavaScript | ES6+ |
| 运行环境 | Node.js | >= 18.0.0 |

### 目录结构 (v1.0.0)

```
zhijiao-edu/
├── .env                      # 环境变量（需创建）
├── .env.example              # 环境变量模板
├── start-dev.js              # 跨平台启动脚本（Node.js）
├── start-dev.sh              # Linux/macOS 快捷入口
├── start-dev.bat             # Windows 快捷入口
├── README.md                 # 项目说明
├── CHANGELOG.md              # 更新日志
│
├── backend/                  # 后端服务 (Express)
│   ├── src/
│   │   ├── index.js         # 服务器入口
│   │   └── routes/          # API路由
│   ├── .env.example         # 后端环境变量模板
│   └── package.json
│
└── frontend/                 # 前端应用 (Next.js)
    ├── src/app/
    │   ├── components/      # React组件
    │   ├── page.tsx        # 主页
    │   └── layout.tsx      # 布局
    └── package.json
```

### 已知问题

- 无

### 后续计划

- [x] 后端重构：Express → FastAPI (Python)（已在 v1.1.0 完成）
- [ ] 接入真实 LinkAI API
- [ ] 数据库集成（PostgreSQL）
- [ ] 用户认证系统
- [ ] 作业批改功能
- [ ] 部署文档

---

**GitHub**: [https://github.com/gdyw1999/zhijiao-edu](https://github.com/gdyw1999/zhijiao-edu)
