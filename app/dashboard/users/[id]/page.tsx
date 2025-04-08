'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Descriptions, Button, Spin, message, Modal, Tag, Divider } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import UserForm from '../../../components/UserForm';
import { User, ROLE_NAMES } from '../../../types/user';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取用户详情失败');
      }

      setUser(result.data);
    } catch (error: any) {
      message.error(error.message || '获取用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [params.id]);

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除用户失败');
      }

      message.success('用户删除成功');
      router.push('/dashboard/users');
    } catch (error: any) {
      message.error(error.message || '删除用户失败');
    } finally {
      setActionLoading(false);
      setDeleteModalVisible(false);
    }
  };

  const handleEditSuccess = (updatedUser: User) => {
    setUser(updatedUser);
    setEditModalVisible(false);
  };

  const getRoleTag = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: 'red',
      customer: 'green',
      technician: 'purple',
    };

    return (
      <Tag color={colorMap[role] || 'default'}>
        {ROLE_NAMES[role as keyof typeof ROLE_NAMES] || role}
      </Tag>
    );
  };

  const getStatusTag = (status: string) => {
    return (
      <Tag color={status === 'active' ? 'green' : 'red'}>
        {status === 'active' ? '正常' : '禁用'}
      </Tag>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl">用户不存在或已被删除</h2>
          <Button 
            type="primary" 
            onClick={() => router.push('/dashboard/users')}
            className="mt-4"
          >
            返回用户列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/dashboard/users')}
          className="mr-2"
        >
          返回
        </Button>
        <h1 className="text-2xl font-bold m-0">用户详情</h1>
      </div>

      <Card
        title={
          <div className="flex items-center">
            <span className="text-lg font-medium">{user.username}</span>
            {user.role && getRoleTag(user.role)}
          </div>
        }
        extra={
          <div className="flex gap-2">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setEditModalVisible(true)}
            >
              编辑
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => setDeleteModalVisible(true)}
            >
              删除
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="用户ID">{user._id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="电话">{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">{getRoleTag(user.role)}</Descriptions.Item>
          <Descriptions.Item label="状态">{getStatusTag(user.status)}</Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <UserForm
          initialData={user}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditModalVisible(false)}
          isEdit={true}
        />
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={actionLoading}
        onOk={handleDelete}
      >
        <p>确定要删除用户 <strong>{user.username}</strong> 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
} 