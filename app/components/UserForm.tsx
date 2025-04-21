/**
 * 用户表单组件
 * 
 * 这个组件用于创建和编辑用户信息，支持表单验证和提交
 */
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { User, ROLE_NAMES } from '@/types/user';

/**
 * 用户表单组件的属性接口
 * 
 * @property {Partial<User>} initialData - 可选的初始用户数据，用于编辑模式
 * @property {Function} onSuccess - 表单提交成功的回调函数
 * @property {Function} onCancel - 取消操作的回调函数
 * @property {boolean} isEdit - 是否为编辑模式，默认为false
 */
interface UserFormProps {
  initialData?: Partial<User>;
  onSuccess: (user: User) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

/**
 * 用户表单组件
 * 用于创建新用户或编辑现有用户信息
 * 
 * @param {UserFormProps} props - 组件属性
 * @returns {JSX.Element} 返回表单组件
 */
const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
}) => {
  // 创建表单实例
  const [form] = Form.useForm();
  // 表单提交加载状态
  const [loading, setLoading] = useState(false);

  /**
   * 在组件挂载或initialData变化时，设置表单初始值
   */
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        // 不回填密码字段，确保安全
        password: '',
      });
    }
  }, [initialData, form]);

  /**
   * 处理表单提交
   * 
   * @param {any} values - 表单提交的值
   */
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 如果是编辑模式且没有输入密码，则从提交数据中移除密码字段
      if (isEdit && !values.password) {
        delete values.password;
      }

      // 构造API请求数据，将username映射为name
      const apiData = {
        ...values,
        name: values.username
      };

      // 根据是否为编辑模式，决定URL和请求方法
      const url = isEdit && initialData?._id 
        ? `/api/users/${initialData._id}` 
        : '/api/users';
      
      const method = isEdit ? 'PUT' : 'POST';

      // 发送API请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      // 处理API响应
      if (!response.ok) {
        throw new Error(result.message || '操作失败');
      }

      // 显示成功消息
      message.success(isEdit ? '用户更新成功' : '用户创建成功');
      // 调用成功回调
      onSuccess(result.data);
    } catch (error: any) {
      // 显示错误消息
      message.error(error.message || '操作失败');
    } finally {
      // 无论成功与否，都结束加载状态
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        role: 'customer',  // 默认角色为客户
        status: 'active',  // 默认状态为激活
      }}
    >
      {/* 用户名/姓名字段 */}
      <Form.Item
        name="username"
        label="用户名/姓名"
        rules={[{ required: true, message: '请输入用户名/姓名' }]}
      >
        <Input placeholder="请输入用户名/姓名" />
      </Form.Item>

      {/* 邮箱字段 */}
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input placeholder="请输入邮箱" />
      </Form.Item>

      {/* 密码字段 */}
      <Form.Item
        name="password"
        label="密码"
        rules={[
          { 
            required: !isEdit,  // 创建模式下必填，编辑模式下可选 
            message: '请输入密码' 
          },
          {
            min: 6,
            message: '密码长度不能少于6个字符',
          },
        ]}
      >
        <Input.Password 
          placeholder={isEdit ? "留空表示不修改密码" : "请输入密码"} 
        />
      </Form.Item>

      {/* 电话字段 */}
      <Form.Item
        name="phone"
        label="电话"
      >
        <Input placeholder="请输入电话号码" />
      </Form.Item>

      {/* 角色选择字段 */}
      <Form.Item
        name="role"
        label="角色"
        rules={[{ required: true, message: '请选择角色' }]}
      >
        <Select placeholder="请选择角色">
          {Object.entries(ROLE_NAMES).map(([value, label]) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 状态选择字段 */}
      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select placeholder="请选择状态">
          <Select.Option value="active">正常</Select.Option>
          <Select.Option value="inactive">未激活</Select.Option>
          <Select.Option value="suspended">已冻结</Select.Option>
        </Select>
      </Form.Item>

      {/* 表单按钮 */}
      <Form.Item className="flex justify-end">
        <Button onClick={onCancel} className="mr-2">
          取消
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEdit ? '更新' : '创建'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm; 