'use client';

import { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { RootState } from '@/lib/store';
import { menuItems } from '@/app/config/menu';
import type { MenuItem } from '@/app/config/menu';
import type { PermissionType } from '@/types/user';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: PermissionType;
  menuKey?: string;
}

/**
 * 权限守卫组件
 * 用于对需要特定权限的页面进行保护
 */
const PermissionGuard = ({ 
  children, 
  requiredPermission = 'read', 
  menuKey 
}: PermissionGuardProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const pathname = usePathname();
  
  // 找出当前路径对应的菜单项
  const findMenuItemByPath = (path: string) => {
    // 先尝试直接匹配
    let menuItem = menuItems.find(item => item.path === path);
    
    // 如果没有直接匹配，尝试在子菜单中查找
    if (!menuItem) {
      for (const item of menuItems) {
        if (item.children) {
          const child = item.children.find(child => child.path === path);
          if (child) {
            return child;
          }
        }
      }
    }
    
    return menuItem;
  };
  
  // 获取当前菜单项的key
  const currentMenuKey = menuKey || findMenuItemByPath(pathname)?.key;
  
  // 检查用户是否有权限
  const hasPermission = () => {
    // 管理员有所有权限
    if (user?.role === 'admin') {
      return true;
    }
    
    // 如果没有找到对应的菜单项或没有指定menuKey，则跳过检查
    if (!currentMenuKey) {
      console.warn('未找到匹配的菜单Key，权限检查已跳过');
      return true;
    }
    
    // 检查用户权限
    if (user?.permissions && user.permissions.length > 0) {
      const permission = user.permissions.find((p: { menuKey: string; permission: string }) => p.menuKey === currentMenuKey);
      
      if (!permission) {
        // 如果没有为此菜单配置权限，默认允许访问
        return true;
      }
      
      // 根据权限级别检查
      switch (requiredPermission) {
        case 'read':
          return ['read', 'write', 'manage'].includes(permission.permission);
        case 'write':
          return ['write', 'manage'].includes(permission.permission);
        case 'manage':
          return permission.permission === 'manage';
        default:
          return false;
      }
    }
    
    // 默认允许访问
    return true;
  };
  
  if (!hasPermission()) {
    return (
      <Card title="权限不足">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <LockOutlined style={{ fontSize: '48px', color: '#ccc' }} />
            <p className="mt-4 text-gray-500">您没有足够的权限访问此页面</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return <>{children}</>;
};

export default PermissionGuard; 