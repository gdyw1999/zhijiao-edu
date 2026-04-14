#!/usr/bin/env node

/**
 * 智教未来 - 跨平台开发环境启动脚本
 *
 * 特性：
 *   - 自动使用当前工作目录
 *   - 从 .env 文件读取端口配置
 *   - 支持前端(Next.js)和后端(Python/FastAPI)
 *   - 支持自定义配置文件
 *
 * 使用方法:
 *   node start-dev.js
 */

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 当前工作目录
const CWD = process.cwd();

// 默认配置
const DEFAULT_CONFIG = {
  backend: {
    name: '后端',
    port: 8000,
    dir: './backend',
    type: 'python',  // 'python' 或 'node'
  },
  frontend: {
    name: '前端',
    port: 3000,
    dir: './frontend',
    type: 'node',
  },
};

// 颜色
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// ==================== 工具函数 ====================

function log(message, color = 'reset') {
  console.log(`${c[color]}${message}${c.reset}`);
}

function separator() {
  log('═══════════════════════════════════════════════════════════', 'cyan');
}

function checkCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin
      ? `netstat -ano | findstr ":${port} "`
      : `lsof -i :${port} 2>/dev/null || netstat -tuln 2>/dev/null | grep :${port}`;

    exec(cmd, (err, stdout) => {
      resolve(stdout && stdout.length > 0);
    });
  });
}

function checkDirectory(dir, name) {
  const fullPath = path.resolve(CWD, dir);

  if (!fs.existsSync(fullPath)) {
    log(`❌ ${name} 目录不存在: ${fullPath}`, 'red');
    return false;
  }

  return true;
}

function detectBackendType(dir) {
  const fullPath = path.resolve(CWD, dir);

  // 检查是否有 Python FastAPI 特征文件
  if (fs.existsSync(path.join(fullPath, 'app', 'main.py'))) {
    return 'python';
  }
  if (fs.existsSync(path.join(fullPath, 'main.py'))) {
    return 'python';
  }

  // 检查是否有 Node.js 特征文件
  if (fs.existsSync(path.join(fullPath, 'package.json'))) {
    return 'node';
  }

  // 默认假设为 Python
  return 'python';
}

function hasPythonEnvironment(dir) {
  const fullPath = path.resolve(CWD, dir);

  // 检查是否存在虚拟环境
  if (fs.existsSync(path.join(fullPath, 'venv'))) return true;
  if (fs.existsSync(path.join(fullPath, '.venv'))) return true;
  if (fs.existsSync(path.join(fullPath, 'env'))) return true;

  return false;
}

async function installDependencies(dir, name, type) {
  const fullPath = path.resolve(CWD, dir);

  if (type === 'python') {
    // Python 依赖安装
    log(`📦 正在检查 ${name} Python 依赖...`, 'yellow');

    // 检查是否有 requirements.txt
    const reqFile = path.join(fullPath, 'requirements.txt');
    if (!fs.existsSync(reqFile)) {
      log(`⚠️ ${name} 缺少 requirements.txt`, 'yellow');
      return;
    }

    // 检查 Python 版本
    try {
      const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
      log(`✅ Python 版本: ${pythonVersion}`, 'green');
    } catch (e) {
      try {
        const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
        log(`✅ Python 版本: ${pythonVersion}`, 'green');
      } catch (e2) {
        throw new Error('未找到 Python，请先安装 Python 3.8+');
      }
    }

    // 检查虚拟环境
    const venvPath = path.join(fullPath, 'venv');
    if (!fs.existsSync(venvPath)) {
      log(`📦 创建 Python 虚拟环境...`, 'yellow');
      try {
        execSync(`python -m venv venv`, { cwd: fullPath, stdio: 'inherit' });
      } catch (e) {
        try {
          execSync(`python3 -m venv venv`, { cwd: fullPath, stdio: 'inherit' });
        } catch (e2) {
          throw new Error('创建虚拟环境失败');
        }
      }
    }

    // 安装依赖
    log(`📦 安装 Python 依赖...`, 'yellow');
    const pipCmd = process.platform === 'win32' ? '.\\venv\\Scripts\\pip.exe' : './venv/bin/pip';
    execSync(`${pipCmd} install -r requirements.txt`, { cwd: fullPath, stdio: 'inherit' });

    log(`✅ ${name} Python 依赖安装完成`, 'green');

  } else {
    // Node.js 依赖安装
    log(`📦 正在安装 ${name} Node.js 依赖...`, 'yellow');

    return new Promise((resolve, reject) => {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const install = spawn(npmCmd, ['install'], {
        cwd: fullPath,
        stdio: 'inherit',
        shell: true,
      });

      install.on('close', (code) => {
        if (code === 0) {
          log(`✅ ${name} Node.js 依赖安装完成`, 'green');
          resolve();
        } else {
          reject(new Error(`${name} 依赖安装失败 (exit code: ${code})`));
        }
      });

      install.on('error', (err) => reject(err));
    });
  }
}

// ==================== 配置管理 ====================

