'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface RegisterFormData {
  username: string;
  password: string;
  email: string;
  phone?: string;
}

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: RegisterFormData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('注册成功');
        router.push('/login');
      } else {
        message.error(data.message || '注册失败');
      }
    } catch (error) {
      console.error('Register error:', error);
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        className="space-y-6"
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名长度不能小于3位' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-blue-400" />}
            placeholder="请输入用户名"
            className="input-base"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-blue-400" />}
            placeholder="请输入邮箱"
            className="input-base"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能小于6位' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-blue-400" />}
            placeholder="请输入密码"
            className="input-base"
          />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-blue-400" />}
            placeholder="请输入手机号码（选填）"
            className="input-base"
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="btn-primary"
          >
            注册
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center">
        <Divider className="text-gray-300">
          <span className="text-gray-500 text-sm px-4">已有账号?</span>
        </Divider>
        <Link 
          href="/login" 
          className="inline-block text-blue-500 hover:text-blue-600 text-sm font-medium 
            hover:underline transition-colors duration-300"
        >
          立即登录
        </Link>
      </div>
    </div>
  );
} 