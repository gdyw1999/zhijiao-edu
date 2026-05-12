/**
 * 1052 Skill 执行服务 - 受限端点
 *
 * 提供给智教未来后端调用的专用端点，通过指定 skill_id 加载 SKILL.md
 * 作为 system prompt，使用 LLM + 受限工具（仅 skill_create_file）生成 HTML 内容。
 *
 * 安全设计：
 * - 只暴露 skill_create_file 一个工具
 * - 不加载 memory/calendar/workspace 等 Agent 上下文
 * - Agent 循环上限 30 轮
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { Router, type Request, type Response } from 'express'
import { config } from '../../config.js'
import { httpError } from '../../http-error.js'
import { getSettings } from '../settings/settings.service.js'
import { chatCompletion, chatCompletionStream, type LLMConversationMessage } from './llm.client.js'
import { buildSkillExecTools, createGeneratedDir } from './skill-exec.tools.js'

export const skillExecRouter = Router()

// Agent 循环上限
const MAX_TOOL_ROUNDS = 30
const MAX_CONCURRENT_SKILL_EXEC = Math.max(1, config.skillExecMaxConcurrency)

let activeSkillExecJobs = 0
const skillExecWaitQueue: Array<() => void> = []

async function acquireSkillExecSlot(): Promise<void> {
  if (activeSkillExecJobs < MAX_CONCURRENT_SKILL_EXEC) {
    activeSkillExecJobs += 1
    return
  }

  await new Promise<void>((resolve) => {
    skillExecWaitQueue.push(resolve)
  })
  activeSkillExecJobs += 1
}

function releaseSkillExecSlot(): void {
  activeSkillExecJobs = Math.max(0, activeSkillExecJobs - 1)
  const next = skillExecWaitQueue.shift()
  if (next) next()
}

/**
 * 加载指定 skill 的 SKILL.md 内容
 */
async function loadSkillPrompt(skillId: string): Promise<string> {
  const id = skillId.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!id || id === '.' || id === '..' || id.includes('..')) {
    throw httpError(400, `无效的 skill_id: ${skillId}`)
  }

  const skillFile = path.join(config.dataDir, 'skills', id, 'SKILL.md')
  const stat = await fs.stat(skillFile).catch(() => null)
  if (!stat?.isFile()) {
    throw httpError(404, `Skill 不存在: ${id}`)
  }
  if (stat.size > 80_000) {
    throw httpError(400, `Skill 文件过大: ${id}`)
  }

  return fs.readFile(skillFile, 'utf-8')
}

/**
 * 构建运行时上下文（简化版，只包含时间信息）
 */
function buildRuntimeContext(): string {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const timeStr = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)
  const weekDay = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long',
  }).format(now)

  return `当前时间: ${dateStr} ${timeStr} ${weekDay}`
}

/**
 * 解析工具调用参数
 */
function parseArgs(value: string): unknown {
  if (!value.trim()) return {}
  return JSON.parse(value)
}

/**
 * 执行工具调用
 */
async function executeToolCalls(
  toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>,
  tools: Array<{ name: string; execute: (args: unknown) => Promise<unknown> }>,
): Promise<LLMConversationMessage[]> {
  const toolMap = new Map(tools.map((t) => [t.name, t]))
  const messages: LLMConversationMessage[] = []

  for (const toolCall of toolCalls) {
    const tool = toolMap.get(toolCall.function.name)
    if (!tool) {
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        name: toolCall.function.name,
        content: JSON.stringify({ ok: false, error: `未找到工具: ${toolCall.function.name}` }),
      })
      continue
    }

    try {
      const args = parseArgs(toolCall.function.arguments)
      const result = await tool.execute(args)
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        name: tool.name,
        content: JSON.stringify({ ok: true, data: result }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '工具调用失败'
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        name: tool.name,
        content: JSON.stringify({ ok: false, error: message }),
      })
    }
  }

  return messages
}

/**
 * 读取生成目录下的所有 .html 文件内容
 */
