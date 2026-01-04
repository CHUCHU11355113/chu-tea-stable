import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Settings, 
  Store, 
  Truck, 
  ShoppingCart, 
  Ticket, 
  Users, 
  Megaphone, 
  Server,
  Save,
  RotateCcw,
  RefreshCw,
  Loader2,
  Award
} from "lucide-react";

// 分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  brand: <Store className="h-4 w-4" />,
  points: <Award className="h-4 w-4" />,
  delivery: <Truck className="h-4 w-4" />,
  order: <ShoppingCart className="h-4 w-4" />,
  coupon: <Ticket className="h-4 w-4" />,
  member: <Users className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  system: <Server className="h-4 w-4" />,
};

// 分类中文名称
const categoryNames: Record<string, string> = {
  brand: '品牌设置',
  points: '积分系统',
  delivery: '配送设置',
  order: '订单设置',
  coupon: '优惠券设置',
  member: '会员设置',
  marketing: '营销设置',
  system: '系统设置',
};

interface ConfigItem {
  key: string;
  category: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  defaultValue: any;
  value: any;
}

export default function SystemConfig() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("brand");
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  
  // 获取所有配置
  const { data: configData, isLoading, refetch } = trpc.config.list.useQuery();
  
  // 更新配置
  const updateMutation = trpc.config.update.useMutation({
    onSuccess: (data) => {
      toast.success(`配置 "${data.key}" 已保存`);
      // 清除编辑状态
      setEditedValues(prev => {
        const next = { ...prev };
        delete next[data.key];
        return next;
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
    onSettled: (_, __, variables) => {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
    },
  });
  
  // 重置配置
  const resetMutation = trpc.config.reset.useMutation({
    onSuccess: (data) => {
      toast.success(`配置 "${data.key}" 已重置为默认值`);
      setEditedValues(prev => {
        const next = { ...prev };
        delete next[data.key];
        return next;
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`重置失败: ${error.message}`);
    },
  });
  
  // 刷新缓存
  const refreshMutation = trpc.config.refresh.useMutation({
    onSuccess: () => {
      toast.success("配置缓存已刷新");
      refetch();
    },
    onError: (error) => {
      toast.error(`刷新失败: ${error.message}`);
    },
  });
  
  // 初始化默认配置
  const initMutation = trpc.config.initDefaults.useMutation({
    onSuccess: () => {
      toast.success("默认配置已初始化");
      refetch();
    },
    onError: (error) => {
      toast.error(`初始化失败: ${error.message}`);
    },
  });

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (key: string, currentValue: any) => {
    const value = editedValues[key] ?? currentValue;
    setSavingKeys(prev => new Set(prev).add(key));
    updateMutation.mutate({ key, value });
  };

  const handleReset = (key: string) => {
    resetMutation.mutate({ key });
  };

  const renderConfigInput = (config: ConfigItem) => {
    const currentValue = editedValues[config.key] ?? config.value;
    const hasChanges = editedValues[config.key] !== undefined;
    const isSaving = savingKeys.has(config.key);

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={currentValue}
                onCheckedChange={(checked) => handleValueChange(config.key, checked)}
                disabled={isSaving}
              />
              <span className="text-sm text-muted-foreground">
                {currentValue ? '已启用' : '已禁用'}
              </span>
            </div>
            <div className="flex space-x-2">
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={() => handleSave(config.key, config.value)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReset(config.key)}
                disabled={resetMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleValueChange(config.key, Number(e.target.value))}
              className="flex-1"
              disabled={isSaving}
            />
            <Button
              size="sm"
              onClick={() => handleSave(config.key, config.value)}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReset(config.key)}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        );

      case 'json':
        const jsonValue = typeof currentValue === 'object' 
          ? JSON.stringify(currentValue, null, 2) 
          : currentValue;
        return (
          <div className="space-y-2">
            <Textarea
              value={jsonValue}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleValueChange(config.key, parsed);
                } catch {
                  // 允许输入不完整的JSON
                  handleValueChange(config.key, e.target.value);
                }
              }}
              className="font-mono text-sm min-h-[100px]"
              disabled={isSaving}
            />
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                onClick={() => handleSave(config.key, config.value)}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReset(config.key)}
                disabled={resetMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default: // string
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={currentValue}
              onChange={(e) => handleValueChange(config.key, e.target.value)}
              className="flex-1"
              disabled={isSaving}
            />
            <Button
              size="sm"
              onClick={() => handleSave(config.key, config.value)}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReset(config.key)}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = configData ? Object.keys(configData) : [];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            系统配置
          </h1>
          <p className="text-muted-foreground mt-1">
            管理系统的各项配置参数，修改后即时生效
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            刷新缓存
          </Button>
          <Button
            variant="outline"
            onClick={() => initMutation.mutate()}
            disabled={initMutation.isPending}
          >
            {initMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            初始化默认配置
          </Button>
        </div>
      </div>

      {/* 配置标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="flex items-center gap-1 text-xs"
            >
              {categoryIcons[category]}
              <span className="hidden sm:inline">{categoryNames[category]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categoryData = configData?.[category];
          if (!categoryData) return null;

          return (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {categoryIcons[category]}
                    {categoryNames[category]}
                  </CardTitle>
                  <CardDescription>
                    配置{categoryNames[category]}相关的参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categoryData.items.map((config: ConfigItem) => (
                    <div key={config.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          {config.name}
                        </Label>
                        <span className="text-xs text-muted-foreground font-mono">
                          {config.key}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                      {renderConfigInput(config)}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
