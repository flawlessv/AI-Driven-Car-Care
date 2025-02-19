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
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

const { Header, Content } = Layout;

const menuItems = [
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
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: colorBgContainer }}>
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold mr-8">
              汽车保养系统
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[pathname.split('/')[1]]}
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