async function collectGeneratedHtml(generatedDir: string): Promise<{
  html: string
  files: string[]
}> {
  const files: string[] = []
  let html = ''

  try {
    const entries = await fs.readdir(generatedDir)
    for (const entry of entries) {
      const fullPath = path.join(generatedDir, entry)
      const stat = await fs.stat(fullPath)
      if (!stat.isFile()) continue

      const ext = path.extname(entry).toLowerCase()
      files.push(fullPath)

      // 读取第一个 .html 文件作为主内容返回
      if (ext === '.html' && !html) {
        html = await fs.readFile(fullPath, 'utf-8')
      }
    }
  } catch {
    // 目录可能不存在（LLM 没有创建文件）
  }

  return { html, files }
}

/**
 * POST /api/skill-exec
 *
 * 请求体: { skill_id: string, prompt: string }
 * 响应体: { ok: boolean, html: string, files_created: string[] }
 */
skillExecRouter.post('/', async (req: Request, res: Response) => {
  const { skill_id, prompt } = req.body as { skill_id?: string; prompt?: string }

  console.log('[skill-exec] 收到请求:', { skill_id, prompt: prompt?.substring(0, 100) })

  if (!skill_id || typeof skill_id !== 'string') {
    res.status(400).json({ error: '缺少 skill_id 参数' })
    return
  }
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: '缺少 prompt 参数' })
    return
  }

  await acquireSkillExecSlot()
  console.log(
    `[skill-exec] 并发状态: active=${activeSkillExecJobs}/${MAX_CONCURRENT_SKILL_EXEC}, queued=${skillExecWaitQueue.length}`,
  )

  try {
    // 加载 skill prompt
    console.log('[skill-exec] 加载 skill prompt:', skill_id)
    const skillBody = await loadSkillPrompt(skill_id)
    console.log('[skill-exec] skill prompt 加载成功，长度:', skillBody.length)

    // 获取 LLM 配置
    const settings = await getSettings()
    console.log('[skill-exec] LLM 配置:', { baseUrl: settings.llm.baseUrl, modelId: settings.llm.modelId, apiKeySet: !!settings.llm.apiKey })
    if (!settings.llm.baseUrl || !settings.llm.modelId || !settings.llm.apiKey) {
      res.status(400).json({ error: 'LLM 未配置，请在设置页配置 baseUrl/modelId/apiKey' })
      return
    }

    // 创建本次生成的独立目录
    const generatedDir = createGeneratedDir()
    console.log('[skill-exec] 生成目录:', generatedDir)
    await fs.mkdir(generatedDir, { recursive: true })

    // 构建受限工具
    const { tools, definitions } = buildSkillExecTools(generatedDir)
    console.log('[skill-exec] 受限工具已构建，工具数:', definitions.length)

    // 构建消息：skill prompt 作为 system prompt + 运行时时间 + 用户 prompt
    const messages: LLMConversationMessage[] = [
    {
      role: 'system',
      content: [
        skillBody,
        '',
        buildRuntimeContext(),
        '',
        '你是一个内容生成助手。请根据用户的要求，使用 skill_create_file 工具将生成的 HTML 内容写入文件。',
        '确保生成完整的、可独立运行的 HTML 文件（包含内联 CSS 和 JavaScript）。',
      ].join('\n'),
    },
    { role: 'user', content: prompt },
  ]

    console.log('[skill-exec] 开始 Agent 循环，最大轮次:', MAX_TOOL_ROUNDS)

    // Agent 循环：LLM 调用 → 工具执行 → 下一轮
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    console.log(`[skill-exec] 第 ${round + 1} 轮: 发送请求到 LLM...`)
    const response = await chatCompletion(settings.llm, messages, definitions)
    console.log(`[skill-exec] 第 ${round + 1} 轮: LLM 响应，toolCalls 数量: ${response.toolCalls.length}`)

    if (response.content) {
      console.log(`[skill-exec] 第 ${round + 1} 轮: LLM 文本回复:`, response.content.substring(0, 200))
    }

    // 构建助手消息（包含可能的工具调用）
    messages.push({
      role: 'assistant',
      content: response.content || '',
      ...(response.toolCalls.length > 0
        ? {
            toolCalls: response.toolCalls,
          }
        : {}),
    } as LLMConversationMessage)

    // 无工具调用 → LLM 回复完成
    if (response.toolCalls.length === 0) {
      console.log(`[skill-exec] 第 ${round + 1} 轮: LLM 无工具调用，结束循环`)
      break
    }

    // 打印将要执行的工具调用
    for (const tc of response.toolCalls) {
      console.log(`[skill-exec] 第 ${round + 1} 轮: 执行工具 ${tc.function.name}，参数:`, tc.function.arguments.substring(0, 200))
    }

    // 执行工具调用
    const toolMessages = await executeToolCalls(response.toolCalls, tools)
    console.log(`[skill-exec] 第 ${round + 1} 轮: 工具执行完成`)
    messages.push(...toolMessages)
  }

    // 收集生成的 HTML 文件
    console.log('[skill-exec] 收集生成的 HTML 文件，目录:', generatedDir)
    const { html, files: filesCreated } = await collectGeneratedHtml(generatedDir)
    console.log('[skill-exec] 收集完成，文件列表:', filesCreated, 'HTML 长度:', html.length)

    if (!html) {
      console.error('[skill-exec] 错误: LLM 未生成任何 HTML 文件')
      res.status(500).json({
        ok: false,
        error: 'LLM 未生成任何 HTML 文件',
        files_created: filesCreated,
      })
      return
    }

    console.log('[skill-exec] 返回成功，HTML 长度:', html.length)
    res.json({
      ok: true,
      html,
      files_created: filesCreated,
    })
  } finally {
    releaseSkillExecSlot()
  }
})

