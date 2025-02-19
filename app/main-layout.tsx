'use client';

import { Layout, Menu, Avatar, Dropdown, Button, theme } from 'antd';
import {
  CarOutlined,
  ToolOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: 'dashboard',
    icon: <CarOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'vehicles',
    icon: <CarOutlined />,
    label: '车辆管理',
    path: '/dashboard/vehicles',
  },
  {
    key: 'maintenance',
    icon: <ToolOutlined />,
    label: '保养维修',
    path: '/dashboard/maintenance',
  },
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: '在线预约',
    path: '/appointments',
  },
  {
    key: 'community',
    icon: <TeamOutlined />,
    label: '用户社区',
    path: '/community',
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
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (path: string) => {
    router.push(path);
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
          selectedKeys={[pathname.split('/')[1] || 'dashboard']}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item.path),
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
                    label: item.label,
                  })),
                }}
                placement="bottomRight"
              >
                <div className="flex items-center cursor-pointer">
                  <Avatar icon={<UserOutlined />} />
                  <span className="ml-2">用户名</span>
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