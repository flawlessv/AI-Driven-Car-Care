'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Select, message, Input, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { User } from '@/types/user';
import { ROLE_NAMES } from '@/types/user';

const { Search } = Input;

const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '技师', value: 'technician' },
  { label: '客户', value: 'customer' },
];

const statusOptions = [
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'disabled' },
];

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const currentUser = useSelector((state: RootState) => state.auth.user);

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

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, search, roleFilter]);

  const handleRoleChange = async (newRole: string, userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新用户角色失败');
      }

      message.success('更新角色成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || '更新用户角色失败');
    }
  };

  const handleStatusChange = async (newStatus: string, userId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
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

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
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
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: keyof typeof ROLE_NAMES) => (
        <Tag color={getRoleColor(role)}>
          {ROLE_NAMES[role]}
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
  ];

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'technician':
        return 'blue';
      case 'customer':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">用户管理</h1>
      </div>

      <div className="mb-4 flex gap-4">
        <Search
          placeholder="搜索用户名或邮箱"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="按角色筛选"
          allowClear
          onChange={handleRoleFilterChange}
          options={roleOptions}
          style={{ width: 200 }}
        />
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
    </div>
  );
} 