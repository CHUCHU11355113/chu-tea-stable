import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  Users,
  Store,
  Settings,
  BarChart3,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { 
    icon: LayoutDashboard, 
    labelKey: "admin.nav.dashboard", 
    path: "/admin" 
  },
  { 
    icon: Package, 
    labelKey: "admin.nav.products.title",
    children: [
      { icon: Package, labelKey: "admin.nav.products.list", path: "/admin/products" },
      { icon: Settings, labelKey: "admin.nav.products.config", path: "/admin/product-config" },
      { icon: Settings, labelKey: "admin.nav.products.options", path: "/admin/product-management" },
    ]
  },
  { 
    icon: ShoppingCart, 
    labelKey: "admin.nav.orders.title",
    children: [
      { icon: ShoppingCart, labelKey: "admin.nav.orders.list", path: "/admin/orders" },
      { icon: BarChart3, labelKey: "admin.nav.orders.payments", path: "/admin/payments" },
    ]
  },
  { 
    icon: Megaphone, 
    labelKey: "admin.nav.marketing.title",
    children: [
      { icon: LayoutDashboard, labelKey: "admin.nav.marketing.dashboard", path: "/admin/marketing-dashboard" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.ads", path: "/admin/ads" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.coupons", path: "/admin/coupons" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.points", path: "/admin/points-rules" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.campaigns", path: "/admin/marketing" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.triggers", path: "/admin/marketing-triggers" },
      { icon: Megaphone, labelKey: "admin.nav.marketing.triggerTemplates", path: "/admin/trigger-templates" },
      { icon: BarChart3, labelKey: "admin.nav.marketing.abTest", path: "/admin/ab-test" },
      { icon: Users, labelKey: "admin.nav.marketing.influencer", path: "/admin/influencer-campaigns" },
      { icon: Users, labelKey: "admin.nav.marketing.influencerWithdrawals", path: "/admin/influencer-withdrawals" },
      { icon: BarChart3, labelKey: "admin.nav.marketing.influencerAnalytics", path: "/admin/influencer-analytics" },
    ]
  },
  { 
    icon: Users, 
    labelKey: "admin.nav.members.title",
    children: [
      { icon: Users, labelKey: "admin.nav.members.list", path: "/admin/users" },
      { icon: Users, labelKey: "admin.nav.members.tags", path: "/admin/member-tags" },
    ]
  },
  { 
    icon: Store, 
    labelKey: "admin.nav.stores.title",
    children: [
      { icon: Store, labelKey: "admin.nav.stores.list", path: "/admin/stores" },
      { icon: Settings, labelKey: "admin.nav.stores.delivery", path: "/admin/delivery-settings" },
    ]
  },
  { 
    icon: Settings, 
    labelKey: "admin.nav.system.title",
    children: [
      { icon: Settings, labelKey: "admin.nav.system.config", path: "/admin/system-config" },
      { icon: Settings, labelKey: "admin.nav.system.api", path: "/admin/api" },
      { icon: Settings, labelKey: "admin.nav.system.iiko", path: "/admin/iiko" },
      { icon: BarChart3, labelKey: "admin.nav.system.iikoMonitor", path: "/admin/iiko-monitor" },
      { icon: Settings, labelKey: "admin.nav.system.yookassa", path: "/admin/yookassa" },
      { icon: Settings, labelKey: "admin.nav.system.logs", path: "/admin/logs" },
      { icon: Settings, labelKey: "admin.nav.system.notifications", path: "/admin/notifications" },
    ]
  },
  { 
    icon: BarChart3, 
    labelKey: "admin.nav.analytics.title", 
    path: "/admin/analytics" 
  },
  { 
    icon: Wrench, 
    labelKey: "admin.nav.tools.title", 
    path: "/admin/tools" 
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const toggleMenu = (labelKey: string) => {
    setOpenMenus(prev => 
      prev.includes(labelKey) 
        ? prev.filter(key => key !== labelKey)
        : [...prev, labelKey]
    );
  };

  const isMenuOpen = (labelKey: string) => openMenus.includes(labelKey);

  const isPathActive = (path?: string, children?: NavItem[]) => {
    if (path) {
      return location === path || location.startsWith(path + "/");
    }
    if (children) {
      return children.some(child => child.path && (location === child.path || location.startsWith(child.path + "/")));
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-lg">CHU TEA</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path, item.children);
              
              // 如果有子菜单
              if (item.children && !collapsed) {
                const isOpen = isMenuOpen(item.labelKey);
                return (
                  <Collapsible
                    key={item.labelKey}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(item.labelKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                          isActive
                            ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate flex-1">
                          {t(item.labelKey)}
                        </span>
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "transform rotate-180"
                          )} 
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = child.path && (location === child.path || location.startsWith(child.path + "/"));
                        return (
                          <Link key={child.path} href={child.path!}>
                            <div
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isChildActive
                                  ? "bg-yellow-50 text-yellow-900 dark:bg-yellow-900/10 dark:text-yellow-400"
                                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
                              )}
                            >
                              <span className="text-sm truncate">
                                {t(child.labelKey)}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }
              
              // 没有子菜单的项目
              return (
                <Link key={item.path} href={item.path!}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">
                        {t(item.labelKey)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("admin.title")}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("zh")}>
                  中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ru")}>
                  Русский
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
                    <AvatarFallback>{user?.name?.[0] || "A"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.username || user?.openId}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("auth.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
