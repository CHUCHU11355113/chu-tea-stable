/**
 * 平台化配置服务
 * 提供统一的配置管理，支持缓存、类型安全访问和热重载
 */

import { getDb } from '../db';
import { systemConfigs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// 配置项分类
export type ConfigCategory = 
  | 'brand'      // 品牌设置
  | 'points'     // 积分系统
  | 'delivery'   // 配送设置
  | 'order'      // 订单设置
  | 'coupon'     // 优惠券设置
  | 'member'     // 会员设置
  | 'marketing'  // 营销设置
  | 'system';    // 系统设置

// 配置项类型
export type ConfigType = 'string' | 'number' | 'boolean' | 'json' | 'array';

// 配置项元数据
export interface ConfigMeta {
  key: string;
  category: ConfigCategory;
  name: string;
  description: string;
  type: ConfigType;
  defaultValue: any;
}

// 配置项完整数据
export interface ConfigItem extends ConfigMeta {
  value: any;
  updatedAt?: Date;
}

// 预定义的配置项元数据
export const CONFIG_DEFINITIONS: ConfigMeta[] = [
  // ==================== 品牌设置 ====================
  {
    key: 'brand.name',
    category: 'brand',
    name: '品牌名称',
    description: '显示在应用各处的品牌名称',
    type: 'string',
    defaultValue: 'CHU TEA',
  },
  {
    key: 'brand.slogan',
    category: 'brand',
    name: '品牌标语',
    description: '显示在首页的品牌标语',
    type: 'string',
    defaultValue: '品味生活，从一杯茶开始',
  },
  {
    key: 'brand.website',
    category: 'brand',
    name: '官方网站',
    description: '品牌官方网站地址',
    type: 'string',
    defaultValue: 'https://www.chutea.cc',
  },
  {
    key: 'brand.supportEmail',
    category: 'brand',
    name: '客服邮箱',
    description: '客户服务联系邮箱',
    type: 'string',
    defaultValue: 'support@chutea.cc',
  },
  {
    key: 'brand.supportPhone',
    category: 'brand',
    name: '客服电话',
    description: '客户服务联系电话',
    type: 'string',
    defaultValue: '+7 (XXX) XXX-XXXX',
  },

  // ==================== 积分系统 ====================
  {
    key: 'points.spendPerPoint',
    category: 'points',
    name: '消费积分比例',
    description: '消费多少卢布可获得1积分',
    type: 'number',
    defaultValue: 30,
  },
  {
    key: 'points.levelBonus',
    category: 'points',
    name: '会员等级积分加成',
    description: '各会员等级的积分加成比例（百分比）',
    type: 'json',
    defaultValue: {
      normal: 15,
      silver: 17,
      gold: 20,
      diamond: 25,
    },
  },
  {
    key: 'points.upgradeThreshold',
    category: 'points',
    name: '会员升级门槛',
    description: '累计消费达到多少卢布可升级到对应等级',
    type: 'json',
    defaultValue: {
      silver: 1000,
      gold: 5000,
      diamond: 10000,
    },
  },
  {
    key: 'points.maxRedeemPerOrder',
    category: 'points',
    name: '单笔订单最大抵扣比例',
    description: '单笔订单最多可使用积分抵扣的比例（百分比）',
    type: 'number',
    defaultValue: 50,
  },
  {
    key: 'points.pointsToRuble',
    category: 'points',
    name: '积分兑换比例',
    description: '多少积分可抵扣1卢布',
    type: 'number',
    defaultValue: 100,
  },

  // ==================== 配送设置 ====================
  {
    key: 'delivery.baseFee',
    category: 'delivery',
    name: '基础配送费',
    description: '默认配送费用（卢布）',
    type: 'number',
    defaultValue: 99,
  },
  {
    key: 'delivery.freeThreshold',
    category: 'delivery',
    name: '免配送费门槛',
    description: '订单满多少卢布免配送费',
    type: 'number',
    defaultValue: 500,
  },
  {
    key: 'delivery.maxDistance',
    category: 'delivery',
    name: '最大配送距离',
    description: '最大配送距离（米）',
    type: 'number',
    defaultValue: 5000,
  },
  {
    key: 'delivery.estimatedTime',
    category: 'delivery',
    name: '预计配送时间',
    description: '预计配送时间范围（分钟）',
    type: 'json',
    defaultValue: {
      min: 30,
      max: 60,
    },
  },

  // ==================== 订单设置 ====================
  {
    key: 'order.minAmount',
    category: 'order',
    name: '最低起送金额',
    description: '订单最低金额（卢布）',
    type: 'number',
    defaultValue: 100,
  },
  {
    key: 'order.autoCompleteMinutes',
    category: 'order',
    name: '订单自动完成时间',
    description: '订单送达后多少分钟自动标记为完成',
    type: 'number',
    defaultValue: 60,
  },
  {
    key: 'order.autoCancelMinutes',
    category: 'order',
    name: '未支付自动取消时间',
    description: '未支付订单多少分钟后自动取消',
    type: 'number',
    defaultValue: 30,
  },

  // ==================== 优惠券设置 ====================
  {
    key: 'coupon.newUserCouponId',
    category: 'coupon',
    name: '新用户优惠券',
    description: '新用户注册时自动发放的优惠券模板ID（0表示不发放）',
    type: 'number',
    defaultValue: 0,
  },
  {
    key: 'coupon.newUserCouponQuantity',
    category: 'coupon',
    name: '新用户优惠券数量',
    description: '新用户注册时发放的优惠券数量',
    type: 'number',
    defaultValue: 1,
  },
  {
    key: 'coupon.maxPerOrder',
    category: 'coupon',
    name: '单笔订单最多使用数量',
    description: '单笔订单最多可使用的优惠券数量',
    type: 'number',
    defaultValue: 1,
  },

  // ==================== 会员设置 ====================
  {
    key: 'member.birthdayPointsBonus',
    category: 'member',
    name: '生日积分奖励',
    description: '会员生日当天赠送的积分数量',
    type: 'number',
    defaultValue: 100,
  },
  {
    key: 'member.referralPoints',
    category: 'member',
    name: '推荐奖励积分',
    description: '成功推荐新用户后获得的积分',
    type: 'number',
    defaultValue: 200,
  },
  {
    key: 'member.refereePoints',
    category: 'member',
    name: '被推荐人积分',
    description: '被推荐的新用户获得的积分',
    type: 'number',
    defaultValue: 100,
  },

  // ==================== 营销设置 ====================
  {
    key: 'marketing.firstOrderPoints',
    category: 'marketing',
    name: '首单奖励积分',
    description: '用户完成首单后奖励的积分',
    type: 'number',
    defaultValue: 100,
  },
  {
    key: 'marketing.reviewPoints',
    category: 'marketing',
    name: '评价奖励积分',
    description: '用户完成订单评价后奖励的积分',
    type: 'number',
    defaultValue: 10,
  },

  // ==================== 系统设置 ====================
  {
    key: 'system.maintenanceMode',
    category: 'system',
    name: '维护模式',
    description: '开启后用户将看到维护提示页面',
    type: 'boolean',
    defaultValue: false,
  },
  {
    key: 'system.maintenanceMessage',
    category: 'system',
    name: '维护提示信息',
    description: '维护模式下显示的提示信息',
    type: 'string',
    defaultValue: '系统正在维护中，请稍后再试',
  },
  {
    key: 'system.defaultLanguage',
    category: 'system',
    name: '默认语言',
    description: '系统默认语言（zh/ru/en）',
    type: 'string',
    defaultValue: 'ru',
  },
];

// 配置缓存
let configCache: Map<string, any> = new Map();
let cacheInitialized = false;

/**
 * 初始化配置缓存
 */
export async function initConfigCache(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[ConfigService] Database not available, using default values');
    // 使用默认值初始化缓存
    CONFIG_DEFINITIONS.forEach(def => {
      configCache.set(def.key, def.defaultValue);
    });
    cacheInitialized = true;
    return;
  }

  try {
    const configs = await db.select().from(systemConfigs);
    
    // 首先加载所有默认值
    CONFIG_DEFINITIONS.forEach(def => {
      configCache.set(def.key, def.defaultValue);
    });
    
    // 然后用数据库中的值覆盖
    configs.forEach(config => {
      if (config.value) {
        try {
          const parsed = JSON.parse(config.value);
          configCache.set(config.key, parsed);
        } catch {
          configCache.set(config.key, config.value);
        }
      }
    });
    
    cacheInitialized = true;
    console.log(`[ConfigService] Loaded ${configs.length} configs from database`);
  } catch (error) {
    console.error('[ConfigService] Failed to load configs:', error);
    // 使用默认值
    CONFIG_DEFINITIONS.forEach(def => {
      configCache.set(def.key, def.defaultValue);
    });
    cacheInitialized = true;
  }
}

