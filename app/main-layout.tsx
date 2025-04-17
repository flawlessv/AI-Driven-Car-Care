/**
 * 这个文件定义了应用的主要布局结构（主要是仪表盘和其他需要登录的页面）
 * 它包含顶部导航栏、用户菜单和内容区域
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入Ant Design组件，这些是UI界面的基础构建块
import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
// 导入各种图标组件，用于菜单项和按钮
import {
  CarOutlined,  // 汽车图标
  ToolOutlined,  // 工具图标
  TeamOutlined,  // 团队/用户图标
  CalendarOutlined,  // 日历图标
  UserOutlined,  // 用户图标
  DashboardOutlined,  // 仪表盘图标
  HomeOutlined,  // 首页图标
} from '@ant-design/icons';
// 导入路由相关功能，用于页面导航
import { useRouter, usePathname } from 'next/navigation';
// 导入链接组件，用于创建页面跳转链接
import Link from 'next/link';
// 导入Redux选择器，用于从全局状态获取数据
import { useSelector } from 'react-redux';
// 导入根状态类型，定义了全局状态的结构
import type { RootState } from '@/app/lib/store';
// 导入用户权限相关的类型定义
import { MenuPermission, PermissionLevel } from '@/types/user';

// 从Layout组件中解构出Header和Content组件
const { Header, Content } = Layout;

/**
 * 菜单项配置数组
 * 每个菜单项包含：
 * - key: 唯一标识符
 * - icon: 显示的图标
 * - label: 显示的文本
 * - path: 点击后跳转的路径
 */
const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: '预约管理',
    path: '/dashboard/appointments',
  },
  {
    key: 'maintenance',
    icon: <ToolOutlined />,
    label: '保养维修',
    path: '/dashboard/maintenance',
  },
  {
    key: 'vehicles',
    icon: <CarOutlined />,
    label: '车辆管理',
    path: '/dashboard/vehicles',
  },
  {
    key: 'community',
    icon: <TeamOutlined />,
    label: '用户社区',
    path: '/dashboard/community',
  },
];

/**
 * 用户菜单配置数组（右上角的下拉菜单）
 * 包含回到首页和退出登录选项
 */
const userMenu = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '回到首页',
  },
  {
    key: 'logout',
    label: '退出登录',
  },
];

/**
 * MainLayout组件 - 定义应用的主要布局框架
 * 
 * @param {object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件，即页面的主要内容
 * @returns {JSX.Element} 返回布局框架结构
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  // 获取当前路径，用于确定哪个菜单项应该高亮显示
  const pathname = usePathname();
  // 从Redux状态中获取当前用户信息
  const { user } = useSelector((state: RootState) => state.auth);
  // 获取Ant Design主题令牌，包含颜色和圆角等样式信息
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 在控制台打印当前用户信息，用于调试
  console.log('Current user:', user);

  /**
   * 处理菜单点击事件
   * 当用户点击菜单项时，导航到对应的路径
   * 
   * @param {string} path - 要导航到的路径
   */
  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  /**
   * 处理用户菜单点击事件
   * 根据点击的菜单项执行不同的操作
   * 
   * @param {object} param - 参数对象
   * @param {string} param.key - 被点击的菜单项的键
   */
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'home':
        // 如果点击"回到首页"，导航到首页
        router.push('/');
        break;
      case 'logout':
        // 处理登出逻辑（这里只有注释，实际代码尚未实现）
        break;
    }
  };

  /**
   * 检查用户是否有权限访问特定菜单项
   * 
   * @param {string} menuKey - 菜单项的键
   * @returns {boolean} 如果用户有权限则返回true，否则返回false
   */
  const hasMenuPermission = (menuKey: string): boolean => {
    // 如果用户未登录，不显示任何菜单
    if (!user) {
      return false;
    }
    
    // 权限检查完全依赖permissions配置
    // 如果没有权限配置，则默认不显示菜单
    console.log('user.permissions', user.permissions);
    if (!user.permissions || user.permissions.length === 0) {
      return false;
    }
    
    // 查找菜单对应的权限
    const menuPermission = user.permissions.find(
      (p: MenuPermission) => p.menuKey === menuKey
    );
    
    // 如果没有找到对应的权限配置，或者权限级别为'none'，则没有权限
    return !!menuPermission && menuPermission.permission !== 'none';
  };

  // 根据用户权限过滤菜单项，只显示用户有权限访问的菜单
  const filteredMenuItems = menuItems.filter(item => hasMenuPermission(item.key));

  return (
    // Layout组件是整个页面的容器，最小高度设为100vh（整个视口高度）
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header组件是页面顶部的导航栏 */}
      <Header style={{ padding: 0, background: colorBgContainer }}>
        <div className="flex justify-between items-center px-4">
          {/* 左侧：系统名称和导航菜单 */}
          <div className="flex items-center">
            {/* 系统名称链接，点击后导航到仪表盘 */}
            <Link href="/dashboard" className="text-xl font-bold mr-8">
              佳伟汽车保养系统
            </Link>
            {/* 水平导航菜单，显示用户有权限的菜单项 */}
            <Menu
              mode="horizontal"
              selectedKeys={[pathname.split('/')[2] || 'dashboard']}
              items={filteredMenuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => handleMenuClick(item.path),
              }))}
            />
          </div>
          {/* 右侧：用户信息和下拉菜单 */}
          <div className="flex items-center">
            {/* 下拉菜单，包含"回到首页"和"退出登录"选项 */}
            <Dropdown
              menu={{
                items: userMenu.map(item => ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label,
                  onClick: () => handleUserMenuClick({ key: item.key }),
                })),
              }}
              placement="bottomRight"
            >
              {/* 用户头像和用户名 */}
              <div className="flex items-center cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span className="ml-2">
                  {user?.name || user?.username || '用户名'}
                </span>
              </div>
            </Dropdown>
          </div>
        </div>
      </Header>
      {/* Content组件是页面的主要内容区域 */}
      <Content
        style={{
          margin: '24px 16px',  // 外边距，上下24像素，左右16像素
          padding: 24,  // 内边距，四周均为24像素
          minHeight: 280,  // 最小高度
          background: colorBgContainer,  // 背景颜色
          borderRadius: borderRadiusLG,  // 边框圆角
        }}
      >
        {/* children是实际页面内容，会根据用户访问的路径不同而变化 */}
        {children}
      </Content>
    </Layout>
  );
} 