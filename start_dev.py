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
import threading
from datetime import datetime
from pathlib import Path

# 当前工作目录
CWD = Path.cwd()

# 默认配置
DEFAULT_BACKEND_PORT = 8000
DEFAULT_FRONTEND_PORT = 3000
BACKEND_DIR = CWD / "backend"
FRONTEND_DIR = CWD / "frontend"
LOGS_DIR = CWD / "logs"


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


def get_port_pid(port: int) -> int | None:
    """获取占用指定端口的进程 PID（仅 LISTENING 状态），未占用返回 None"""
    if sys.platform == "win32":
        result = subprocess.run(
            f"netstat -ano | findstr :{port} | findstr LISTENING",
            shell=True, capture_output=True, text=True,
        )
    else:
        result = subprocess.run(
            f"lsof -i :{port} -sTCP:LISTEN -t 2>/dev/null",
            shell=True, capture_output=True, text=True,
        )
    if not result.stdout.strip():
        return None
    # 从输出中提取 PID（netstat 最后一列，lsof 整行就是 PID）
    parts = result.stdout.strip().split()
    return int(parts[-1]) if parts[-1].isdigit() else None


def kill_process(pid: int) -> bool:
    """终止指定 PID 的进程，成功返回 True"""
    if sys.platform == "win32":
        result = subprocess.run(
            f"taskkill /PID {pid} /F /T",
            shell=True, capture_output=True, text=True,
        )
        return result.returncode == 0
    else:
        import signal as sig
        try:
            os.kill(pid, sig.SIGTERM)
            return True
        except ProcessLookupError:
            return False


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
    """检查并安装 Python 后端依赖（仅在虚拟环境不存在时安装）"""
    venv_dir = backend_dir / "venv"
    requirements = backend_dir / "requirements.txt"

    # 虚拟环境已存在则跳过安装
    if venv_dir.exists():
        log("  Python 虚拟环境已存在，跳过依赖安装", Color.GREEN)
        return

    # 创建虚拟环境
    log("  创建 Python 虚拟环境...", Color.YELLOW)
    subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
    log("  虚拟环境创建完成", Color.GREEN)

    # 仅在首次创建时安装依赖
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

def stream_output_with_startup(proc: subprocess.Popen, prefix: str, success_patterns: list[str], log_file: Path | None = None) -> bool:
    """
    单一线程处理：读取输出直到检测到启动成功标志，然后继续读取输出日志
    同时将日志写入文件（如果提供了 log_file）
    返回 True 表示启动成功，False 表示失败
    """
    startup_ok = False
    # 打开日志文件（追加模式）
    fh = None
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        fh = open(log_file, "a", encoding="utf-8")
        fh.write(f"\n{'='*60}\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 启动 {prefix}\n{'='*60}\n")
        fh.flush()

    try:
        for line in proc.stdout:
            text = line.rstrip()
            print(f"  [{prefix}] {text}")
            # 写入日志文件
            if fh:
                fh.write(f"{text}\n")
                fh.flush()
            # 检测启动成功标志
            if not startup_ok:
                for pattern in success_patterns:
                    if pattern in line:
                        startup_ok = True
                        log(f"  {prefix}启动成功!", Color.GREEN)
                        break
    except ValueError:
        pass
    finally:
        if fh:
            fh.close()
    return startup_ok


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

    # 启动后台线程持续输出日志并检测启动成功
    success_patterns = ["Uvicorn running", "Application startup complete"]
    thread = threading.Thread(
        target=stream_output_with_startup,
        args=(proc, "后端", success_patterns, LOGS_DIR / "backend.log"),
        daemon=True
    )
    thread.start()

    # 等待最多 10 秒检测启动成功
    thread.join(timeout=10)

    # 检查进程是否还在运行
    if proc.poll() is not None:
        raise RuntimeError(f"后端进程异常退出，退出码: {proc.returncode}")

    return proc


def start_frontend(frontend_dir: Path, port: int) -> subprocess.Popen:
    """启动 Next.js 前端开发服务器"""
    log(f"  启动前端 (端口: {port})...", Color.CYAN)
    proc = subprocess.Popen(
        [get_npm_cmd(), "run", "dev", "--", "--port", str(port)],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )

    # 启动后台线程持续输出日志并检测启动成功
    success_patterns = ["localhost:", "Local:", "Ready"]
    thread = threading.Thread(
        target=stream_output_with_startup,
        args=(proc, "前端", success_patterns, LOGS_DIR / "frontend.log"),
        daemon=True
    )
    thread.start()

    # 等待最多 30 秒检测启动成功（Next.js 首次编译可能较慢）
    thread.join(timeout=30)

    # 检查进程是否还在运行
    if proc.poll() is not None:
        raise RuntimeError(f"前端进程异常退出，退出码: {proc.returncode}")

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

    # 检查端口占用，询问用户是否终止
    for name, port in [("后端", config["backend_port"]), ("前端", config["frontend_port"])]:
        pid = get_port_pid(port)
        if pid:
            log(f"  端口 {port} 被 PID {pid} 占用（{name}）", Color.YELLOW)
            response = input(f"  是否终止占用进程? (y/n): ")
            if response.lower() == 'y':
                kill_process(pid)
                time.sleep(1)
                if get_port_pid(port) is None:
                    log(f"  端口 {port} 已释放", Color.GREEN)
                else:
                    log(f"  端口 {port} 释放失败，请手动处理", Color.RED)
                    sys.exit(1)
            else:
                log(f"  用户取消启动", Color.YELLOW)
                sys.exit(0)
    print()

    # 子进程引用列表，用于退出时清理
    processes: list[subprocess.Popen] = []

    def shutdown(signum=None, frame=None):
        """优雅关闭所有子进程，超时后强制 kill"""
        print()
        log("正在停止服务...", Color.YELLOW)
        for proc in processes:
            proc.terminate()
        # 等待进程退出，超时 3 秒后强制 kill
        for _ in range(6):
            if all(p.poll() is not None for p in processes):
                break
            time.sleep(0.5)
        # 仍有未退出的进程，强制 kill
        for proc in processes:
            if proc.poll() is None:
                proc.kill()
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
