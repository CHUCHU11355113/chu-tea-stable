import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShoppingCart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { useCart } from '@/contexts/CartContext';
import { useTelegramContext } from '@/contexts/TelegramContext';
import { toast } from 'sonner';


interface ProductDetailModalProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedOption {
  itemId: number;
  name: string;
  price: string;
}

export function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { hapticFeedback } = useTelegramContext();

  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, SelectedOption>>({});
  const [selectedToppings, setSelectedToppings] = useState<Record<number, SelectedOption>>({});
  const [isAdding, setIsAdding] = useState(false);

  const { data: product } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: isOpen && productId > 0 }
  );

  const { data: options = [] } = trpc.product.getOptions.useQuery(
    { productId },
    { enabled: isOpen && productId > 0 }
  );

  // 按类型分组选项
  const sizeOptions = options.filter((o: any) => o.groupType === 'size');
  const tempOptions = options.filter((o: any) => o.groupType === 'other' && o.groupNameEn === 'Temperature');
  const sugarOptions = options.filter((o: any) => o.groupType === 'sugar');
  const toppingOptions = options.filter((o: any) => o.groupType === 'topping');

  // 初始化默认选项
  useEffect(() => {
    if (options.length > 0) {
      const defaults: Record<number, SelectedOption> = {};
      
      // 初始化非小料选项的默认值
      options.forEach((option: any) => {
        if (option.groupType === 'topping') return;
        
        const defaultItem = option.items?.find((i: any) => i.isDefault) || option.items?.[0];
        if (defaultItem) {
          defaults[option.id] = {
            itemId: defaultItem.id,
            name: getLocalizedText({ zh: defaultItem.nameZh, ru: defaultItem.nameRu, en: defaultItem.nameEn }),
            price: defaultItem.priceAdjust || '0',
          };
        }
      });
      
      setSelectedOptions(defaults);
      setSelectedToppings({}); // 小料默认不选
    }
  }, [options]);

  if (!isOpen || !product) return null;

  const name = getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn });
  
  // 计算总价
  const basePrice = parseFloat(product.basePrice);
  const optionsPrice = Object.values(selectedOptions).reduce((sum, opt) => sum + parseFloat(opt.price || '0'), 0);
  const toppingsPrice = Object.values(selectedToppings).reduce((sum, opt) => sum + parseFloat(opt.price || '0'), 0);
  const totalPrice = (basePrice + optionsPrice + toppingsPrice) * quantity;

  const handleOptionSelect = (optionId: number, item: any) => {
    hapticFeedback?.('impact', 'light');
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: {
        itemId: item.id,
        name: getLocalizedText({ zh: item.nameZh, ru: item.nameRu, en: item.nameEn }),
        price: item.priceAdjust || '0',
      },
    }));
  };

  const handleToppingToggle = (optionId: number, item: any) => {
    hapticFeedback?.('impact', 'light');
    
    // "无"选项的特殊处理
    if (item.nameEn === 'None' || item.nameZh === '无') {
      if (selectedToppings[optionId]?.itemId === item.id) {
        // 如果已选中"无"，取消选择
        setSelectedToppings({});
      } else {
        // 选中"无"，清空其他小料
        setSelectedToppings({
          [optionId]: {
            itemId: item.id,
            name: getLocalizedText({ zh: item.nameZh, ru: item.nameRu, en: item.nameEn }),
            price: '0',
          }
        });
      }
      return;
    }

    // 其他小料的多选处理
    setSelectedToppings(prev => {
      const newToppings = { ...prev };
      
      // 移除"无"选项（如果存在）
      const noneOption = Object.entries(newToppings).find(([_, opt]) => 
        parseFloat(opt.price) === 0
      );
      if (noneOption) {
        delete newToppings[parseInt(noneOption[0])];
      }
      
      // 切换当前小料
      const key = `${optionId}_${item.id}`;
      if (newToppings[key]) {
        delete newToppings[key];
      } else {
        newToppings[key] = {
          itemId: item.id,
          name: getLocalizedText({ zh: item.nameZh, ru: item.nameRu, en: item.nameEn }),
          price: item.priceAdjust || '0',
        };
      }
      
      return newToppings;
    });
  };

  const handleAddToCart = async (buyNow: boolean = false) => {
    setIsAdding(true);
    hapticFeedback?.('impact', 'medium');
    
    try {
      const allOptions = [
        ...Object.entries(selectedOptions).map(([optionId, opt]) => ({
          optionId: parseInt(optionId),
          itemId: opt.itemId,
          name: opt.name,
          price: opt.price,
        })),
        ...Object.entries(selectedToppings).map(([key, opt]) => {
          const optionId = parseInt(key.split('_')[0]);
          return {
            optionId,
            itemId: opt.itemId,
            name: opt.name,
            price: opt.price,
          };
        })
      ];

      await addToCart({
        productId: product.id,
        productName: name,
        productImage: product.image || '',
        basePrice: product.basePrice,
        quantity,
        options: allOptions,
      });

      toast.success(t('cart.addSuccess'));
      
      if (buyNow) {
        window.location.href = '/cart';
      }
      
      onClose();
      setQuantity(1);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(t('cart.addError'));
    } finally {
      setIsAdding(false);
    }
  };

  // 获取已选规格摘要
  const getSelectedSummary = () => {
    const selected = [
      ...Object.values(selectedOptions).map(opt => opt.name),
      ...Object.values(selectedToppings).map(opt => opt.name)
    ];
    return selected.length > 0 ? selected.join('、') : '';
  };

  // 渲染选项组
  const renderOptionGroup = (groupOptions: any[], isTopping: boolean = false) => {
    if (groupOptions.length === 0) return null;

    const option = groupOptions[0];
    const optionName = getLocalizedText({ 
      zh: option.groupNameZh, 
      ru: option.groupNameRu, 
      en: option.groupNameEn 
    });

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2.5">{optionName}</h3>
        <div className="flex flex-wrap gap-2">
          {option.items?.map((item: any) => {
            const itemName = getLocalizedText({ 
              zh: item.nameZh, 
              ru: item.nameRu, 
              en: item.nameEn 
            });
            const priceAdjust = parseFloat(item.priceAdjust || '0');
            
            let isSelected = false;
            if (isTopping) {
              const key = `${option.id}_${item.id}`;
              isSelected = !!selectedToppings[key] || (
                Object.keys(selectedToppings).length === 0 && 
                (item.nameEn === 'None' || item.nameZh === '无')
              );
            } else {
              isSelected = selectedOptions[option.id]?.itemId === item.id;
            }

            return (
              <button
                key={item.id}
                onClick={() => isTopping ? handleToppingToggle(option.id, item) : handleOptionSelect(option.id, item)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all
                  ${isSelected 
                    ? 'bg-orange-50 border-orange-400 text-orange-600 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span>{itemName}</span>
                {priceAdjust > 0 && (
                  <span className="ml-1.5 text-orange-500 font-semibold">+¥{priceAdjust}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 - 居中显示 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 商品标题 */}
          <div className="relative px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold pr-10 leading-tight text-gray-900">{name}</h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 滚动内容区域 */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-5 py-4">
            {/* 第一行：杯型选择 */}
            {renderOptionGroup(sizeOptions)}
            
            {/* 第二行：温度选择 */}
            {renderOptionGroup(tempOptions)}
            
            {/* 第三行：糖度选择 */}
            {renderOptionGroup(sugarOptions)}
            
            {/* 第四行：小料选择 */}
            {renderOptionGroup(toppingOptions, true)}
          </div>

          {/* 底部固定栏 */}
          <div className="border-t border-gray-100 bg-white px-5 py-4">
            {/* 已选规格 */}
            {getSelectedSummary() && (
              <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                <span className="font-medium">已选规格：</span>{getSelectedSummary()}
              </div>
            )}
            
            {/* 价格和按钮 */}
            <div className="flex items-center gap-3">
              {/* 价格 */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-500">¥</span>
                <span className="text-2xl font-bold text-gray-900">{totalPrice.toFixed(2)}</span>
              </div>
              
              {/* 按钮组 */}
              <div className="flex-1 flex gap-2">
                {/* 加入购物车 - 绿色 */}
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={isAdding}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full font-medium text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>加入购物车</span>
                </button>
                
                {/* 直接购买 - 橙色 */}
                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={isAdding}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-3 rounded-full font-medium text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  直接购买
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
