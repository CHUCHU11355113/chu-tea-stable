import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from "sonner";
import { Gift, Coins, UserPlus, Loader2, RefreshCw } from "lucide-react";

export default function AdminTools() {
  const { t } = useTranslation();
  
  // 批量发放优惠券给所有用户
  const [couponId, setCouponId] = useState<string>("");
  const [couponQuantity, setCouponQuantity] = useState<number>(10);
  
  // 批量发放积分给所有用户
  const [pointsAmount, setPointsAmount] = useState<number>(1000);
  const [pointsReason, setPointsReason] = useState<string>("管理员发放");
  
  // 创建测试账号
  const [telegramId, setTelegramId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  
  // 获取优惠券模板列表
  const { data: couponTemplates } = trpc.adminCoupons.listTemplates.useQuery();
  
  // 初始化测试数据
  const initTestDataMutation = trpc.admin.initTestData.useMutation({
    onSuccess: () => {
      toast.success('✅ 测试数据初始化成功！');
    },
    onError: (error) => {
      toast.error('初始化失败: ' + error.message);
    },
  });
  
  // 批量发放优惠券给所有用户
  const issueAllUsersCouponsMutation = trpc.admin.issueAllUsersCoupons.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}`);
    },
    onError: (error) => {
      toast.error('发放失败: ' + error.message);
    },
  });
  
  // 批量发放积分给所有用户
  const issueAllUsersPointsMutation = trpc.admin.issueAllUsersPoints.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}`);
    },
    onError: (error) => {
      toast.error('发放失败: ' + error.message);
    },
  });
  
  // 创建测试账号
  const createTestAccountMutation = trpc.admin.createTestAccount.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}\nTelegram ID: ${data.user?.telegramId}`);
      setTelegramId("");
      setUsername("");
      setFirstName("");
      setLastName("");
    },
    onError: (error) => {
      toast.error('创建失败: ' + error.message);
    },
  });
  
  const handleInitTestData = () => {
    if (confirm('确定要初始化测试数据吗？\n这将创建示例优惠券、商品等数据。')) {
      initTestDataMutation.mutate();
    }
  };
  
  const handleIssueAllUsersCoupons = () => {
    if (!couponId) {
      toast.error('请选择优惠券模板');
      return;
    }
    if (confirm(`确定要为所有用户发放 ${couponQuantity} 张优惠券吗？`)) {
      issueAllUsersCouponsMutation.mutate({
        couponId: parseInt(couponId),
        quantity: couponQuantity,
      });
    }
  };
  
  const handleIssueAllUsersPoints = () => {
    if (confirm(`确定要为所有用户发放 ${pointsAmount} 积分吗？`)) {
      issueAllUsersPointsMutation.mutate({
        points: pointsAmount,
        reason: pointsReason,
      });
    }
  };
  
  const handleCreateTestAccount = () => {
    if (!telegramId.trim()) {
      toast.error('请输入Telegram ID');
      return;
    }
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (confirm(`确定要创建测试账号吗？\nTelegram ID: ${telegramId}\n用户名: ${username}`)) {
      createTestAccountMutation.mutate({
        telegramId,
        username,
        firstName,
        lastName,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理工具</h1>
        <p className="text-gray-500 mt-2">批量操作和测试数据管理工具</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* 初始化测试数据 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-purple-500" />
              <CardTitle>初始化测试数据</CardTitle>
            </div>
            <CardDescription>创建示例优惠券、商品等测试数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>将创建以下测试数据：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>示例优惠券模板</li>
                <li>示例商品</li>
                <li>示例分类</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleInitTestData} 
              disabled={initTestDataMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {initTestDataMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  初始化中...
                </>
              ) : (
                '初始化测试数据'
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* 批量发放优惠券 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-pink-500" />
              <CardTitle>批量发放优惠券</CardTitle>
            </div>
            <CardDescription>为所有用户发放指定优惠券</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>优惠券模板</Label>
              <Select value={couponId} onValueChange={setCouponId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择优惠券模板" />
                </SelectTrigger>
                <SelectContent>
                  {couponTemplates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} - {template.discountType === 'fixed' 
                        ? `减${template.discountValue}₽` 
                        : `${template.discountValue}折`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>每人发放数量</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={couponQuantity}
                onChange={(e) => setCouponQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <Button 
              onClick={handleIssueAllUsersCoupons} 
              disabled={issueAllUsersCouponsMutation.isPending}
              className="w-full"
            >
              {issueAllUsersCouponsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发放中...
                </>
              ) : (
                '发放优惠券'
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* 批量发放积分 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <CardTitle>批量发放积分</CardTitle>
            </div>
            <CardDescription>为所有用户发放指定积分</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>积分数量</Label>
              <Input
                type="number"
                min="1"
                max="10000"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>发放原因</Label>
              <Input
                type="text"
                placeholder="例如: 新年活动赠送"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleIssueAllUsersPoints} 
              disabled={issueAllUsersPointsMutation.isPending}
              className="w-full"
            >
              {issueAllUsersPointsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发放中...
                </>
              ) : (
                '发放积分'
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* 创建测试账号 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <CardTitle>创建测试账号</CardTitle>
            </div>
            <CardDescription>创建Telegram测试账号</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Telegram ID *</Label>
              <Input
                type="text"
                placeholder="例如: 123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>用户名 *</Label>
              <Input
                type="text"
                placeholder="例如: testuser001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>名字（可选）</Label>
              <Input
                type="text"
                placeholder="例如: Test"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>姓氏（可选）</Label>
              <Input
                type="text"
                placeholder="例如: User"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleCreateTestAccount} 
              disabled={createTestAccountMutation.isPending}
              className="w-full"
            >
              {createTestAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建测试账号'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>批量发放优惠券：</strong>选择优惠券模板和数量，为所有现有用户发放优惠券</p>
          <p><strong>批量发放积分：</strong>输入积分数量和原因，为所有现有用户增加积分</p>
          <p><strong>创建测试账号：</strong>创建一个Telegram测试用户，可以用于测试订单、支付等功能</p>
          <p className="text-red-600"><strong>注意：</strong>批量操作不可撤销，请谨慎操作！</p>
        </CardContent>
      </Card>
    </div>
  );
}
