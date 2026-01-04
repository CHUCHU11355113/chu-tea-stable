/**
 * Chu Tea 前端页面冒烟测试脚本
 * 
 * 用途：快速验证前端关键页面是否能正常加载
 * 执行：npx tsx tests/smoke-test-frontend.ts
 * 
 * 注意：此脚本使用 HTTP 请求检查页面是否能正常返回，
 * 更深入的 E2E 测试建议使用 Playwright 或 Cypress。
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

// 页面检查辅助函数
async function checkPage(path: string, expectedContent?: string): Promise<{ ok: boolean; status: number; hasContent: boolean }> {
  const url = `${BASE_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    });
    
    const html = await response.text();
    const hasContent = expectedContent ? html.includes(expectedContent) : html.length > 0;
    
    return {
      ok: response.ok,
      status: response.status,
      hasContent,
    };
  } catch (error: any) {
    throw new Error(`请求失败: ${error.message}`);
  }
}

// ============================================
// 测试用例
// ============================================

async function testHomePage() {
  const testName = '首页加载';
  try {
    const result = await checkPage('/', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}, 内容检查: ${result.hasContent ? '通过' : '失败'}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testMenuPage() {
  const testName = '菜单页面加载 (/menu)';
  try {
    const result = await checkPage('/menu', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testCartPage() {
  const testName = '购物车页面加载 (/cart)';
  try {
    const result = await checkPage('/cart', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testMemberPage() {
  const testName = '会员中心页面加载 (/member)';
  try {
    const result = await checkPage('/member', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testAdminLoginPage() {
  const testName = '后台登录页面加载 (/admin/login)';
  try {
    const result = await checkPage('/admin/login', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testAdminDashboard() {
  const testName = '后台仪表盘页面加载 (/admin/dashboard)';
  try {
    const result = await checkPage('/admin/dashboard', '<div id="root">');
    if (result.ok && result.hasContent) {
      logSuccess(`${testName} (状态码: ${result.status})`);
    } else {
      throw new Error(`状态码: ${result.status}`);
    }
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testStaticAssets() {
  const testName = '静态资源加载检查';
  try {
    // 检查 manifest.json
    const manifestResult = await checkPage('/manifest.json');
    if (!manifestResult.ok) {
      throw new Error('manifest.json 加载失败');
    }
    
    logSuccess(`${testName} - manifest.json 正常`);
  } catch (error: any) {
    logFailure(testName, error.message);
  }
}

async function testServiceWorker() {
  const testName = 'Service Worker 加载检查';
  try {
    const swResult = await checkPage('/sw.js');
    if (swResult.ok) {
      logSuccess(`${testName} - sw.js 正常`);
    } else {
      throw new Error(`状态码: ${swResult.status}`);
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
  log(`${colors.blue}║          Chu Tea 前端页面冒烟测试                          ║${colors.reset}`);
  log(`${colors.blue}║                                                            ║${colors.reset}`);
  log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  log('');
  log(`${colors.yellow}目标服务器: ${BASE_URL}${colors.reset}`);
  
  // 用户端页面测试
  logSection('1. 用户端页面');
  await testHomePage();
  await testMenuPage();
  await testCartPage();
  await testMemberPage();
  
  // 后台页面测试
  logSection('2. 后台管理页面');
  await testAdminLoginPage();
  await testAdminDashboard();
  
  // 静态资源测试
  logSection('3. 静态资源');
  await testStaticAssets();
  await testServiceWorker();
  
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
    log(`${colors.red}║  ❌ 前端冒烟测试失败！请修复上述问题后再发布。             ║${colors.reset}`);
    log(`${colors.red}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    process.exit(1);
  } else {
    log(`${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.green}║  ✅ 所有前端冒烟测试通过！                                 ║${colors.reset}`);
    log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
    process.exit(0);
  }
}

// 执行测试
runSmokeTests().catch((error) => {
  console.error('冒烟测试执行失败:', error);
  process.exit(1);
});
