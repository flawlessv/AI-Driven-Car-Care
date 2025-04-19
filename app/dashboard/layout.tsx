'use client';

import { Layout, Menu, Avatar, Dropdown, Button, theme, message, Badge, Space } from 'antd';
import type { MenuProps, DropdownProps } from 'antd';
import {
  HomeOutlined,
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import { logout } from '@/app/lib/store/slices/authSlice';
import { menuItems } from '@/app/config/menu';

const { Header, Sider, Content } = Layout;

// 定义用户菜单项类型
type UserMenuItemNormal = {
  key: string;
  icon?: React.ReactNode;
  label: string;
  danger?: boolean;
};

type UserMenuItemDivider = {
  type: 'divider';
  key: string;
};

type UserMenuItem = UserMenuItemNormal | UserMenuItemDivider;

// 修改用户菜单定义
const userMenu: UserMenuItem[] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: '个人资料',
  },
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '返回首页',
  },
  {
    type: 'divider',
    key: 'divider-1',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '退出登录',
    danger: true,
  },
];

const getDefaultPermissions = (role: string) => {
  if (role === 'customer') {
    return [
      { menuKey: 'dashboard', permission: 'read' },
      { menuKey: 'vehicles', permission: 'read' },
      { menuKey: 'vehicle-list', permission: 'read' },
      { menuKey: 'vehicle-files', permission: 'read' },
      { menuKey: 'vehicle-health', permission: 'read' },
      { menuKey: 'maintenance', permission: 'none' },
      { menuKey: 'maintenance-records', permission: 'none' },
      { menuKey: 'maintenance-rules', permission: 'none' },
      { menuKey: 'work-orders', permission: 'read' },
      { menuKey: 'appointments', permission: 'write' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'users', permission: 'none' },
      { menuKey: 'parts', permission: 'none' },
      { menuKey: 'reviews', permission: 'write' },
      { menuKey: 'permissions', permission: 'none' }
    ];
  } else if (role === 'technician') {
    return [
      { menuKey: 'dashboard', permission: 'read' },
      { menuKey: 'vehicles', permission: 'read' },
      { menuKey: 'vehicle-list', permission: 'read' },
      { menuKey: 'vehicle-files', permission: 'read' },
      { menuKey: 'vehicle-health', permission: 'read' },
      { menuKey: 'maintenance', permission: 'write' },
      { menuKey: 'maintenance-records', permission: 'write' },
      { menuKey: 'maintenance-rules', permission: 'read' },
      { menuKey: 'work-orders', permission: 'read' },
      { menuKey: 'appointments', permission: 'read' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'users', permission: 'none' },
      { menuKey: 'parts', permission: 'write' },
      { menuKey: 'reviews', permission: 'read' },
      { menuKey: 'permissions', permission: 'none' }
    ];
  }
  return [];
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary },
  } = theme.useToken();

  console.log('Current user:', user);

  const handleMenuClick = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        router.push('/dashboard/profile');
        break;
      case 'home':
        window.location.href = '/home';
        break;
      case 'logout':
        try {
          // 1. 调用退出登录 API
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // 包含 cookies
          });

          if (!response.ok) {
            throw new Error('退出登录失败');
          }

          // 2. 清除 Redux store 状态
          dispatch(logout());

          // 3. 显示成功消息
          message.success('已安全退出系统');

          // 4. 跳转到登录页
          window.location.href = '/login';
        } catch (error) {
          console.error('退出登录失败:', error);
          message.error('退出登录失败，请重试');
        }
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
        }}
        width={220}
      >
        <div className="flex items-center justify-center py-6 px-4">
          <Link href="/dashboard">
            <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : 'justify-start'}`}>
              <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white font-bold text-lg mr-2">
                佳
              </div>
              <h1 className={`text-lg font-bold transition-opacity duration-200 text-blue-600 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                佳伟汽车管理系统
              </h1>
            </div>
          </Link>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname.split('/')[2] || 'dashboard']}
          defaultOpenKeys={[]}
          style={{ 
            borderRight: 'none',
            padding: '8px 0'
          }}
          className="dashboard-menu"
          items={menuItems
            // 过滤菜单项：管理员可见全部，非管理员根据权限控制
            .filter(item => {
              // 添加日志查看用户信息和权限
              console.log('菜单过滤 - 当前用户:', {
                role: user?.role,
                hasPermissions: !!user?.permissions,
                permissionsCount: user?.permissions?.length || 0,
                userId: user?._id,
                itemKey: item.key
              });
              
              // 如果是管理员，显示所有菜单
              if (user?.role === 'admin') {
                console.log(`菜单项 ${item.key} - 管理员可见`);
                return true;
              }
              
              // 如果是管理员专属菜单，则不显示
              if ('adminOnly' in item && item.adminOnly) {
                console.log(`菜单项 ${item.key} - 管理员专属，非管理员不可见`);
                return false;
              }

              // 如果用户有权限配置，根据权限配置判断（优先使用管理员分配的权限）
              let permission;
              if (user?.permissions && user.permissions.length > 0) {
                permission = user.permissions.find((p: { menuKey: string; permission: string }) => p.menuKey === item.key);
                console.log(`菜单项 ${item.key} - 用户自定义权限设置:`, permission);
                
                // 如果找到了权限设置，直接使用，无论是什么项目（包括dashboard）
                if (permission) {
                  // 如果权限是none，不显示
                  if (permission.permission === 'none') {
                    console.log(`菜单项 ${item.key} - 用户自定义权限为none，不显示`);
                    return false;
                  }
                  
                  console.log(`菜单项 ${item.key} - 用户自定义权限(${permission.permission})，显示`);
                  return true;
                }
              }
              
              // 如果没有找到用户自定义权限，才使用默认权限
              console.log(`菜单项 ${item.key} - 用户无自定义权限，使用默认`);
              // 使用角色默认权限
              const defaultPermissions = getDefaultPermissions(user?.role || '');
              permission = defaultPermissions.find(p => p.menuKey === item.key);
              console.log(`菜单项 ${item.key} - 默认权限:`, permission);
              
              // 无权限则不显示（包括默认权限）
              if (!permission || permission.permission === 'none') {
                console.log(`菜单项 ${item.key} - 无权限或权限为none，不显示`);
                return false;
              }
              
              // 有权限才显示
              console.log(`菜单项 ${item.key} - 有默认权限(${permission.permission})，显示`);
              return true;
            })
            .map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => {
                console.log(`点击菜单项: ${item.key}`);
                // 只有没有子菜单的项目才需要导航
                if (!item.children) {
                  const menuItem = menuItems.find(mi => mi.key === item.key);
                  if (menuItem && 'path' in menuItem) {
                    console.log(`导航到路径: ${menuItem.path}`);
                    handleMenuClick(menuItem.path as string);
                  }
                }
              },
              children: item.children?.map(child => {
                // 对子菜单项进行权限过滤
                console.log(`处理子菜单 ${child.key}`);
                
                if (user?.role !== 'admin') {
                  let permission;
                  
                  // 先检查用户自定义权限
                  if (user?.permissions && user.permissions.length > 0) {
                    permission = user.permissions.find((p: { menuKey: string; permission: string }) => p.menuKey === child.key);
                    console.log(`子菜单项 ${child.key} - 用户自定义权限设置:`, permission);
                    
                    // 如果找到了权限设置，无论什么项目直接使用
                    if (permission) {
                      // 如果权限是none，不显示
                      if (permission.permission === 'none') {
                        console.log(`子菜单项 ${child.key} - 用户自定义权限为none，不显示`);
                        return null;
                      }
                      
                      console.log(`子菜单项 ${child.key} - 用户有自定义权限(${permission.permission})，显示`);
                      // 返回子菜单项并添加onClick事件
                      return {
                        key: child.key,
                        label: child.label,
                        onClick: () => {
                          console.log(`点击子菜单项: ${child.key}`);
                          const parentItem = menuItems.find(mi => mi.key === item.key);
                          const childItem = parentItem?.children?.find(c => c.key === child.key);
                          if (childItem && 'path' in childItem) {
                            console.log(`导航到路径: ${childItem.path}`);
                            handleMenuClick(childItem.path as string);
                          }
                        }
                      };
                    }
                  }
                  
                  // 如果没有找到自定义权限，使用默认权限
                  const defaultPermissions = getDefaultPermissions(user?.role || '');
                  permission = defaultPermissions.find(p => p.menuKey === child.key);
                  console.log(`子菜单项 ${child.key} - 默认权限:`, permission);
                  
                  // 如果权限是none或未找到权限，不显示
                  if (!permission || permission.permission === 'none') {
                    console.log(`子菜单项 ${child.key} - 默认权限为none或未找到权限，不显示`);
                    return null;
                  }
                }
                
                // 返回子菜单项并添加onClick事件
                return {
                  key: child.key,
                  label: child.label,
                  onClick: () => {
                    console.log(`点击子菜单项: ${child.key}`);
                    const parentItem = menuItems.find(mi => mi.key === item.key);
                    const childItem = parentItem?.children?.find(c => c.key === child.key);
                    if (childItem && 'path' in childItem) {
                      console.log(`导航到路径: ${childItem.path}`);
                      handleMenuClick(childItem.path as string);
                    }
                  }
                };
              }).filter(Boolean), // 过滤掉null的子菜单
            }))}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: 0, 
          background: colorBgContainer,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 998,
          height: 64
        }}
        className="dashboard-header"
        >
          <div className="flex justify-between items-center h-full px-6">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
              }}
            />
            <div className="flex items-center space-x-4">
              <Dropdown
                menu={{
                  items: userMenu.map(item => {
                    if ('type' in item && item.type === 'divider') {
                      return { type: 'divider', key: item.key };
                    }
                    
                    const normalItem = item as UserMenuItemNormal;
                    return {
                      key: normalItem.key,
                      icon: normalItem.icon,
                      label: normalItem.label,
                      danger: normalItem.danger,
                      onClick: () => handleUserMenuClick({ key: normalItem.key }),
                    };
                  }) as MenuProps['items'],
                }}
                placement="bottomRight"
                arrow
                overlayClassName="user-dropdown-menu"
              >
                <div className="flex items-center cursor-pointer hover:bg-gray-50  rounded-full transition-colors dashboard-header-avatar">
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: colorPrimary }}
                    size="small"
                    className="mr-2"
                  />
                  <span className="mr-1 font-medium max-w-[100px] truncate">
                    { user?.username || '用户'}
                  </span>
                  <SettingOutlined style={{ fontSize: '12px', opacity: 0.7 }} />
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 0,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'hidden',
          }}
          className="page-transition"
        >
          <div className="p-6">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
} 