import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';
import { useTranslation } from 'react-i18next';

interface OrderDisplay {
  id: number;
  orderNo: string;
  pickupCode: string;
  status: 'preparing' | 'ready';
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  createdAt: string;
}

export default function TVDisplay() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 查询准备中和可取餐的订单
  const { data, refetch } = trpc.order.tvDisplay.useQuery(undefined, {
    refetchInterval: 5000, // 每5秒刷新一次
  });

  useEffect(() => {
    if (data) {
      setOrders(data);
    }
  }, [data]);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      {/* 顶部标题栏 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🍵</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">CHU TEA</h1>
              <p className="text-gray-500 text-lg">{t('tv.orderDisplay')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">
              {currentTime.toLocaleTimeString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
            </div>
            <div className="text-gray-500">
              {currentTime.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* 准备中区域 */}
        <div>
          <div className="bg-yellow-100 rounded-2xl p-6 mb-4">
            <h2 className="text-3xl font-bold text-yellow-800 flex items-center gap-3">
              <span>⏳</span>
              {t('tv.preparing')}
              <span className="ml-auto bg-yellow-200 px-4 py-2 rounded-full text-2xl">
                {preparingOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {preparingOrders.map((order) => (
              <OrderCard key={order.id} order={order} status="preparing" />
            ))}
            {preparingOrders.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xl">
                {t('tv.noPreparingOrders')}
              </div>
            )}
          </div>
        </div>

        {/* 可取餐区域 */}
        <div>
          <div className="bg-green-100 rounded-2xl p-6 mb-4">
            <h2 className="text-3xl font-bold text-green-800 flex items-center gap-3">
              <span>✅</span>
              {t('tv.ready')}
              <span className="ml-auto bg-green-200 px-4 py-2 rounded-full text-2xl">
                {readyOrders.length}
              </span>
            </h2>
          </div>
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} order={order} status="ready" />
            ))}
            {readyOrders.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xl">
                {t('tv.noReadyOrders')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, status }: { order: OrderDisplay; status: 'preparing' | 'ready' }) {
  const { t } = useTranslation();
  const isReady = status === 'ready';

  return (
    <div
      className={`
        bg-white rounded-2xl p-6 shadow-lg border-4 transition-all
        ${isReady ? 'border-green-400 animate-pulse' : 'border-yellow-400'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">{t('tv.pickupCode')}</div>
          <div
            className={`
              text-6xl font-bold tracking-wider
              ${isReady ? 'text-green-600' : 'text-yellow-600'}
            `}
          >
            {order.pickupCode}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">{t('tv.orderNo')}</div>
          <div className="text-xl font-mono text-gray-700">{order.orderNo}</div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="text-sm text-gray-500 mb-2">{t('tv.items')}</div>
        <div className="space-y-1">
          {order.items.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between text-gray-700">
              <span>{item.productName}</span>
              <span className="font-semibold">×{item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-gray-400 text-sm">
              {t('tv.moreItems', { count: order.items.length - 3 })}
            </div>
          )}
        </div>
      </div>

      {isReady && (
        <div className="mt-4 bg-green-50 rounded-lg p-3 text-center">
          <span className="text-green-700 font-bold text-lg">
            🎉 {t('tv.readyForPickup')}
          </span>
        </div>
      )}
    </div>
  );
}
