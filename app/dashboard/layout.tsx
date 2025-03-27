'use client';

import { Layout, Menu, Avatar, Dropdown, Button, theme, message } from 'antd';
import {
  HomeOutlined,
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/lib/store';
import { logout } from '@/lib/store/slices/authSlice';
import { menuItems } from '@/app/config/menu';

const { Header, Sider, Content } = Layout;

const userMenu = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: '回到首页',
  },
  {
    key: 'logout',
    label: '退出登录',
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
      { menuKey: 'maintenance', permission: 'read' },
      { menuKey: 'maintenance-records', permission: 'read' },
      { menuKey: 'appointments', permission: 'write' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'reviews', permission: 'write' }
    ];
  } else if (role === 'technician') {
    return [
      { menuKey: 'dashboard', permission: 'read' },
      { menuKey: 'vehicles', permission: 'read' },
      { menuKey: 'maintenance', permission: 'write' },
      { menuKey: 'maintenance-records', permission: 'write' },
      { menuKey: 'maintenance-rules', permission: 'read' },
      { menuKey: 'appointments', permission: 'read' },
      { menuKey: 'technicians', permission: 'read' },
      { menuKey: 'parts', permission: 'read' },
      { menuKey: 'reviews', permission: 'read' }
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
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  console.log('Current user:', user);

  const handleMenuClick = (path: string) => {
    if (path) {
      router.push(path);
    }
  };

  const handleUserMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'home':
        router.push('/');
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
          message.success('退出登录成功');

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
        }}
      >
        <div className="p-4">
          <Link href="/">
            <h1 className={`text-xl font-bold transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
              汽车保养系统
            </h1>
          </Link>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[pathname.split('/')[2] || 'dashboard']}
          defaultOpenKeys={['vehicles', 'maintenance', 'reports']}
          onClick={({ key, keyPath }) => {
            const item = menuItems.find((item: any) => item.key === key) || 
                        menuItems.find((item: any) => item.children?.some((child: any) => child.key === key))?.children?.find((child: any) => child.key === key);
            if (item?.path) {
              handleMenuClick(item.path);
            }
          }}
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
              if (item.adminOnly) {
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
                      return {
                        key: child.key,
                        label: child.label,
                      };
                    }
                  } 
                  
                  // 如果没有找到用户自定义权限，再使用默认权限
                  const defaultPermissions = getDefaultPermissions(user?.role || '');
                  permission = defaultPermissions.find(p => p.menuKey === child.key);
                  console.log(`子菜单项 ${child.key} - 默认权限:`, permission);
                  
                  // 如果找不到权限设置或权限为none，不显示
                  if (!permission || permission.permission === 'none') {
                    console.log(`子菜单项 ${child.key} - 无权限或权限为none，不显示`);
                    return null;
                  }
                }
                
                console.log(`子菜单项 ${child.key} - 显示`);
                return {
                  key: child.key,
                  label: child.label,
                };
              }).filter(Boolean), // 过滤掉null的子菜单
            }))}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div className="flex justify-between items-center px-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <div className="flex items-center">
              <Dropdown
                menu={{
                  items: userMenu.map(item => ({
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    onClick: () => handleUserMenuClick({ key: item.key }),
                  })),
                }}
                placement="bottomRight"
              >
                <div className="flex items-center cursor-pointer">
                  <Avatar icon={<UserOutlined />} />
                  <span className="ml-2">
                    {user?.name || user?.username || '用户名'}
                  </span>
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 