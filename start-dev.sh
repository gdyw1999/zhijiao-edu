#!/bin/bash
#
# 智教未来 - 开发环境启动脚本 (Linux/macOS)
#

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 运行 Node.js 脚本
exec node "${SCRIPT_DIR}/start-dev.js"
