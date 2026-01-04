import { eq, and, inArray, desc } from "drizzle-orm";
import { getDb } from "./db";
import { orders, orderItems, products } from "../drizzle/schema";

/**
 * 获取TV显示屏需要显示的订单
 * 包括：preparing（准备中）和 ready（可取餐）状态的订单
 */
export async function getTVDisplayOrders() {
  const db = await getDb();
  if (!db) return [];

  try {
    // 查询准备中和可取餐的订单
    const displayOrders = await db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        pickupCode: orders.pickupCode,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['preparing', 'ready']),
          eq(orders.orderType, 'tea') // 只显示奶茶订单
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(50); // 最多显示50个订单

    // 获取每个订单的商品信息
    const ordersWithItems = await Promise.all(
      displayOrders.map(async (order) => {
        const items = await db
          .select({
            productSnapshot: orderItems.productSnapshot,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        // 从productSnapshot中提取商品名称
        const formattedItems = items.map(item => ({
          productName: item.productSnapshot?.name || '未知商品',
          quantity: item.quantity,
        }));

        return {
          ...order,
          items: formattedItems,
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error("[Database] Failed to get TV display orders:", error);
    return [];
  }
}

/**
 * 更新订单状态（用于管理后台）
 */
export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(orders)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update order status:", error);
    throw error;
  }
}
