#!/bin/bash
#===============================================================================
# Chu Tea 一键冒烟测试脚本
# 
# 用途：在本地构建后，快速验证系统核心功能是否正常
# 
# 使用方法：
#   chmod +x tests/smoke-test.sh
#   ./tests/smoke-test.sh
#
# 可选参数：
#   --api-only      只运行 API 测试
#   --frontend-only 只运行前端测试
#   --skip-build    跳过构建步骤
#   --port <port>   指定服务端口（默认 3000）
#===============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 默认配置
PORT=3000
RUN_API=true
RUN_FRONTEND=true
SKIP_BUILD=false
SERVER_PID=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-only)
      RUN_FRONTEND=false
      shift
      ;;
    --frontend-only)
      RUN_API=false
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      echo "未知参数: $1"
      exit 1
      ;;
  esac
done

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 打印函数
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                            ║${NC}"
    echo -e "${BLUE}║          Chu Tea 冒烟测试套件                              ║${NC}"
    echo -e "${BLUE}║                                                            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${CYAN}━━━ $1 ━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 清理函数
cleanup() {
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        echo ""
        print_warning "正在停止测试服务器 (PID: $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}

# 注册清理钩子
trap cleanup EXIT

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 等待服务器启动
wait_for_server() {
    local max_attempts=30
    local attempt=0
    
    echo -n "等待服务器启动"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
            echo ""
            print_success "服务器已启动"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo ""
    print_error "服务器启动超时"
    return 1
}

#===============================================================================
# 主流程
#===============================================================================

print_header

# 步骤 1: 检查环境
print_step "步骤 1/5: 检查环境"

if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    exit 1
fi
print_success "Node.js 版本: $(node -v)"

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm 未安装"
    exit 1
fi
print_success "pnpm 版本: $(pnpm -v)"

# 步骤 2: 构建项目
print_step "步骤 2/5: 构建项目"

if [ "$SKIP_BUILD" = true ]; then
    print_warning "跳过构建步骤 (--skip-build)"
else
    echo "正在构建项目..."
    if pnpm build > /tmp/build.log 2>&1; then
        print_success "项目构建成功"
    else
        print_error "项目构建失败"
        echo "构建日志:"
        cat /tmp/build.log
        exit 1
    fi
fi

# 检查构建产物
if [ ! -f "dist/index.js" ]; then
    print_error "构建产物不存在 (dist/index.js)"
    exit 1
fi
print_success "构建产物检查通过"

# 步骤 3: 启动测试服务器
print_step "步骤 3/5: 启动测试服务器"

if check_port; then
    print_warning "端口 $PORT 已被占用，将使用现有服务进行测试"
else
    echo "正在启动测试服务器 (端口: $PORT)..."
    
    # 启动服务器
    NODE_ENV=production PORT=$PORT node dist/index.js > /tmp/server.log 2>&1 &
    SERVER_PID=$!
    
    # 等待服务器启动
    if ! wait_for_server; then
        print_error "服务器启动失败"
        echo "服务器日志:"
        cat /tmp/server.log
        exit 1
    fi
fi

# 步骤 4: 运行冒烟测试
print_step "步骤 4/5: 运行冒烟测试"

API_TEST_RESULT=0
FRONTEND_TEST_RESULT=0

# 运行 API 测试
if [ "$RUN_API" = true ]; then
    echo ""
    echo -e "${YELLOW}▶ 运行后端 API 冒烟测试...${NC}"
    echo ""
    
    if API_URL="http://localhost:$PORT" npx tsx tests/smoke-test-api.ts; then
        API_TEST_RESULT=0
    else
        API_TEST_RESULT=1
    fi
fi

# 运行前端测试
if [ "$RUN_FRONTEND" = true ]; then
    echo ""
    echo -e "${YELLOW}▶ 运行前端页面冒烟测试...${NC}"
    echo ""
    
    if FRONTEND_URL="http://localhost:$PORT" npx tsx tests/smoke-test-frontend.ts; then
        FRONTEND_TEST_RESULT=0
    else
        FRONTEND_TEST_RESULT=1
    fi
fi

# 步骤 5: 输出最终结果
print_step "步骤 5/5: 测试结果汇总"

echo ""
echo "┌─────────────────────────────────────────┐"
echo "│           冒烟测试结果汇总              │"
echo "├─────────────────────────────────────────┤"

if [ "$RUN_API" = true ]; then
    if [ $API_TEST_RESULT -eq 0 ]; then
        echo -e "│  后端 API 测试:    ${GREEN}✓ 通过${NC}               │"
    else
        echo -e "│  后端 API 测试:    ${RED}✗ 失败${NC}               │"
    fi
fi

if [ "$RUN_FRONTEND" = true ]; then
    if [ $FRONTEND_TEST_RESULT -eq 0 ]; then
        echo -e "│  前端页面测试:     ${GREEN}✓ 通过${NC}               │"
    else
        echo -e "│  前端页面测试:     ${RED}✗ 失败${NC}               │"
    fi
fi

echo "└─────────────────────────────────────────┘"
echo ""

# 最终判定
if [ $API_TEST_RESULT -eq 0 ] && [ $FRONTEND_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}║  ✅ 所有冒烟测试通过！该版本可以继续发布流程。             ║${NC}"
    echo -e "${GREEN}║                                                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}║  ❌ 冒烟测试失败！请修复上述问题后再发布。                 ║${NC}"
    echo -e "${RED}║                                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
