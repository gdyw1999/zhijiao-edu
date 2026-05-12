import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  port: Number(process.env.PORT) || 10053,
  // skill-exec 最大并发数：
  // - 同时最多处理 N 个生成请求
  // - 超过后会进入服务端队列等待
  // - 可通过环境变量 SKILL_EXEC_MAX_CONCURRENCY 覆盖
  skillExecMaxConcurrency: Number(process.env.SKILL_EXEC_MAX_CONCURRENCY) || 5,
  dataDir: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(__dirname, '..', '..', 'data'),
}
