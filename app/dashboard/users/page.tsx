'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Select, message, Input, Tag, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import type { User } from '@/types/user';
import { ROLE_NAMES } from '@/types/user';
import UserForm from '../../components/UserForm';
import PermissionGuard from '@/app/components/PermissionGuard';

const { Search } = Input;

/**
 * 用户角色选项列表
 * 用于角色筛选和显示
 */
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '技师', value: 'technician' },
  { label: '客户', value: 'customer' },
];

/**
 * 用户状态选项列表
 * 用于状态筛选和显示
 */
const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' },
];

/**
 * 用户管理页面组件
 * 提供用户列表展示、搜索、筛选、添加、编辑和删除等功能
 */
export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // 从Redux获取当前登录用户信息
  const currentUser = useSelector((state: RootState) => state.auth.user);

  /**
   * 获取用户列表数据
   * 根据页码、每页数量和筛选条件从API获取用户数据
   * @param page 当前页码
   * @param limit 每页显示数量
   * @param filters 筛选条件（搜索关键词和角色）
   */
  const fetchUsers = async (
    page = currentPage,
    limit = pageSize,
    filters = {
      search,
      role: roleFilter,
    }
  ) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
      });

      const response = await fetch(`/api/users?${queryParams}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取用户列表失败');
      }

      if (result.success) {
        setData(result.data);
        setTotal(result.data.length);
      } else {
        throw new Error(result.message || '获取用户列表失败');
      }
    } catch (error: any) {
      message.error(error.message || '获取用户列表失败');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 当页码、每页数量、搜索关键词或角色筛选变化时重新获取用户列表
  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, search, roleFilter]);

  /**
   * 更新用户状态
   * 向API发送请求更改用户的状态（启用/禁用）
   * @param newStatus 新的用户状态
   * @param userId 用户ID
   */
  const handleStatusChange = async (newStatus: string, userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新用户状态失败');
      }

      message.success('更新状态成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '更新用户状态失败');
    }
  };

  /**
   * 删除用户
   * 向API发送删除请求并更新用户列表
   */
  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除用户失败');
      }

      message.success('用户删除成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '删除用户失败');
    } finally {
      setActionLoading(false);
      setDeleteModalVisible(false);
      setSelectedUser(null);
    }
  };

  /**
   * 显示删除确认对话框
   * @param user 要删除的用户对象
   */
  const showDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  /**
   * 处理用户创建成功的回调
   * 关闭创建模态框并刷新用户列表
   */
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchUsers();
  };

  /**
   * 处理用户编辑成功的回调
   * 关闭编辑模态框并刷新用户列表
   */
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedUser(null);
    fetchUsers();
  };

  /**
   * 显示编辑用户模态框
   * @param user 要编辑的用户对象
   */
  const showEditModal = (user: User) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  /**
   * 根据角色获取对应的颜色
   * 用于在界面上以不同颜色显示不同角色
   * @param role 用户角色
   * @returns 对应的颜色字符串
   */
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: 'red',
      technician: 'blue',
      customer: 'green'
    };
    return colorMap[role] || 'default';
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户名/姓名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: keyof typeof ROLE_NAMES) => (
        <Tag color={getRoleColor(role)}>
          {ROLE_NAMES[role] || role}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <Select
          value={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(value, record._id)}
          disabled={currentUser?._id === record._id || currentUser?.role !== 'admin'}
          options={statusOptions}
        />
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <PermissionGuard requiredPermission="write" menuKey="users">
          <Space size="small">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/dashboard/users/${record._id}`)}
            >
              详情
            </Button>
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => showEditModal(record)}
            >
              编辑
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => showDeleteConfirm(record)}
              disabled={currentUser?._id === record._id}
            >
              删除
            </Button>
          </Space>
        </PermissionGuard>
      ),
    },
  ];

  /**
   * 处理表格变更
   * 当分页参数变化时更新页码和每页显示数量
   * @param pagination 分页相关参数
   */
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  /**
   * 处理搜索功能
   * 根据搜索关键词筛选用户数据
   * @param value 搜索关键词
   */
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /**
   * 处理角色筛选变更
   * 根据选择的角色更新筛选条件
   * @param value 选择的角色值
   */
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  return (
    <PermissionGuard requiredPermission="read" menuKey="users">
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Search
              placeholder="搜索用户名、邮箱或电话"
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="角色过滤"
              allowClear
              style={{ width: 120 }}
              options={roleOptions}
              onChange={handleRoleFilterChange}
            />
          </div>
          <PermissionGuard requiredPermission="write" menuKey="users">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              添加用户
            </Button>
          </PermissionGuard>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
        />

        {/* 创建用户弹窗 */}
        <Modal
          title="创建新用户"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={600}
        >
          <UserForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateModalVisible(false)}
          />
        </Modal>

        {/* 编辑用户弹窗 */}
        <Modal
          title="编辑用户"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedUser(null);
          }}
          footer={null}
          width={600}
        >
          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setEditModalVisible(false);
                setSelectedUser(null);
              }}
              isEdit={true}
            />
          )}
        </Modal>

        {/* 删除确认弹窗 */}
        <Modal
          title="确认删除"
          open={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          confirmLoading={actionLoading}
          onOk={handleDelete}
        >
          <p>确定要删除用户 <strong>{selectedUser?.username}</strong> 吗？此操作不可恢复。</p>
        </Modal>
      </div>
    </PermissionGuard>
  );
} 