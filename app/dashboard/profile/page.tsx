'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Descriptions, Avatar, Tag, Button, Form, Input, Modal, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import type { RootState } from '@/app/lib/store';
import { updateUser } from '@/app/lib/store/slices/authSlice';
import { Skeleton } from 'antd';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  if (!user) {
    return (
      <div className="fade-in">
        <Card className="dashboard-card">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  // 处理编辑表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新个人资料失败');
      }

      message.success('个人资料更新成功');
      
      // 更新Redux中的用户信息
      dispatch(updateUser(result.data));
      
      // 关闭编辑模式
      setIsEditing(false);
    } catch (error: any) {
      message.error(error.message || '更新个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑时，初始化表单数据
  const startEditing = () => {
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
    setIsEditing(true);
  };


  return (
    <div className="fade-in">
      <div className="page-title mb-6">
        <h1>个人资料</h1>
        <div className="description">查看和管理您的个人信息</div>
      </div>

      <Card 
        className="dashboard-card mb-6"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar 
                size={64} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
                className="mr-4"
              />
              <div>
                <h2 className="text-lg font-medium">{user.username}</h2>
                <div className="text-gray-500">
                  <Tag color={user.role === 'admin' ? 'red' : user.role === 'technician' ? 'blue' : 'green'}>
                    {user.role === 'admin' ? '管理员' : user.role === 'technician' ? '技师' : '客户'}
                  </Tag>
                </div>
              </div>
            </div>
            {!isEditing && (
              <div>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={startEditing}
                >
                  编辑资料
                </Button>
              </div>
            )}
          </div>
        }
      >
        {!isEditing ? (
          // 显示模式
          <Descriptions column={1} className="slide-up">
            <Descriptions.Item label="用户名">
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
        ) : (
          // 编辑模式
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              username: user.username,
              email: user.email,
              phone: user.phone,
            }}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="电话"
            >
              <Input prefix={<PhoneOutlined />} placeholder="电话" />
            </Form.Item>
            <Form.Item>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsEditing(false)} className="mr-2">
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
} 