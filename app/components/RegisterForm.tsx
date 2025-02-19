'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { useRouter } from 'next/navigation';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
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

      const result = await response.json();

      if (response.ok) {
        message.success('注册成功，请登录');
        router.push('/login');
      } else {
        throw new Error(result.message || '注册失败');
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
            { min: 2, message: '用户名长度不能小于2位' }
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
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-blue-400" />}
            placeholder="请确认密码"
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

      {/* 添加分割线和登录链接 */}
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