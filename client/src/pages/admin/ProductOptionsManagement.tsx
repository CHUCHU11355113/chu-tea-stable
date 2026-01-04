import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';

export default function ProductOptionsManagement() {
  const { t } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: options = [], refetch: refetchOptions } = trpc.product.getOptions.useQuery(
    { productId: selectedProductId! },
    { enabled: !!selectedProductId }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品选项配置</h1>
      </div>

      {/* 商品选择 */}
      <Card className="p-6">
        <Label>选择商品</Label>
        <Select
          value={selectedProductId?.toString()}
          onValueChange={(v) => setSelectedProductId(parseInt(v))}
        >
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="请选择商品" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product: any) => (
              <SelectItem key={product.id} value={product.id.toString()}>
                {product.nameZh} / {product.nameRu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* 选项列表 */}
      {selectedProductId && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">当前选项配置</h2>
          
          {options.length === 0 ? (
            <p className="text-gray-500">暂无选项配置</p>
          ) : (
            <div className="space-y-6">
              {options.map((option: any) => (
                <div key={option.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {option.groupNameZh} / {option.groupNameRu}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {option.groupType} | {option.isMultiple ? '多选' : '单选'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {option.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className={`p-2 border rounded ${
                          item.isDefault ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium">{item.nameZh}</div>
                        <div className="text-xs text-gray-500">{item.nameRu}</div>
                        {parseFloat(item.priceAdjust) > 0 && (
                          <div className="text-xs text-orange-500 mt-1">
                            +₽{item.priceAdjust}
                          </div>
                        )}
                        {item.isDefault && (
                          <div className="text-xs text-teal-600 mt-1">默认</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              添加新选项组
            </Button>
          </div>
        </Card>
      )}

      {/* 说明 */}
      <Card className="p-6 bg-blue-50">
        <h3 className="font-semibold mb-2">📖 使用说明</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• 杯型（size）：中杯、大杯等规格选择</li>
          <li>• 温度（other-Temperature）：冷的、热的</li>
          <li>• 糖度（sugar）：正常糖、少糖、半糖、无糖</li>
          <li>• 小料（topping）：珍珠、椰果、布丁等，支持多选</li>
          <li>• 价格调整：正数表示加价，0表示不加价</li>
          <li>• 默认选项：用户打开商品详情时自动选中</li>
        </ul>
      </Card>
    </div>
  );
}