/**
 * 获取配置值（类型安全）
 */
export function getConfig<T>(key: string, defaultValue: T): T {
  if (!cacheInitialized) {
    // 如果缓存未初始化，返回默认值
    const def = CONFIG_DEFINITIONS.find(d => d.key === key);
    return (def?.defaultValue as T) ?? defaultValue;
  }
  
  const value = configCache.get(key);
  if (value === undefined) {
    return defaultValue;
  }
  
  return value as T;
}

/**
 * 获取配置值（异步，确保缓存已初始化）
 */
export async function getConfigAsync<T>(key: string, defaultValue: T): Promise<T> {
  if (!cacheInitialized) {
    await initConfigCache();
  }
  return getConfig(key, defaultValue);
}

/**
 * 更新配置值
 */
export async function setConfig(key: string, value: any): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  try {
    const [existing] = await db
      .select()
      .from(systemConfigs)
      .where(eq(systemConfigs.key, key))
      .limit(1);

    if (existing) {
      await db
        .update(systemConfigs)
        .set({ value: stringValue })
        .where(eq(systemConfigs.key, key));
    } else {
      // 查找配置定义
      const def = CONFIG_DEFINITIONS.find(d => d.key === key);
      await db.insert(systemConfigs).values({
        key,
        value: stringValue,
        descriptionZh: def?.name || key,
        descriptionRu: def?.name || key,
        descriptionEn: def?.name || key,
      });
    }

    // 更新缓存
    configCache.set(key, value);
    
    return true;
  } catch (error) {
    console.error(`[ConfigService] Failed to set config ${key}:`, error);
    return false;
  }
}

