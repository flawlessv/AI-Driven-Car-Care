'use client';

import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  CarOutlined,
  ToolOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

const { Header, Content } = Layout;

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

const userMenu = [
  {
    key: 'profile',
    label: '个人信息',
  },
  {
    key: 'settings',
    label: '系统设置',
  },
  {
    key: 'logout',
    label: '退出登录',
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        router.push('/dashboard/profile');
        break;
      case 'settings':
        router.push('/dashboard/settings');
        break;
      case 'logout':
        // 处理登出逻辑
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: colorBgContainer }}>
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold mr-8">
              汽车保养系统
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[pathname.split('/')[2] || 'dashboard']}
              items={menuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => handleMenuClick(item.path),
              }))}
            />
          </div>
          <div className="flex items-center">
            <Dropdown
              menu={{
                items: userMenu.map(item => ({
                  key: item.key,
                  label: item.label,
                  onClick: () => handleUserMenuClick({ key: item.key }),
                })),
              }}
              placement="bottomRight"
            >
              <div className="flex items-center cursor-pointer">
                <Avatar icon={<UserOutlined />} />
                <span className="ml-2">{user?.name || '用户名'}</span>
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
  );
} 