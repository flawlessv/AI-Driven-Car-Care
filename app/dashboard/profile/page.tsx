'use client';

import { useSelector } from 'react-redux';
import { Card, Descriptions, Avatar, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { RootState } from '@/app/lib/store';
import { Skeleton } from 'antd';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) {
    return (
      <div className="fade-in">
        <Card className="dashboard-card">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-title mb-6">
        <h1>个人资料</h1>
        <div className="description">查看您的个人信息</div>
      </div>

      <Card 
        className="dashboard-card mb-6"
        title={
          <div className="flex items-center">
            <Avatar 
              size={64} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
              className="mr-4"
            />
            <div>
              <h2 className="text-lg font-medium">{user.name || user.username}</h2>
              <div className="text-gray-500">
                <Tag color={user.role === 'admin' ? 'red' : user.role === 'technician' ? 'blue' : 'green'}>
                  {user.role === 'admin' ? '管理员' : user.role === 'technician' ? '技师' : '客户'}
                </Tag>
              </div>
            </div>
          </div>
        }
      >
        <Descriptions column={1} className="slide-up">
          <Descriptions.Item label="用户名/姓名">
            <div className="flex items-center">
              <UserOutlined className="mr-2 text-gray-400" />
              {user.username}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            <div className="flex items-center">
              <MailOutlined className="mr-2 text-gray-400" />
              {user.email || '未设置'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="电话">
            <div className="flex items-center">
              <PhoneOutlined className="mr-2 text-gray-400" />
              {user.phone || '未设置'}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag color={user.role === 'admin' ? 'red' : user.role === 'technician' ? 'blue' : 'green'}>
              {user.role === 'admin' ? '管理员' : user.role === 'technician' ? '技师' : '客户'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
} 