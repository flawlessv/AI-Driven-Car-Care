'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { login } from '@/lib/store/slices/authSlice';
import type { User } from '@/types/user';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      
      console.log('Login response:', data);

      if (response.ok) {
        // 通过Redux更新状态
        dispatch(login({
          user: data.data.user,
          token: data.data.token
        }));

        message.success('登录成功');
        router.push('/dashboard');
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
        className="space-y-6"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-blue-400" />}
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

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="btn-primary"
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center">
        <Divider className="text-gray-300">
          <span className="text-gray-500 text-sm px-4">还没有账号?</span>
        </Divider>
        <Link 
          href="/register" 
          className="inline-block text-blue-500 hover:text-blue-600 text-sm font-medium 
            hover:underline transition-colors duration-300"
        >
          立即注册
        </Link>
      </div>
    </div>
  );
} 