function loadEnvFile(envPath) {
  const config = {};

  if (!fs.existsSync(envPath)) {
    return config;
  }

  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('#') || !line.trim()) continue;

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        config[key] = value;
      }
    }

    console.log(`✅ 加载环境变量: ${envPath}`);
  } catch (error) {
    console.warn(`⚠️  读取环境文件失败: ${envPath}`, error.message);
  }

  return config;
}

function buildConfig() {
  // 1. 加载 .env 文件
  const envConfig = loadEnvFile(path.join(CWD, '.env'));

  // 2. 环境变量优先级最高
  const env = { ...envConfig, ...process.env };

  // 3. 检测后端类型
  const backendDir = env.BACKEND_DIR || DEFAULT_CONFIG.backend.dir;
  const backendType = detectBackendType(backendDir);

  // 4. 构建最终配置
  const config = {
    backend: {
      name: '后端',
      port: parseInt(env.BACKEND_PORT, 10) || DEFAULT_CONFIG.backend.port,
      dir: backendDir,
      type: backendType,
    },
    frontend: {
      name: '前端',
      port: parseInt(env.FRONTEND_PORT, 10) || DEFAULT_CONFIG.frontend.port,
      dir: env.FRONTEND_DIR || DEFAULT_CONFIG.frontend.dir,
      type: 'node',
    },
  };

  return config;
}

// ==================== 启动服务 ====================

