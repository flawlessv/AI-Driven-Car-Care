'use client';

import { useState } from 'react';
import { Form, Input, Button, message, Divider, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { login } from '@/lib/store/slices/authSlice';
import type { User } from '@/types/user';
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const [resetForm] = Form.useForm();

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

  const showResetModal = () => {
    setResetModalVisible(true);
    resetForm.resetFields();
  };

  const handleResetCancel = () => {
    setResetModalVisible(false);
    resetForm.resetFields();
  };

  // 修改密码
  const handleResetPassword = async () => {
    try {
      const values = await resetForm.validateFields();
      
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;
      }

      setResetLoading(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          oldPassword: values.oldPassword,
          newPassword: values.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('密码修改成功');
        setResetModalVisible(false);
        resetForm.resetFields();
      } else {
        message.error(data.message || '密码修改失败');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('密码修改失败，请重试');
    } finally {
      setResetLoading(false);
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
            size="large"
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
            size="large"
          />
        </Form.Item>

        <div className="flex justify-end items-center mb-4">
          <Button 
            type="link" 
            onClick={showResetModal}
            className="text-blue-500 hover:text-blue-600 text-sm p-0"
            icon={<KeyOutlined />}
          >
            修改密码
          </Button>
        </div>

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full h-10 text-base font-medium shadow-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
            size="large"
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

      {/* 修改密码模态框 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <KeyOutlined className="text-blue-500" />
            <span>修改密码</span>
          </div>
        }
        open={resetModalVisible}
        onCancel={handleResetCancel}
        footer={[
          <Button key="cancel" onClick={handleResetCancel} size="middle">
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={resetLoading} 
            onClick={handleResetPassword}
            size="middle"
            className="shadow-sm"
          >
            确认修改
          </Button>,
        ]}
        className="reset-password-modal"
        maskClosable={false}
        width={450}
      >
        <Form
          form={resetForm}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<UserOutlined className="text-blue-400" />} 
              placeholder="请输入您的账号邮箱" 
            />
          </Form.Item>
          <Form.Item
            name="oldPassword"
            label="原密码"
            rules={[
              { required: true, message: '请输入原密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请再次输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 