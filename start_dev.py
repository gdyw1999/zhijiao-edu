#!/usr/bin/env python3
"""
智教未来 - 跨平台开发环境启动脚本

使用方法:
    python start_dev.py
    python start_dev.py --help

特性:
    - 自动检测 Python/Node.js 环境
    - 自动创建虚拟环境并安装依赖
    - 自动检测端口占用
    - 从 .env 文件读取端口配置
"""

import subprocess
import sys
import os
import shutil
import signal
import time
from pathlib import Path

# 当前工作目录
CWD = Path.cwd()

# 默认配置
DEFAULT_BACKEND_PORT = 8000
DEFAULT_FRONTEND_PORT = 3000
BACKEND_DIR = CWD / "backend"
FRONTEND_DIR = CWD / "frontend"


# ==================== 终端颜色 ====================

class Color:
    """终端颜色常量"""
    RESET = "\033[0m"
    BRIGHT = "\033[1m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    RED = "\033[31m"
    CYAN = "\033[36m"


def log(msg: str, color: str = Color.RESET) -> None:
    """带颜色的日志输出"""
    print(f"{color}{msg}{Color.RESET}")


def separator() -> None:
    """打印分隔线"""
    log("═══════════════════════════════════════════════════════════", Color.CYAN)


# ==================== 环境检测 ====================

def check_command(cmd: str) -> bool:
    """检查命令是否可用"""
    return shutil.which(cmd) is not None


def check_port(port: int) -> bool:
    """检查端口是否被占用（Windows 用 netstat，Unix 用 lsof）"""
    if sys.platform == "win32":
        result = subprocess.run(
            f"netstat -ano | findstr :{port} ",
            shell=True, capture_output=True, text=True,
        )
    else:
        result = subprocess.run(
            f"lsof -i :{port} 2>/dev/null",
            shell=True, capture_output=True, text=True,
        )
    return bool(result.stdout.strip())


def get_python_cmd() -> str:
    """获取可用的 Python 命令（Windows 优先 python，Unix 优先 python3）"""
    candidates = ["python", "python3"] if sys.platform != "win32" else ["python", "python3"]
    for cmd in candidates:
        if check_command(cmd):
            return cmd
    raise RuntimeError("未找到 Python，请先安装 Python 3.8+")


def get_npm_cmd() -> str:
    """获取可用的 npm 命令（Windows 需要带 .cmd 后缀）"""
    return "npm.cmd" if sys.platform == "win32" else "npm"


# ==================== .env 配置加载 ====================

def load_env_file(env_path: Path) -> dict:
    """从 .env 文件加载配置（简易解析，提取键值对）"""
    config = {}
    if not env_path.exists():
        return config

    try:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            # 跳过注释和空行
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                # 去除首尾空格和引号
                value = value.strip().strip("\"'")
                config[key.strip()] = value
        log(f"  加载环境变量: {env_path}")
    except Exception as e:
        log(f"  读取环境文件失败: {env_path} ({e})", Color.YELLOW)

    return config


def build_config() -> dict:
    """构建运行配置，优先级: 环境变量 > .env 文件 > 默认值"""
    env_config = load_env_file(CWD / ".env")

    backend_port = int(
        os.environ.get("BACKEND_PORT", env_config.get("BACKEND_PORT", DEFAULT_BACKEND_PORT))
    )
    frontend_port = int(
        os.environ.get("FRONTEND_PORT", env_config.get("FRONTEND_PORT", DEFAULT_FRONTEND_PORT))
    )

    return {
        "backend_port": backend_port,
        "frontend_port": frontend_port,
        "backend_dir": BACKEND_DIR,
    }


# ==================== 依赖安装 ====================

def install_python_deps(backend_dir: Path) -> None:
    """检查并安装 Python 后端依赖（创建虚拟环境 + pip install）"""
    venv_dir = backend_dir / "venv"
    requirements = backend_dir / "requirements.txt"

    # 创建虚拟环境（如果不存在）
    if not venv_dir.exists():
        log("  创建 Python 虚拟环境...", Color.YELLOW)
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
        log("  虚拟环境创建完成", Color.GREEN)
    else:
        log("  Python 虚拟环境已存在", Color.GREEN)

    # 安装依赖
    if requirements.exists():
        # 根据平台确定 pip 路径
        if sys.platform == "win32":
            pip_path = venv_dir / "Scripts" / "pip.exe"
        else:
            pip_path = venv_dir / "bin" / "pip"

        # 如果 pip 可执行文件不存在，回退到 python -m pip
        if not pip_path.exists():
            python_path = (
                venv_dir / "Scripts" / "python.exe"
                if sys.platform == "win32"
                else venv_dir / "bin" / "python"
            )
            pip_cmd = [str(python_path), "-m", "pip", "install", "-r", str(requirements)]
        else:
            pip_cmd = [str(pip_path), "install", "-r", str(requirements)]

        log("  安装 Python 依赖...", Color.YELLOW)
        subprocess.run(pip_cmd, check=True)
        log("  Python 依赖安装完成", Color.GREEN)
    else:
        log("  未找到 requirements.txt，跳过依赖安装", Color.YELLOW)


def install_node_deps(frontend_dir: Path) -> None:
    """检查并安装前端 Node.js 依赖"""
    node_modules = frontend_dir / "node_modules"

    if not node_modules.exists():
        log("  安装前端依赖 (npm install)...", Color.YELLOW)
        subprocess.run([get_npm_cmd(), "install"], cwd=str(frontend_dir), check=True)
        log("  前端依赖安装完成", Color.GREEN)
    else:
        log("  前端依赖已安装", Color.GREEN)


# ==================== 服务启动 ====================

def start_backend(backend_dir: Path, port: int) -> subprocess.Popen:
    """启动 Python/FastAPI 后端服务（uvicorn --reload）"""
    # 自动检测模块路径
    if (backend_dir / "app" / "main.py").exists():
        module = "app.main:app"
    elif (backend_dir / "main.py").exists():
        module = "main:app"
    else:
        raise RuntimeError(f"在后端目录 {backend_dir} 中找不到 main.py")

    # 虚拟环境中的 uvicorn 路径
    if sys.platform == "win32":
        uvicorn_path = backend_dir / "venv" / "Scripts" / "uvicorn.exe"
    else:
        uvicorn_path = backend_dir / "venv" / "bin" / "uvicorn"

    cmd = [str(uvicorn_path), module, "--host", "0.0.0.0", "--port", str(port), "--reload"]

    log(f"  启动后端 (端口: {port})...", Color.CYAN)
    proc = subprocess.Popen(
        cmd, cwd=str(backend_dir),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )

    # 读取输出直到检测到启动成功标志
    for line in proc.stdout:
        print(f"  [后端] {line.rstrip()}")
        if "Uvicorn running" in line or "Application startup complete" in line:
            log("  后端启动成功!", Color.GREEN)
            return proc

    return proc


def start_frontend(frontend_dir: Path, port: int) -> subprocess.Popen:
    """启动 Next.js 前端开发服务器"""
    log(f"  启动前端 (端口: {port})...", Color.CYAN)
    proc = subprocess.Popen(
        [get_npm_cmd(), "run", "dev", "--", "--port", str(port)],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )

    # 读取输出直到检测到启动成功标志
    for line in proc.stdout:
        print(f"  [前端] {line.rstrip()}")
        if "localhost:" in line or "Local:" in line or "Ready" in line:
            log("  前端启动成功!", Color.GREEN)
            return proc

    return proc


# ==================== 主函数 ====================

def main() -> None:
    separator()
    log("  智教未来 - 开发环境启动工具", Color.BRIGHT)
    log(f"  操作系统: {sys.platform}", Color.CYAN)
    log(f"  工作目录: {CWD}", Color.CYAN)
    separator()
    print()

    # --help 参数处理
    if "--help" in sys.argv or "-h" in sys.argv:
        print("用法: python start_dev.py")
        print()
        print("选项:")
        print("  --help, -h    显示帮助信息")
        print()
        print("配置:")
        print("  通过 .env 文件或环境变量配置:")
        print("    BACKEND_PORT   后端端口 (默认: 8000)")
        print("    FRONTEND_PORT  前端端口 (默认: 3000)")
        return

    config = build_config()

    # 检查目录是否存在
    for name, dir_path in [("后端", config["backend_dir"]), ("前端", FRONTEND_DIR)]:
        if not dir_path.exists():
            log(f"  {name}目录不存在: {dir_path}", Color.RED)
            sys.exit(1)
    log("  项目结构检查通过", Color.GREEN)
    print()

    # 检查运行环境
    log("检查环境...", Color.CYAN)
    python_cmd = get_python_cmd()
    ver = subprocess.run([python_cmd, "--version"], capture_output=True, text=True)
    log(f"  {ver.stdout.strip()}", Color.GREEN)

    if not check_command("node"):
        log("  未找到 Node.js，请先安装 Node.js 18+", Color.RED)
        sys.exit(1)
    ver = subprocess.run(["node", "--version"], capture_output=True, text=True)
    log(f"  Node.js {ver.stdout.strip()}", Color.GREEN)
    print()

    # 检查并安装依赖
    log("检查依赖...", Color.CYAN)
    install_python_deps(config["backend_dir"])
    install_node_deps(FRONTEND_DIR)
    print()

    # 检查端口占用
    for name, port in [("后端", config["backend_port"]), ("前端", config["frontend_port"])]:
        if check_port(port):
            log(f"  端口 {port} 已被占用，{name}可能已在运行", Color.YELLOW)
    print()

    # 子进程引用列表，用于退出时清理
    processes: list[subprocess.Popen] = []

    def shutdown(signum=None, frame=None):
        """优雅关闭所有子进程"""
        print()
        log("正在停止服务...", Color.YELLOW)
        for proc in processes:
            proc.terminate()
        time.sleep(1)
        log("服务已停止", Color.GREEN)
        sys.exit(0)

    # 注册信号处理（Ctrl+C 优雅退出）
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # 启动后端
    try:
        backend_proc = start_backend(config["backend_dir"], config["backend_port"])
        processes.append(backend_proc)
    except Exception as e:
        log(f"  后端启动失败: {e}", Color.RED)
        sys.exit(1)

    # 等待后端就绪后再启动前端
    time.sleep(2)

    # 启动前端
    try:
        frontend_proc = start_frontend(FRONTEND_DIR, config["frontend_port"])
        processes.append(frontend_proc)
    except Exception as e:
        log(f"  前端启动失败: {e}", Color.RED)
        sys.exit(1)

    # 启动完成提示
    print()
    separator()
    log("  所有服务启动成功!", Color.GREEN)
    separator()
    print()
    log("访问地址:", Color.BRIGHT)
    log(f"  前端页面: http://localhost:{config['frontend_port']}", Color.CYAN)
    log(f"  后端 API: http://localhost:{config['backend_port']}/api/health", Color.CYAN)
    log(f"  API 文档: http://localhost:{config['backend_port']}/docs", Color.CYAN)
    print()
    log("按 Ctrl+C 停止所有服务", Color.YELLOW)

    # 持续监控子进程状态
    while True:
        for proc in processes:
            if proc.poll() is not None:
                # 子进程异常退出，输出剩余日志
                if proc.stdout:
                    for line in proc.stdout:
                        print(f"  [{proc.pid}] {line.rstrip()}")
        time.sleep(1)


if __name__ == "__main__":
    main()
