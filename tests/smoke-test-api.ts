/**
 * Chu Tea 后端 API 冒烟测试脚本
 * 
 * 用途：快速验证后端核心 API 是否正常工作
 * 执行：npx tsx tests/smoke-test-api.ts
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 测试结果统计
let passed = 0;
let failed = 0;
const failures: { name: string; error: string }[] = [];

// 打印函数
function log(message: string) {
  console.log(message);
}

function logSuccess(testName: string) {
  passed++;
  log(`${colors.green}✓${colors.reset} ${testName}`);
}

function logFailure(testName: string, error: string) {
  failed++;
  failures.push({ name: testName, error });
  log(`${colors.red}✗${colors.reset} ${testName}`);
  log(`  ${colors.red}Error: ${error}${colors.reset}`);
}

function logSection(title: string) {
  log('');
  log(`${colors.cyan}━━━ ${title} ━━━${colors.reset}`);
}

// tRPC 请求辅助函数
async function trpcQuery(path: string, input?: any): Promise<any> {
  const url = new URL(`${BASE_URL}/trpc/${path}`);
  if (input) {
    url.searchParams.set('input', JSON.stringify(input));
  }
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  
  return data.result?.data;
}

// ============================================
// 测试用例
// ============================================

async function testServerHealth() {
  const testName = '服务器健康检查';
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      logSuccess(testName);
    } else {
      // 如果没有 /api/health 端点，尝试访问根路径
      const rootResponse = await fetch(BASE_URL);
      if (rootResponse.ok) {
        logSuccess(testName + ' (via root)');
      } else {
        throw new Error(`Status: ${rootResponse.status}`);
      }
    }
  } catch (error: any) {
    // 尝试通过 tRPC 检查
    try {
      await trpcQuery('store.list');
      logSuccess(testName + ' (via tRPC)');
    } catch (e: any) {
      logFailure(testName, error.message);
    }
  }
}

async function testStoreList() {
  const testName = '获取门店列表 (store.list)';
  try {
    const data = await trpcQuery('store.list');
    if (Array.isArray(data)) {
      logSuccess(`${testName} - 返回 ${data.length} 个门店`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testCategoryList() {
  const testName = '获取分类列表 (category.list)';
  try {
    const data = await trpcQuery('category.list');
    if (Array.isArray(data)) {
      logSuccess(`${testName} - 返回 ${data.length} 个分类`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testProductList() {
  const testName = '获取商品列表 (product.list)';
  try {
    const data = await trpcQuery('product.list');
    if (Array.isArray(data)) {
      logSuccess(`${testName} - 返回 ${data.length} 个商品`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testConfigPublic() {
  const testName = '获取公开配置 (config.public)';
  try {
    const data = await trpcQuery('config.public');
    if (data && data.brand && data.brand.name) {
      logSuccess(`${testName} - 品牌名称: ${data.brand.name}`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testAuthMe() {
  const testName = '用户认证检查 (auth.me)';
  try {
    const data = await trpcQuery('auth.me');
    // 未登录时返回 null 是正常的
    if (data === null || (data && typeof data === 'object')) {
      logSuccess(`${testName} - ${data ? '已登录' : '未登录状态'}`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testOrderTvDisplay() {
  const testName = '获取TV显示订单 (order.tvDisplay)';
  try {
    const data = await trpcQuery('order.tvDisplay');
    if (data && typeof data === 'object') {
      logSuccess(`${testName} - 数据获取成功`);
    } else {
      throw new Error('返回数据格式不正确');
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

// ============================================
// 主函数
// ============================================

async function runSmokeTests() {
  log('');
  log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.blue}║                                                            ║${colors.reset}`);
  log(`${colors.blue}║          Chu Tea 后端 API 冒烟测试                         ║${colors.reset}`);
  log(`${colors.blue}║                                                            ║${colors.reset}`);
  log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  log('');
  log(`${colors.yellow}目标服务器: ${BASE_URL}${colors.reset}`);
  
  // 服务状态测试
  logSection('1. 服务状态');
  await testServerHealth();
  
  // 公开 API 测试
  logSection('2. 公开 API');
  await testStoreList();
  await testCategoryList();
  await testProductList();
  await testConfigPublic();
  
  // 认证相关测试
  logSection('3. 认证相关');
  await testAuthMe();
  
  // 其他公开接口
  logSection('4. 其他公开接口');
  await testOrderTvDisplay();
  
  // 输出测试结果摘要
  log('');
  log(`${colors.cyan}━━━ 测试结果摘要 ━━━${colors.reset}`);
  log('');
  log(`  ${colors.green}通过: ${passed}${colors.reset}`);
  log(`  ${colors.red}失败: ${failed}${colors.reset}`);
  log('');
  
  if (failures.length > 0) {
    log(`${colors.red}失败的测试用例:${colors.reset}`);
    failures.forEach((f, i) => {
      log(`  ${i + 1}. ${f.name}`);
      log(`     ${colors.red}${f.error}${colors.reset}`);
    });
    log('');
  }
  
  if (failed > 0) {
    log(`${colors.red}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.red}║  ❌ 冒烟测试失败！请修复上述问题后再发布。                 ║${colors.reset}`);
    log(`${colors.red}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    process.exit(1);
  } else {
    log(`${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.green}║  ✅ 所有冒烟测试通过！可以继续发布流程。                   ║${colors.reset}`);
    log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    process.exit(0);
  }
}

// 执行测试
runSmokeTests().catch((error) => {
  console.error('冒烟测试执行失败:', error);
  process.exit(1);
});
