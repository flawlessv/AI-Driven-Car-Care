'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Tabs, message, Button, Select, Switch, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  ToolOutlined, 
  LockOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface Permission {
  menuKey: string;
  permission: string;
}

interface RolePermission {
  role: string;
  permissions: Permission[];
  description: string;
  isDefault: boolean;
}

// 权限级别映射
const permissionLevels = [
  { value: 'none', label: '无权限' },
  { value: 'read', label: '只读' },
  { value: 'write', label: '读写' },
  { value: 'manage', label: '管理' }
];

// 菜单名称映射
const menuKeyNameMap: { [key: string]: string } = {
  'dashboard': '仪表盘',
  'vehicles': '车辆管理',
  'vehicle-list': '车辆列表',
  'vehicle-files': '车辆档案',
  'vehicle-health': '健康评分',
  'maintenance': '保养维修',
  'maintenance-records': '维修记录',
  'maintenance-rules': '保养规则',
  'work-orders': '工单管理',
  'appointments': '预约管理',
  'technicians': '技师团队',
  'users': '用户管理',
  'parts': '配件库存',
  'reviews': '评价管理',
  'permissions': '权限管理'
};

// 角色名称映射
const roleNameMap: { [key: string]: string } = {
  'admin': '管理员',
  'technician': '技师',
  'customer': '客户'
};

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // 获取所有角色的权限配置
  const fetchRolePermissions = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        axios.get('/api/roles/admin/permissions'),
        axios.get('/api/roles/technician/permissions'),
        axios.get('/api/roles/customer/permissions'),
      ]);
      
      const allRolePermissions = responses.map(res => res.data.data);
      setRolePermissions(allRolePermissions);
      
      if (selectedRole) {
        const selectedRolePermissions = allRolePermissions.find(
          (rp: RolePermission) => rp.role === selectedRole
        );
        if (selectedRolePermissions) {
          setEditedPermissions([...selectedRolePermissions.permissions]);
        }
      }
    } catch (error) {
      console.error('获取角色权限失败:', error);
      message.error('获取角色权限失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化权限配置
  const initializePermissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/init/permissions');
      if (response.data.success) {
        message.success('初始化权限配置成功');
        fetchRolePermissions();
      } else {
        message.error(response.data.message || '初始化权限配置失败');
      }
    } catch (error) {
      console.error('初始化权限配置失败:', error);
      message.error('初始化权限配置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存角色权限配置
  const saveRolePermissions = async () => {
    if (!selectedRole || !editedPermissions.length) {
      message.warning('请先选择角色并设置权限');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/roles/${selectedRole}/permissions`, {
        permissions: editedPermissions
      });
      
      if (response.data.success) {
        message.success(`更新${roleNameMap[selectedRole] || selectedRole}权限成功`);
        setHasChanges(false);
        fetchRolePermissions();
      } else {
        message.error(response.data.message || '更新权限失败');
      }
    } catch (error) {
      console.error('保存角色权限失败:', error);
      message.error('保存角色权限失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 更改权限设置
  const handlePermissionChange = (menuKey: string, value: string) => {
    const newPermissions = editedPermissions.map(p => 
      p.menuKey === menuKey ? { ...p, permission: value } : p
    );
    
    setEditedPermissions(newPermissions);
    setHasChanges(true);
  };

  // 切换角色
  const handleRoleChange = (role: string) => {
    if (hasChanges) {
      // 如果有未保存的更改，提示用户
      if (window.confirm('您有未保存的更改，是否继续切换？')) {
        setSelectedRole(role);
        const selectedRolePermissions = rolePermissions.find(
          (rp: RolePermission) => rp.role === role
        );
        if (selectedRolePermissions) {
          setEditedPermissions([...selectedRolePermissions.permissions]);
          setHasChanges(false);
        }
      }
    } else {
      setSelectedRole(role);
      const selectedRolePermissions = rolePermissions.find(
        (rp: RolePermission) => rp.role === role
      );
      if (selectedRolePermissions) {
        setEditedPermissions([...selectedRolePermissions.permissions]);
      }
    }
  };

  // 组件挂载时加载权限配置
  useEffect(() => {
    fetchRolePermissions();
  }, []);

  // 渲染权限表格列
  const columns = [
    {
      title: '菜单项',
      dataIndex: 'menuKey',
      key: 'menuKey',
      render: (text: string) => menuKeyNameMap[text] || text,
    },
    {
      title: '权限级别',
      dataIndex: 'permission',
      key: 'permission',
      render: (text: string, record: Permission) => (
        <Select
          value={text}
          style={{ width: 120 }}
          onChange={(value) => handlePermissionChange(record.menuKey, value)}
          disabled={loading}
        >
          {permissionLevels.map(level => (
            <Option key={level.value} value={level.value}>
              {level.label}
            </Option>
          ))}
        </Select>
      ),
    }
  ];

  return (
    <div className="p-4">
      <Card title={
        <div className="flex justify-between items-center">
          <Title level={4} className="m-0 flex items-center">
            <LockOutlined className="mr-2" />权限管理
          </Title>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={initializePermissions}
            loading={loading}
          >
            重置所有权限配置
          </Button>
        </div>
      }>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><TeamOutlined />角色权限</span>} 
            key="roles"
          >
            <div className="mb-4 flex justify-between items-center">
              <Space>
                <Text strong>选择角色：</Text>
                <Select 
                  value={selectedRole} 
                  onChange={handleRoleChange}
                  style={{ width: 150 }}
                  disabled={loading}
                >
                  {rolePermissions.map((rp: RolePermission) => (
                    <Option key={rp.role} value={rp.role}>
                      {roleNameMap[rp.role] || rp.role}
                    </Option>
                  ))}
                </Select>
              </Space>
              
              <Button 
                type="primary" 
                onClick={saveRolePermissions} 
                disabled={!hasChanges || loading}
                loading={loading}
              >
                保存权限配置
              </Button>
            </div>

            <Table 
              dataSource={editedPermissions} 
              columns={columns}
              rowKey="menuKey"
              pagination={false}
              loading={loading}
              locale={{ emptyText: '暂无权限数据' }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
} 