/**
 * 获取所有配置项（用于后台管理界面）
 */
export async function getAllConfigs(): Promise<ConfigItem[]> {
  if (!cacheInitialized) {
    await initConfigCache();
  }

  return CONFIG_DEFINITIONS.map(def => ({
    ...def,
    value: configCache.get(def.key) ?? def.defaultValue,
  }));
}

/**
 * 按分类获取配置项
 */
export async function getConfigsByCategory(category: ConfigCategory): Promise<ConfigItem[]> {
  const allConfigs = await getAllConfigs();
  return allConfigs.filter(c => c.category === category);
}

/**
 * 刷新配置缓存
 */
export async function refreshConfigCache(): Promise<void> {
  cacheInitialized = false;
  configCache.clear();
  await initConfigCache();
}

/**
 * 初始化默认配置到数据库
 */
export async function initDefaultConfigs(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const def of CONFIG_DEFINITIONS) {
    const [existing] = await db
      .select()
      .from(systemConfigs)
      .where(eq(systemConfigs.key, def.key))
      .limit(1);

    if (!existing) {
      const stringValue = typeof def.defaultValue === 'object' 
        ? JSON.stringify(def.defaultValue) 
        : String(def.defaultValue);
      
      await db.insert(systemConfigs).values({
        key: def.key,
        value: stringValue,
        descriptionZh: def.name,
        descriptionRu: def.name,
        descriptionEn: def.name,
      });
    }
  }

  console.log('[ConfigService] Default configs initialized');
}

// 导出分类名称映射
export const CATEGORY_NAMES: Record<ConfigCategory, { zh: string; ru: string; en: string }> = {
  brand: { zh: '品牌设置', ru: 'Настройки бренда', en: 'Brand Settings' },
  points: { zh: '积分系统', ru: 'Система баллов', en: 'Points System' },
  delivery: { zh: '配送设置', ru: 'Настройки доставки', en: 'Delivery Settings' },
  order: { zh: '订单设置', ru: 'Настройки заказа', en: 'Order Settings' },
  coupon: { zh: '优惠券设置', ru: 'Настройки купонов', en: 'Coupon Settings' },
  member: { zh: '会员设置', ru: 'Настройки членства', en: 'Member Settings' },
  marketing: { zh: '营销设置', ru: 'Маркетинговые настройки', en: 'Marketing Settings' },
  system: { zh: '系统设置', ru: 'Системные настройки', en: 'System Settings' },
};
