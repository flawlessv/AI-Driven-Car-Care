'use client';

import { Layout, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/app/lib/store/slices/authSlice';
import { message } from 'antd';
import Cookies from 'js-cookie';

const { Header } = Layout;

export default function AppHeader() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // 调用退出登录 API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('退出登录失败');
      }

      // 清除客户端状态
      dispatch(logout());
      localStorage.removeItem('auth');
      
      message.success('退出登录成功');
      
      // 使用 window.location 进行强制跳转
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      message.error('退出登录失败，请重试');
    }
  };

  const items = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="bg-white px-6 flex justify-between items-center border-b">
      <div className="flex items-center">
        <div className="text-xl font-bold text-gray-800 flex items-center">
          <span className="text-primary mr-2">佳伟汽修</span>
          <span className="text-sm text-gray-500 font-normal">专业维修保养服务商</span>
        </div>
      </div>
      <div className="flex items-center">
        <Dropdown menu={{ items }}>
          <Space className="cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span className="text-gray-700">管理员</span>
          </Space>
        </Dropdown>
      </div>
    </Header>
  );
} 