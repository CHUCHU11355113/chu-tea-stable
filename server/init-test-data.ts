/**
 * 初始化测试数据脚本
 * 为所有用户添加优惠券和积分
 */

import { getDb } from './db';
import { couponTemplates, userCoupons, users, pointsHistory } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export async function initTestData() {
  console.log('🚀 开始初始化测试数据...');
  
  const db = await getDb();
  
  if (!db) {
    console.error('❌ 数据库连接失败');
    return { success: false, message: '数据库连接失败' };
  }
  
  try {
    // 1. 创建满100减50优惠券模板
    const existingTemplate = await db.query.couponTemplates.findFirst({
      where: eq(couponTemplates.code, 'SAVE50'),
    });
    
    let templateId: number;
    
    if (!existingTemplate) {
      const [result] = await db.insert(couponTemplates).values({
        code: 'SAVE50',
        nameZh: '满100减50',
        nameRu: 'Скидка 50₽ при заказе от 100₽',
        nameEn: 'Save 50₽ on orders over 100₽',
        descriptionZh: '订单满100卢布立减50卢布',
        descriptionRu: 'Скидка 50 рублей при заказе от 100 рублей',
        descriptionEn: 'Get 50 rubles off on orders over 100 rubles',
        type: 'fixed',
        value: '50.00',
        minOrderAmount: '100.00',
        maxDiscount: '50.00',
        totalQuantity: -1,
        usedQuantity: 0,
        perUserLimit: 10,
        validDays: 30,
        isActive: true,
      });
      templateId = result.insertId;
      console.log('✅ 创建优惠券模板成功，ID:', templateId);
    } else {
      templateId = existingTemplate.id;
      console.log('ℹ️ 优惠券模板已存在，ID:', templateId);
    }
    
    // 2. 获取所有用户
    const allUsers = await db.query.users.findMany();
    console.log(`📊 找到 ${allUsers.length} 个用户`);
    
    let updatedCount = 0;
    
    for (const user of allUsers) {
      // 3. 为每个用户添加1000积分
      if (user.availablePoints < 1000) {
        await db.update(users)
          .set({
            availablePoints: sql`${users.availablePoints} + 1000`,
            totalPoints: sql`${users.totalPoints} + 1000`,
          })
          .where(eq(users.id, user.id));
        
        // 记录积分历史
        await db.insert(pointsHistory).values({
          userId: user.id,
          type: 'adjust',
          points: 1000,
          balance: user.availablePoints + 1000,
          descriptionZh: '系统赠送积分',
          descriptionRu: 'Системные бонусные баллы',
          descriptionEn: 'System bonus points',
        });
        
        console.log(`✅ 用户 ${user.id} 添加1000积分`);
      }
      
      // 4. 为每个用户添加10张优惠券
      const existingCoupons = await db.query.userCoupons.findMany({
        where: eq(userCoupons.userId, user.id),
      });
      
      const availableCoupons = existingCoupons.filter(
        (c: { status: string; templateId: number }) => c.status === 'available' && c.templateId === templateId
      );
      const couponsToAdd = Math.max(0, 10 - availableCoupons.length);
      
      if (couponsToAdd > 0) {
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 30);
        
        const couponsData = Array(couponsToAdd).fill(null).map(() => ({
          userId: user.id,
          templateId: templateId,
          status: 'available' as const,
          expireAt: expireAt,
        }));
        
        await db.insert(userCoupons).values(couponsData);
        console.log(`✅ 用户 ${user.id} 添加 ${couponsToAdd} 张优惠券`);
        updatedCount++;
      }
    }
    
    console.log('🎉 测试数据初始化完成！');
    return { success: true, message: `测试数据初始化完成，更新了 ${updatedCount} 个用户` };
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    return { success: false, message: String(error) };
  }
}
