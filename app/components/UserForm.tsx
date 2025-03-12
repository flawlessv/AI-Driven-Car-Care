import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { User, USER_ROLES, ROLE_NAMES } from '@/types/user';

interface UserFormProps {
  initialData?: Partial<User>;
  onSuccess: (user: User) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        // 不回填密码字段
        password: '',
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 如果是编辑模式且没有输入密码，则从提交数据中移除密码字段
      if (isEdit && !values.password) {
        delete values.password;
      }

      const url = isEdit && initialData?._id 
        ? `/api/users/${initialData._id}` 
        : '/api/users';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '操作失败');
      }

      message.success(isEdit ? '用户更新成功' : '用户创建成功');
      onSuccess(result.data);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        role: 'customer',
        status: 'active',
      }}
    >
      <Form.Item
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>

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

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { 
            required: !isEdit, 
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

      <Form.Item
        name="name"
        label="姓名"
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="电话"
      >
        <Input placeholder="请输入电话号码" />
      </Form.Item>

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

      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select placeholder="请选择状态">
          <Select.Option value="active">正常</Select.Option>
          <Select.Option value="disabled">禁用</Select.Option>
        </Select>
      </Form.Item>

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