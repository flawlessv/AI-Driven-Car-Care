/**
 * 登录表单组件
 * 
 * 这个文件实现了用户登录功能和密码修改功能
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

// 导入React的useState钩子，用于管理组件内部状态
import { useState } from 'react';
// 导入Ant Design组件，用于构建用户界面
import { Form, Input, Button, message, Divider, Modal } from 'antd';
// 导入Next.js的路由钩子，用于页面导航
import { useRouter } from 'next/navigation';
// 导入Redux的派发钩子，用于更新全局状态
import { useDispatch } from 'react-redux';
// 导入登录action，用于更新全局认证状态
import { login } from '@/app/lib/store/slices/authSlice';
// 导入用户类型定义
import type { User } from '@/types/user';
// 导入图标组件
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
// 导入Next.js的链接组件，用于页面跳转
import Link from 'next/link';

/**
 * 登录表单数据接口
 * 定义了登录表单需要收集的数据类型
 */
interface LoginFormData {
  email: string;    // 用户电子邮箱
  password: string; // 用户密码
}

/**
 * 重置密码数据接口
 * 定义了重置密码表单需要收集的数据类型
 */
interface ResetPasswordData {
  email: string;           // 用户电子邮箱
  oldPassword: string;     // 原密码
  newPassword: string;     // 新密码
  confirmPassword: string; // 确认新密码
}

/**
 * 登录表单组件
 * 提供用户登录界面和重置密码功能
 */
