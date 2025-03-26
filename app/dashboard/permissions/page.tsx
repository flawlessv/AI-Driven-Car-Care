'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  message, 
  Button, 
  Select, 
  Tag,
  Space,
  Empty,
  Alert,
  Divider,
  Spin,
  Badge,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  TeamOutlined,
  LockOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { menuItems } from '@/app/config/menu';

const { Option } = Select;
const { TabPane } = Tabs;

// 简化的权限管理页面 - 按角色分配
const PermissionsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissionInfo, setRolePermissionInfo] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | 'none'>('none');
  
  const { user } = useSelector((state: RootState) => state.auth);

  // 角色选项
  const roleOptions = [
    { label: '客户', value: 'customer' },
    { label: '技师', value: 'technician' }
  ];

  // 权限类型选项
  const permissionOptions = [
    { label: '无权限', value: 'none' },
    { label: '只读', value: 'read' },
    { label: '读写', value: 'write' },
    { label: '管理', value: 'manage' }
  ];

  // 获取角色权限
  const fetchRolePermissions = async (role: string) => {
    try {
      setLoading(true);
      setSaveStatus('none');
      const response = await fetch(`/api/roles/${role}/permissions`);
      const result = await response.json();

      console.log(`获取${role}角色权限结果:`, result);

      if (result.success && result.data) {
        setPermissions(result.data || []);
        
        // 设置角色权限的附加信息
        setRolePermissionInfo({
          isDefault: result.data.isDefault,
          description: result.data.description,
          lastUpdated: result.data.updatedAt,
          permissionCount: Array.isArray(result.data) ? result.data.length : 0
        });
        
        message.success(`成功加载${role}角色的权限配置`);
      } else {
        message.warning('加载权限配置失败，使用默认权限设置');
        setPermissions([]);
        setRolePermissionInfo(null);
      }
    } catch (error) {
      console.error('获取角色权限失败:', error);
      message.error('获取角色权限失败，请重试');
      setPermissions([]);
      setRolePermissionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 角色选择变更时获取其权限
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    } else {
      setPermissions([]);
      setRolePermissionInfo(null);
    }
  }, [selectedRole]);

  // 更新单个菜单项的权限
  const handlePermissionChange = (menuKey: string, permission: string) => {
    // 检查是否已存在此菜单的权限设置
    const index = permissions.findIndex((p: any) => p.menuKey === menuKey);
    
    let newPermissions = [...permissions];
    
    if (index !== -1) {
      // 更新现有权限
      newPermissions[index] = { menuKey, permission };
    } else {
      // 添加新权限
      newPermissions.push({ menuKey, permission });
    }
    
    setPermissions(newPermissions);
    
    // 当权限发生变化时，重置保存状态
    setSaveStatus('none');
  };

  // 获取菜单项的当前权限
  const getMenuPermission = (menuKey: string): string => {
    const permission = permissions.find((p: any) => p.menuKey === menuKey);
    return permission ? permission.permission : 'none';
  };

  // 保存角色权限配置
  const handleSavePermissions = async () => {
    if (!selectedRole) {
      message.error('请先选择角色');
      return;
    }

    try {
      setSaveLoading(true);
      setSaveStatus('none');

      console.log(`正在保存${selectedRole}角色的权限配置:`, permissions);

      const response = await fetch(`/api/roles/${selectedRole}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: permissions,
        }),
      });

      const result = await response.json();
      console.log('保存角色权限结果:', result);

      if (result.success) {
        message.success(`角色权限设置保存成功，已更新${result.data.usersUpdated || 0}个用户`);
        setSaveStatus('success');
        
        // 刷新权限信息
        fetchRolePermissions(selectedRole);
      } else {
        message.error(result.message || '保存权限设置失败');
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('保存角色权限设置失败:', error);
      message.error('保存角色权限设置失败，请重试');
      setSaveStatus('error');
    } finally {
      setSaveLoading(false);
    }
  };

  // 递归渲染菜单项及其子菜单
  const renderMenuItems = (items: any[]) => {
    return items.map(item => (
      <div key={item.key} className="mb-4">
        <div className="flex items-center justify-between mb-2 border-b pb-2">
          <span className="font-medium">
            {item.icon && React.cloneElement(item.icon)} {item.label}
          </span>
          <Select
            value={getMenuPermission(item.key)}
            onChange={(value) => handlePermissionChange(item.key, value)}
            style={{ width: 120 }}
            disabled={!selectedRole || loading}
          >
            {permissionOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
        
        {item.children && item.children.length > 0 && (
          <div className="pl-6">
            {renderMenuItems(item.children)}
          </div>
        )}
      </div>
    ));
  };

  // 获取保存状态标签
  const getSaveStatusTag = () => {
    switch (saveStatus) {
      case 'success':
        return <Tag icon={<CheckCircleOutlined />} color="success">保存成功</Tag>;
      case 'error':
        return <Tag icon={<ExclamationCircleOutlined />} color="error">保存失败</Tag>;
      default:
        return null;
    }
  };

  // 检查当前用户是否为管理员
  if (user?.role !== 'admin') {
    return (
      <Card title="权限管理">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <LockOutlined style={{ fontSize: '48px', color: '#ccc' }} />
            <p className="mt-4 text-gray-500">您没有访问此页面的权限</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <span>
          <LockOutlined className="mr-2" /> 角色权限管理
        </span>
      } 
      extra={
        <Space>
          {getSaveStatusTag()}
          <Tag color="blue" icon={<TeamOutlined />}>按角色分配权限</Tag>
        </Space>
      }
    >
      <Alert
        message="权限管理说明"
        description="在此页面，您可以为不同角色配置其权限，所有相同角色的用户将共享这些权限设置。权限更改后，该角色的所有用户都会自动更新权限，但用户需要重新登录才能应用新权限设置。"
        type="info"
        showIcon
        className="mb-6"
      />
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div style={{ width: 200 }}>
            <Select
              placeholder="请选择角色"
              style={{ width: '100%' }}
              onChange={setSelectedRole}
              value={selectedRole}
              loading={loading}
              options={roleOptions}
            />
          </div>
          
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSavePermissions}
            loading={saveLoading}
            disabled={!selectedRole || loading}
          >
            保存权限设置
          </Button>
          
          <Button
            icon={<SyncOutlined />}
            onClick={() => selectedRole && fetchRolePermissions(selectedRole)}
            disabled={!selectedRole || loading}
          >
            刷新
          </Button>
        </div>
        
        {rolePermissionInfo && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <Space direction="vertical">
              {rolePermissionInfo.isDefault && (
                <Tag color="orange">使用默认配置</Tag>
              )}
              {rolePermissionInfo.description && (
                <div><InfoCircleOutlined className="mr-1" /> {rolePermissionInfo.description}</div>
              )}
              {rolePermissionInfo.lastUpdated && (
                <div>上次更新: {new Date(rolePermissionInfo.lastUpdated).toLocaleString()}</div>
              )}
            </Space>
          </div>
        )}
      </div>

      <Spin spinning={loading}>
        {!selectedRole ? (
          <Empty description="请选择角色以管理其权限" />
        ) : permissions.length === 0 ? (
          <Empty description="暂无权限设置" />
        ) : (
          <div>{renderMenuItems(menuItems)}</div>
        )}
      </Spin>
    </Card>
  );
};

export default PermissionsPage; 