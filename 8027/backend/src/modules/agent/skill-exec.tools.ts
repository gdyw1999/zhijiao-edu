/**
 * 1052 Skill 执行服务 - 受限工具集
 *
 * 仅暴露一个 skill_create_file 工具，用于在受限目录下创建文件。
 * 安全限制：
 * - 只允许写入 data/generated/{timestamp}/ 子目录
 * - 文件扩展名白名单：.html, .css, .js
 * - 自动 confirmed（路径已受限，无需用户确认）
 * - 单文件大小上限 2MB
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from '../../config.js'
import { HttpError } from '../../http-error.js'
import type { AgentTool } from './agent.tool.types.js'
import type { LLMToolDefinition } from './llm.client.js'

// 扩展名白名单
const ALLOWED_EXTENSIONS = new Set(['.html', '.css', '.js'])

// 单文件大小上限 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

/**
 * 为每次 skill 执行生成独立的输出目录
 * 格式：data/generated/{timestamp}/
 */
export function createGeneratedDir(): string {
  const requestId = randomUUID().replace(/-/g, '').slice(0, 12)
  const dir = path.join(config.dataDir, 'generated', `${Date.now()}-${requestId}`)
  return dir
}

/**
 * 验证目标路径是否在指定的生成目录内，且扩展名在白名单中
 */
function validateTarget(targetPath: string, generatedDir: string): void {
  const resolved = path.resolve(targetPath)
  const allowedDir = path.resolve(generatedDir)

  // 路径必须在生成目录内（防止路径遍历）
  const relative = path.relative(allowedDir, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new HttpError(400, `文件路径超出允许范围: 必须在 ${allowedDir} 目录内`)
  }

  // 扩展名白名单校验
  const ext = path.extname(resolved).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new HttpError(400, `不支持的文件类型: ${ext}，仅允许 ${[...ALLOWED_EXTENSIONS].join(', ')}`)
  }
}

/**
 * 构建受限工具列表（仅 skill_create_file）
 * @param generatedDir - 本次执行允许写入的目录
 */
export function buildSkillExecTools(generatedDir: string): {
  tools: AgentTool[]
  definitions: LLMToolDefinition[]
} {
  const tool: AgentTool = {
    name: 'skill_create_file',
    description:
      '创建一个新的 UTF-8 文本文件。文件将保存在本次生成的专属目录中，仅支持 .html/.css/.js 扩展名。',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文件名或相对路径（如 index.html 或 style.css）',
        },
        content: {
          type: 'string',
          description: '文件内容',
        },
      },
      required: ['path', 'content'],
      additionalProperties: false,
    },
    execute: async (args: unknown) => {
      const input = (args ?? {}) as Record<string, unknown>
      const rawPath = typeof input.path === 'string' ? input.path.trim() : ''
      const content = typeof input.content === 'string' ? input.content : ''

      if (!rawPath) throw new HttpError(400, '文件路径不能为空')

      // 拼接完整路径
      const target = path.isAbsolute(rawPath) ? rawPath : path.join(generatedDir, rawPath)

      // 安全校验
      validateTarget(target, generatedDir)

      // 内容大小校验
      const byteLength = Buffer.byteLength(content, 'utf-8')
      if (byteLength > MAX_FILE_SIZE) {
        throw new HttpError(
          400,
          `文件内容过大: ${Math.round(byteLength / 1024)}KB，上限 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        )
      }

      // 确保目录存在并写入文件
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, content, 'utf-8')

      const stat = await fs.stat(target)
      return {
        ok: true,
        path: target,
        size: stat.size,
      }
    },
  }

  const definition: LLMToolDefinition = {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }

  return { tools: [tool], definitions: [definition] }
}