export default function LoginForm() {
  // 状态管理：记录当前是否正在提交登录请求
  const [loading, setLoading] = useState(false);
  // 状态管理：记录当前是否正在提交重置密码请求
  const [resetLoading, setResetLoading] = useState(false);
  // 状态管理：控制重置密码模态框的显示与隐藏
  const [resetModalVisible, setResetModalVisible] = useState(false);
  // 获取路由实例，用于导航
  const router = useRouter();
  // 获取派发函数，用于向Redux发送action
  const dispatch = useDispatch();
  // 创建重置密码表单实例
  const [resetForm] = Form.useForm();

  /**
   * 登录表单提交处理函数
   * 
   * @param {LoginFormData} values - 表单提交的数据，包含email和password
   */
  const onFinish = async (values: LoginFormData) => {
    try {
      // 设置加载状态为true，显示加载动画
      setLoading(true);
      // 向服务器发送登录请求
      const response = await fetch('/api/auth/login', {
        method: 'POST',  // HTTP方法：POST
        headers: {
          'Content-Type': 'application/json',  // 内容类型：JSON
        },
        body: JSON.stringify(values),  // 将表单数据转换为JSON字符串
      });

      // 解析服务器返回的JSON数据
      const data = await response.json();
      
      // 在控制台打印登录响应，用于调试
      console.log('Login response:', data);

      // 如果响应成功
      if (response.ok) {
        // 通过Redux更新全局状态，保存用户信息和认证令牌
        dispatch(login({
          user: data.data.user,  // 用户信息
          token: data.data.token  // 认证令牌
        }));

        // 显示成功消息
        message.success('登录成功');
        // 导航到仪表盘页面
        router.push('/dashboard');
      } else {
        // 显示错误消息
        message.error(data.message || '登录失败');
      }
    } catch (error) {
      // 捕获并处理任何可能发生的错误
      console.error('Login error:', error);
      message.error('登录失败，请重试');
    } finally {
      // 无论成功还是失败，都设置加载状态为false，隐藏加载动画
      setLoading(false);
    }
  };

  /**
   * 显示重置密码模态框
   */
  const showResetModal = () => {
    // 显示重置密码模态框
    setResetModalVisible(true);
    // 重置表单字段，清除之前可能输入的值
    resetForm.resetFields();
  };

  /**
   * 关闭重置密码模态框
   */
  const handleResetCancel = () => {
    // 隐藏重置密码模态框
    setResetModalVisible(false);
    // 重置表单字段，清除输入的值
    resetForm.resetFields();
  };

  /**
   * 处理密码重置请求
   * 发送重置密码请求到服务器
   */
  const handleResetPassword = async () => {
    try {
      // 验证表单字段并获取值
      const values = await resetForm.validateFields();
      
      // 验证新密码和确认密码是否一致
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致');
        return;  // 如果不一致，中止操作
      }

      // 设置加载状态为true，显示加载动画
      setResetLoading(true);
      // 向服务器发送修改密码请求
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',  // HTTP方法：POST
        headers: {
          'Content-Type': 'application/json',  // 内容类型：JSON
        },
        body: JSON.stringify({
          email: values.email,  // 用户邮箱
          oldPassword: values.oldPassword,  // 原密码
          newPassword: values.newPassword  // 新密码
        }),
      });

      // 解析服务器返回的JSON数据
      const data = await response.json();

      // 如果响应成功
      if (response.ok) {
        // 显示成功消息
        message.success('密码修改成功');
        // 关闭模态框
        setResetModalVisible(false);
        // 重置表单
        resetForm.resetFields();
      } else {
        // 显示错误消息
        message.error(data.message || '密码修改失败');
      }
    } catch (error) {
      // 捕获并处理任何可能发生的错误
      console.error('Reset password error:', error);
      message.error('密码修改失败，请重试');
    } finally {
      // 无论成功还是失败，都设置加载状态为false，隐藏加载动画
      setResetLoading(false);
    }
  };

  return (
    // 登录表单容器，使用垂直间距样式
    <div className="space-y-6">
      {/* 登录表单 */}
      <Form
        name="login"  // 表单名称
        onFinish={onFinish}  // 表单提交处理函数
        layout="vertical"  // 表单布局：垂直
        className="space-y-6"  // 表单项之间的间距
      >
        {/* 邮箱输入项 */}
        <Form.Item
          name="email"  // 字段名称
          rules={[  // 验证规则
            { required: true, message: '请输入邮箱' },  // 必填
            { type: 'email', message: '请输入有效的邮箱地址' }  // 邮箱格式
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-blue-400" />}  // 前缀图标：用户图标
            placeholder="请输入邮箱"  // 占位文本
            className="input-base"  // 自定义样式类
            size="large"  // 输入框大小
          />
        </Form.Item>

        {/* 密码输入项 */}
        <Form.Item
          name="password"  // 字段名称
          rules={[  // 验证规则
            { required: true, message: '请输入密码' },  // 必填
            { min: 6, message: '密码长度不能小于6位' }  // 最小长度
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-blue-400" />}  // 前缀图标：锁图标
            placeholder="请输入密码"  // 占位文本
            className="input-base"  // 自定义样式类
            size="large"  // 输入框大小
          />
        </Form.Item>

        {/* 修改密码链接 */}
        <div className="flex justify-end items-center mb-4">
          <Button 
            type="link"  // 按钮类型：链接
            onClick={showResetModal}  // 点击处理函数：显示重置密码模态框
            className="text-blue-500 hover:text-blue-600 text-sm p-0"  // 自定义样式
            icon={<KeyOutlined />}  // 按钮图标：钥匙图标
          >
            修改密码
          </Button>
        </div>

        {/* 登录按钮 */}
        <Form.Item className="mb-0">
          <Button
            type="primary"  // 按钮类型：主要
            htmlType="submit"  // HTML类型：提交
            loading={loading}  // 加载状态
            className="w-full h-10 text-base font-medium shadow-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"  // 自定义样式
            size="large"  // 按钮大小
          >
            登录
          </Button>
        </Form.Item>
      </Form>

      {/* 注册链接部分 */}
      <div className="text-center">
        {/* 分隔线，带有文字 */}
        <Divider className="text-gray-300">
          <span className="text-gray-500 text-sm px-4">还没有账号?</span>
        </Divider>
        {/* 注册链接 */}
        <Link 
          href="/register"  // 跳转路径
          className="inline-block text-blue-500 hover:text-blue-600 text-sm font-medium 
            hover:underline transition-colors duration-300"  // 自定义样式
        >
          立即注册
        </Link>
      </div>

      {/* 修改密码模态框 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <KeyOutlined className="text-blue-500" />  {/* 标题图标 */}
            <span>修改密码</span>  {/* 标题文本 */}
          </div>
        }
        open={resetModalVisible}  // 控制模态框显示与隐藏
        onCancel={handleResetCancel}  // 取消处理函数
        footer={[  // 自定义底部按钮
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
        maskClosable={false}  // 点击遮罩层是否可关闭
        width={450}  // 模态框宽度
      >
        {/* 重置密码表单 */}
        <Form
          form={resetForm}  // 表单实例
          layout="vertical"  // 表单布局：垂直
        >
          {/* 邮箱输入项 */}
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
          {/* 原密码输入项 */}
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
          {/* 新密码输入项 */}
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少6位）" />
          </Form.Item>
          {/* 确认新密码输入项 */}
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 