/**
 * POST /api/skill-exec/stream
 *
 * SSE 流式版本：每轮 LLM 回复或工具执行完成后，立即 yield 当前 HTML 进度。
 *
 * 请求体: { skill_id: string, prompt: string }
 * 响应: text/event-stream
 *   - delta: 当前轮次的文本回复
 *   - html_progress: 本轮工具执行后收集到的 HTML 片段
 *   - done: 全部完成，最终 HTML
 *   - error: 发生错误
 */
skillExecRouter.post('/stream', async (req: Request, res: Response) => {
  const { skill_id, prompt } = req.body as { skill_id?: string; prompt?: string }

  console.log('[skill-exec/stream] 收到请求:', { skill_id, prompt: prompt?.substring(0, 100) })

  if (!skill_id || typeof skill_id !== 'string') {
    res.status(400).json({ error: '缺少 skill_id 参数' })
    return
  }
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: '缺少 prompt 参数' })
    return
  }

  await acquireSkillExecSlot()
  console.log(
    `[skill-exec/stream] 并发状态: active=${activeSkillExecJobs}/${MAX_CONCURRENT_SKILL_EXEC}, queued=${skillExecWaitQueue.length}`,
  )

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    // 加载 skill prompt
    const skillBody = await loadSkillPrompt(skill_id)
    console.log('[skill-exec/stream] skill prompt 加载成功，长度:', skillBody.length)

    // 获取 LLM 配置
    const settings = await getSettings()
    if (!settings.llm.baseUrl || !settings.llm.modelId || !settings.llm.apiKey) {
      sendEvent({ type: 'error', error: 'LLM 未配置' })
      res.end()
      return
    }

    // 创建本次生成的独立目录
    const generatedDir = createGeneratedDir()
    await fs.mkdir(generatedDir, { recursive: true })

    // 构建受限工具
    const { tools, definitions } = buildSkillExecTools(generatedDir)

    // 构建消息
    const messages: LLMConversationMessage[] = [
      {
        role: 'system',
        content: [
          skillBody,
          '',
          buildRuntimeContext(),
          '',
          '你是一个内容生成助手。请根据用户的要求，使用 skill_create_file 工具将生成的 HTML 内容写入文件。',
          '确保生成完整的、可独立运行的 HTML 文件（包含内联 CSS 和 JavaScript）。',
        ].join('\n'),
      },
      { role: 'user', content: prompt },
    ]

    console.log('[skill-exec/stream] 开始 Agent 循环，最大轮次:', MAX_TOOL_ROUNDS)

    // Agent 循环：使用 chatCompletionStream 逐 token 流式推送
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      console.log(`[skill-exec/stream] 第 ${round + 1} 轮: 发送请求到 LLM...`)
      sendEvent({ type: 'round_start', round: round + 1, total_rounds: 0 })

      // 使用流式 LLM 调用，逐 token 推送到前端
      let response: { role: 'assistant'; content: string; toolCalls: any[] }
      try {
        const stream = chatCompletionStream(settings.llm, messages, definitions)
        let tokenCount = 0
        let lastFlush = ''
        let flushTimer: ReturnType<typeof setTimeout> | null = null

        // 批量刷新：收集 token，每 50ms 或遇到换行时一次性推送
        const flushBuffer = () => {
          if (lastFlush) {
            sendEvent({ type: 'delta', round: round + 1, content: lastFlush })
            lastFlush = ''
          }
          flushTimer = null
        }

        // for-await-of 消费流，结束后 generator 自动 return 完整结果
        let streamResult: IteratorResult<string, any> | undefined
        const iterator = stream[Symbol.asyncIterator]()
        while (true) {
          streamResult = await iterator.next()
          if (streamResult.done) break

          const chunk = streamResult.value
          tokenCount++
          lastFlush += chunk
          // 遇到换行符立即刷新，否则每 50ms 刷新一次
          if (chunk.includes('\n')) {
            if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
            flushBuffer()
          } else if (!flushTimer) {
            flushTimer = setTimeout(flushBuffer, 50)
          }
        }
        // 刷新剩余缓冲
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
        flushBuffer()

        // generator return 值是完整的 LLMAssistantMessage
        const finalResult = streamResult?.value
        if (finalResult && typeof finalResult === 'object' && 'toolCalls' in finalResult) {
          response = finalResult
        } else {
          response = { role: 'assistant' as const, content: '', toolCalls: [] }
        }
        console.log(`[skill-exec/stream] 第 ${round + 1} 轮: LLM 流式结束，token 数: ${tokenCount}，toolCalls 数量: ${response.toolCalls.length}`)
      } catch (err) {
        console.error(`[skill-exec/stream] 第 ${round + 1} 轮: LLM 流式错误:`, err)
        // 回退到非流式调用
        response = await chatCompletion(settings.llm, messages, definitions)
        if (response.content) {
          sendEvent({ type: 'delta', round: round + 1, content: response.content })
        }
        console.log(`[skill-exec/stream] 第 ${round + 1} 轮: 回退非流式，toolCalls 数量: ${response.toolCalls.length}`)
      }

      sendEvent({ type: 'round_end', round: round + 1 })

      // 构建助手消息
      messages.push({
        role: 'assistant',
        content: response.content || '',
        ...(response.toolCalls.length > 0
          ? { toolCalls: response.toolCalls }
          : {}),
      } as LLMConversationMessage)

      // 无工具调用 → LLM 回复完成
      if (response.toolCalls.length === 0) {
        console.log(`[skill-exec/stream] 第 ${round + 1} 轮: LLM 无工具调用，结束循环`)
        break
      }

      // 执行工具调用
      for (const tc of response.toolCalls) {
        console.log(`[skill-exec/stream] 第 ${round + 1} 轮: 执行工具 ${tc.function.name}`)
      }
      const toolMessages = await executeToolCalls(response.toolCalls, tools)
      messages.push(...toolMessages)

      // 工具执行完成后，收集当前 HTML 进度并推送
      const { html: htmlProgress } = await collectGeneratedHtml(generatedDir)
      if (htmlProgress) {
        sendEvent({ type: 'html_progress', round: round + 1, html: htmlProgress })
      }
    }

    // 最终收集
    const { html, files: filesCreated } = await collectGeneratedHtml(generatedDir)
    console.log('[skill-exec/stream] 完成，HTML 长度:', html.length)
    sendEvent({ type: 'done', html: html || '', files_created: filesCreated })
    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    console.error('[skill-exec/stream] 错误:', message)
    sendEvent({ type: 'error', error: message })
    res.end()
  } finally {
    releaseSkillExecSlot()
  }
})