async function startService(config, serviceName) {
  const { name, port, dir, type } = config;
  const fullPath = path.resolve(CWD, dir);

  log(`🚀 正在启动 ${serviceName} (端口: ${port})...`, 'cyan');

  const isPortInUse = await checkPort(port);
  if (isPortInUse) {
    log(`⚠️ 端口 ${port} 已被占用，${serviceName} 可能已在运行`, 'yellow');
    return null;
  }

  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    let cmd, args;

    // 根据服务类型确定启动命令
    if (type === 'python') {
      // Python FastAPI 启动
      const pythonCmd = isWin ? '.\\venv\\Scripts\\python.exe' : './venv/bin/python';
      const uvicornCmd = isWin ? '.\\venv\\Scripts\\uvicorn.exe' : './venv/bin/uvicorn';

      // 检查是否有 main.py 在 app 目录下
      const appMainPath = path.join(fullPath, 'app', 'main.py');
      const rootMainPath = path.join(fullPath, 'main.py');

      let modulePath;
      if (fs.existsSync(appMainPath)) {
        modulePath = 'app.main:app';
      } else if (fs.existsSync(rootMainPath)) {
        modulePath = 'main:app';
      } else {
        reject(new Error('找不到 main.py 文件'));
        return;
      }

      cmd = uvicornCmd;
      args = [
        modulePath,
        '--host', '0.0.0.0',
        '--port', port.toString(),
        '--reload',  // 开发模式启用热重载
      ];
    } else {
      // Node.js 启动
      cmd = isWin ? 'npm.cmd' : 'npm';
      args = serviceName === '后端' ? ['start'] : ['run', 'dev'];
    }

    const proc = spawn(cmd, args, {
      cwd: fullPath,
      stdio: 'pipe',
      shell: isWin,
      detached: !isWin,
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error(`${serviceName} 启动超时`));
      }
    }, 30000);

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[${serviceName}] ${output.trim()}`);

      // Python FastAPI 启动检测
      if (type === 'python') {
        if (output.includes('Application startup complete') ||
            output.includes('Uvicorn running') ||
            output.includes('Waiting for application startup')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            log(`✅ ${serviceName} 启动成功！`, 'green');
            resolve(proc);
          }
        }
      } else {
        // Node.js 启动检测
        if (output.includes('listening') ||
            output.includes('已启动') ||
            output.includes('Ready') ||
            output.includes('Local:') ||
            output.includes('http://localhost')) {
          if (!started) {
            started = true;
            clearTimeout(timeout);
            log(`✅ ${serviceName} 启动成功！`, 'green');
            resolve(proc);
          }
        }
      }
    });

    proc.stderr.on('data', (data) => {
      console.error(`[${serviceName}] ${data.toString().trim()}`);
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on('close', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`${serviceName} 进程退出 (code: ${code})`));
      }
    });
  });
}

// ==================== 主函数 ====================

async function main() {
  separator();
  log('  智教未来 - 开发环境启动工具', 'bright');
  log(`  操作系统: ${os.platform()} ${os.arch()}`, 'cyan');
  log(`  工作目录: ${CWD}`, 'cyan');
  separator();
  log('');

  // 解析命令行参数
  const args = parseArgs();
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // 构建配置（从 .env 文件和环境变量）
  const config = buildConfig();

  log(`📂 后端目录: ${path.resolve(CWD, config.backend.dir)} (${config.backend.type})`, 'cyan');
  log(`📂 前端目录: ${path.resolve(CWD, config.frontend.dir)} (${config.frontend.type})`, 'cyan');
  log(`🔌 后端端口: ${config.backend.port}`, 'cyan');
  log(`🔌 前端端口: ${config.frontend.port}`, 'cyan');
  log('');

  try {
    // 检查环境
    log('🔍 检查环境...', 'cyan');

    // 检查 Node.js（前端必需）
    if (!checkCommand('node')) {
      throw new Error('未找到 Node.js，请先安装 Node.js (建议 v18+)');
    }
    log(`✅ Node.js 版本: ${process.version}`, 'green');

    // 根据后端类型检查对应环境
    if (config.backend.type === 'python') {
      // 检查 Python
      let pythonCmd = null;
      try {
        execSync('python --version', { stdio: 'ignore' });
        pythonCmd = 'python';
      } catch (e) {
        try {
          execSync('python3 --version', { stdio: 'ignore' });
          pythonCmd = 'python3';
        } catch (e2) {
          throw new Error('未找到 Python，请先安装 Python 3.8+');
        }
      }

      const pythonVersion = execSync(`${pythonCmd} --version`, { encoding: 'utf-8' }).trim();
      log(`✅ ${pythonVersion}`, 'green');

      // 检查 pip
      try {
        const pipVersion = execSync(`${pythonCmd} -m pip --version`, { encoding: 'utf-8' }).trim();
        log(`✅ pip 已安装`, 'green');
      } catch (e) {
        log(`⚠️  pip 未安装或不可用`, 'yellow');
      }

    } else {
      // Node.js 后端
      if (!checkCommand('npm')) {
        throw new Error('未找到 npm，请确保 npm 已正确安装');
      }
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
        log(`✅ npm 版本: ${npmVersion}`, 'green');
      } catch (e) {
        log(`⚠️ 无法获取 npm 版本`, 'yellow');
      }
    }

    log('');

    // 检查目录
    log('🔍 检查项目结构...', 'cyan');
    if (!checkDirectory(config.backend.dir, '后端')) process.exit(1);
    if (!checkDirectory(config.frontend.dir, '前端')) process.exit(1);
    log('✅ 项目结构检查通过', 'green');
    log('');

    // 检查并安装依赖
    log('🔍 检查依赖...', 'cyan');

    // 后端依赖
    if (config.backend.type === 'python') {
      const venvPath = path.resolve(CWD, config.backend.dir, 'venv');
      if (!fs.existsSync(venvPath)) {
        await installDependencies(config.backend.dir, '后端', 'python');
      } else {
        log('✅ 后端 Python 虚拟环境已存在', 'green');
      }
    } else {
      if (!fs.existsSync(path.resolve(CWD, config.backend.dir, 'node_modules'))) {
        await installDependencies(config.backend.dir, '后端', 'node');
      } else {
        log('✅ 后端 Node.js 依赖已安装', 'green');
      }
    }

    // 前端依赖
    if (!fs.existsSync(path.resolve(CWD, config.frontend.dir, 'node_modules'))) {
      await installDependencies(config.frontend.dir, '前端', 'node');
    } else {
      log('✅ 前端依赖已安装', 'green');
    }

    log('');

    // 创建服务配置
    const backendServiceConfig = {
      name: '后端',
      port: config.backend.port,
      dir: config.backend.dir,
      type: config.backend.type,
    };

    const frontendServiceConfig = {
      name: '前端',
      port: config.frontend.port,
      dir: config.frontend.dir,
      type: 'node',
    };

    // 启动服务
    log('🚀 开始启动服务...', 'bright');
    log('');

    // 启动后端
    const backendProc = await startService(backendServiceConfig, '后端');

    // 等待一下确保后端启动
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 启动前端
    const frontendProc = await startService(frontendServiceConfig, '前端');

    // 启动完成
    log('');
    separator();
    log('  ✅ 所有服务启动成功！', 'green');
    separator();
    log('');
    log('📱 访问地址:', 'bright');
    log(`   前端页面: http://localhost:${config.frontend.port}`, 'cyan');
    log(`   后端 API: http://localhost:${config.backend.port}/api/health`, 'cyan');
    log('');
    log('⌨️  快捷键:', 'bright');
    log('   Ctrl+C 停止所有服务', 'yellow');
    log('');

    // 保持进程运行
    process.stdin.resume();

    // 优雅退出
    const shutdown = () => {
      log('', 'reset');
      log('');
      log('🛑 正在停止服务...', 'yellow');

      if (backendProc) backendProc.kill();
      if (frontendProc) frontendProc.kill();

      setTimeout(() => {
        log('👋 服务已停止', 'green');
        process.exit(0);
      }, 1000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    log('', 'reset');
    log('');
    log('❌ 启动失败:', 'red');
    log('   ' + error.message, 'red');
    log('');
    log('💡 可能的解决方案:', 'yellow');
    log('   1. 确保已安装 Node.js (建议 v18+)', 'yellow');
    if (config.backend.type === 'python') {
      log('   2. 确保已安装 Python 3.8+', 'yellow');
    }
    log('   3. 确保端口未被占用', 'yellow');
    log('   4. 检查 backend/ 和 frontend/ 目录是否存在', 'yellow');
    log('');
    process.exit(1);
  }
}

// 运行主函数
main();
