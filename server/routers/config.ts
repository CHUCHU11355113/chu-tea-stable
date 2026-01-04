/**
 * 平台化配置管理 API 路由
 */

import { z } from 'zod';
import { router, adminProcedure, publicProcedure } from '../_core/trpc';
import {
  getAllConfigs,
  getConfigsByCategory,
  getConfig,
  setConfig,
  refreshConfigCache,
  initDefaultConfigs,
  CONFIG_DEFINITIONS,
  CATEGORY_NAMES,
  type ConfigCategory,
  type ConfigItem,
} from '../services/configService';

export const configRouter = router({
  /**
   * 获取所有配置项（按分类分组）
   */
  list: adminProcedure.query(async () => {
    const configs = await getAllConfigs();
    
    // 按分类分组
    const grouped: Record<string, { name: typeof CATEGORY_NAMES[ConfigCategory]; items: ConfigItem[] }> = {};
    
    for (const config of configs) {
      if (!grouped[config.category]) {
        grouped[config.category] = {
          name: CATEGORY_NAMES[config.category as ConfigCategory],
          items: [],
        };
      }
      grouped[config.category].items.push(config);
    }
    
    return grouped;
  }),

  /**
   * 获取单个分类的配置项
   */
  getByCategory: adminProcedure
    .input(z.object({
      category: z.enum(['brand', 'points', 'delivery', 'order', 'coupon', 'member', 'marketing', 'system']),
    }))
    .query(async ({ input }) => {
      return await getConfigsByCategory(input.category);
    }),

  /**
   * 获取单个配置项
   */
  get: adminProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const def = CONFIG_DEFINITIONS.find(d => d.key === input.key);
      if (!def) {
        throw new Error(`Config key "${input.key}" not found`);
      }
      
      const value = getConfig(input.key, def.defaultValue);
      return {
        ...def,
        value,
      };
    }),

  /**
   * 更新配置项
   */
  update: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ input }) => {
      const def = CONFIG_DEFINITIONS.find(d => d.key === input.key);
      if (!def) {
        throw new Error(`Config key "${input.key}" not found`);
      }
      
      // 类型验证
      let parsedValue = input.value;
      
      switch (def.type) {
        case 'number':
          parsedValue = Number(input.value);
          if (isNaN(parsedValue)) {
            throw new Error(`Value for "${input.key}" must be a number`);
          }
          break;
        case 'boolean':
          parsedValue = Boolean(input.value);
          break;
        case 'json':
          if (typeof input.value === 'string') {
            try {
              parsedValue = JSON.parse(input.value);
            } catch {
              throw new Error(`Value for "${input.key}" must be valid JSON`);
            }
          }
          break;
        case 'array':
          if (!Array.isArray(input.value)) {
            throw new Error(`Value for "${input.key}" must be an array`);
          }
          break;
      }
      
      const success = await setConfig(input.key, parsedValue);
      if (!success) {
        throw new Error(`Failed to update config "${input.key}"`);
      }
      
      return { success: true, key: input.key, value: parsedValue };
    }),

  /**
   * 批量更新配置项
   */
  batchUpdate: adminProcedure
    .input(z.object({
      configs: z.array(z.object({
        key: z.string(),
        value: z.any(),
      })),
    }))
    .mutation(async ({ input }) => {
      const results: { key: string; success: boolean; error?: string }[] = [];
      
      for (const config of input.configs) {
        try {
          const def = CONFIG_DEFINITIONS.find(d => d.key === config.key);
          if (!def) {
            results.push({ key: config.key, success: false, error: 'Config not found' });
            continue;
          }
          
          const success = await setConfig(config.key, config.value);
          results.push({ key: config.key, success });
        } catch (error) {
          results.push({ key: config.key, success: false, error: String(error) });
        }
      }
      
      return { results };
    }),

  /**
   * 重置配置项为默认值
   */
  reset: adminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const def = CONFIG_DEFINITIONS.find(d => d.key === input.key);
      if (!def) {
        throw new Error(`Config key "${input.key}" not found`);
      }
      
      const success = await setConfig(input.key, def.defaultValue);
      return { success, key: input.key, value: def.defaultValue };
    }),

  /**
   * 刷新配置缓存
   */
  refresh: adminProcedure.mutation(async () => {
    await refreshConfigCache();
    return { success: true };
  }),

  /**
   * 初始化默认配置
   */
  initDefaults: adminProcedure.mutation(async () => {
    await initDefaultConfigs();
    return { success: true };
  }),

  /**
   * 获取配置分类列表
   */
  categories: adminProcedure.query(() => {
    return Object.entries(CATEGORY_NAMES).map(([key, name]) => ({
      key,
      ...name,
    }));
  }),

  /**
   * 公开API：获取前端需要的配置（如品牌信息）
   */
  public: publicProcedure.query(() => {
    return {
      brand: {
        name: getConfig('brand.name', 'CHU TEA'),
        slogan: getConfig('brand.slogan', '品味生活，从一杯茶开始'),
        website: getConfig('brand.website', 'https://www.chutea.cc'),
        supportEmail: getConfig('brand.supportEmail', 'support@chutea.cc'),
        supportPhone: getConfig('brand.supportPhone', '+7 (XXX) XXX-XXXX'),
      },
      delivery: {
        baseFee: getConfig('delivery.baseFee', 99),
        freeThreshold: getConfig('delivery.freeThreshold', 500),
        estimatedTime: getConfig('delivery.estimatedTime', { min: 30, max: 60 }),
      },
      order: {
        minAmount: getConfig('order.minAmount', 100),
      },
      system: {
        maintenanceMode: getConfig('system.maintenanceMode', false),
        maintenanceMessage: getConfig('system.maintenanceMessage', '系统正在维护中，请稍后再试'),
        defaultLanguage: getConfig('system.defaultLanguage', 'ru'),
      },
    };
  }),
});
