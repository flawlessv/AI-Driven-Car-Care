'use client';

import { Layout, Menu, Avatar, Dropdown, Button, theme, message } from 'antd';
import {
  CarOutlined,
  ToolOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  MessageOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import { logout } from '@/lib/store/slices/authSlice';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'vehicles',
    icon: <CarOutlined />,
    label: '车辆管理',
    children: [
      {
        key: 'vehicle-list',
        label: '车辆列表',
        path: '/dashboard/vehicles',
      },
      {
        key: 'vehicle-files',
        label: '车辆档案',
        path: '/dashboard/vehicles/files',
      },
      {
        key: 'vehicle-health',
        label: '健康评分',
        path: '/dashboard/vehicles/health',
      },
    ],
  },
  {
    key: 'maintenance',
    icon: <ToolOutlined />,
    label: '保养维修',
    children: [
      {
        key: 'maintenance-records',
        label: '维修记录',
        path: '/dashboard/maintenance',
      },
      {
        key: 'maintenance-rules',
        label: '保养规则',
        path: '/dashboard/maintenance/rules',
      },
    ],
  },
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: '预约管理',
    path: '/dashboard/appointments',
  },
  {
    key: 'technicians',
    icon: <TeamOutlined />,
    label: '技师团队',
    path: '/dashboard/technicians',
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: '用户管理',
    path: '/dashboard/users',
  },
  {
    key: 'parts',
    icon: <AppstoreOutlined />,
    label: '配件库存',
    path: '/dashboard/parts',
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: '统计报表',
    children: [
      {
        key: 'maintenance-stats',
        label: '维修统计',
        path: '/dashboard/reports/maintenance',
      },
      {
        key: 'revenue-stats',
        label: '收入统计',
        path: '/dashboard/reports/revenue',
      },
      {
        key: 'customer-analysis',
        label: '客户分析',
        path: '/dashboard/reports/customers',
      },
    ],
  },
  {
    key: 'reviews',
    icon: <MessageOutlined />,
    label: '评价管理',
    path: '/dashboard/reviews',
  },
];

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  console.log('Current user:', user);

  const handleMenuClick = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'home':
        router.push('/');
        break;
      case 'logout':
        try {
          // 1. 调用退出登录 API
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // 包含 cookies
          });

          if (!response.ok) {
            throw new Error('退出登录失败');
          }

          // 2. 清除 Redux store 状态
          dispatch(logout());

          // 3. 显示成功消息
          message.success('退出登录成功');

          // 4. 跳转到登录页
          window.location.href = '/login';
        } catch (error) {
          console.error('退出登录失败:', error);
          message.error('退出登录失败，请重试');
        }
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="p-4">
          <Link href="/">
            <h1 className={`text-xl font-bold transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
              汽车保养系统
            </h1>
          </Link>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname.split('/')[2] || 'dashboard']}
          defaultOpenKeys={['vehicles', 'maintenance', 'reports']}
          onClick={({ key, keyPath }) => {
            const item = menuItems.find(item => item.key === key) || 
                        menuItems.find(item => item.children?.some(child => child.key === key))?.children?.find(child => child.key === key);
            if (item?.path) {
              handleMenuClick(item.path);
            }
          }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            children: item.children?.map(child => ({
              key: child.key,
              label: child.label,
            })),
          }))}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className="flex justify-between items-center px-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div className="flex items-center">
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
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 