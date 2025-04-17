/**
 * 权限守卫组件 - 控制用户对页面的访问权限
 * 'use client' 标记表示在浏览器端运行
 */
'use client';

// 导入React的ReactNode类型，用于定义子组件
import { ReactNode } from 'react';
// 导入Redux的选择器钩子，用于从全局状态获取数据
import { useSelector } from 'react-redux';
// 导入Next.js的路由和路径钩子，用于获取当前页面路径
import { useRouter, usePathname } from 'next/navigation';
// 导入Ant Design的卡片组件，用于显示权限不足提示
import { Card } from 'antd';
// 导入锁图标组件，用于权限不足时显示
import { LockOutlined } from '@ant-design/icons';
// 导入全局状态类型，用于类型检查
import type { RootState } from '@/app/lib/store';
// 导入菜单项配置和类型
import { menuItems } from '@/app/config/menu';
import type { MenuItem } from '@/app/config/menu';
// 导入权限类型定义
import type { PermissionType } from '@/types/user';

/**
 * 权限守卫组件的属性定义
 * @property children - 被保护的页面内容
 * @property requiredPermission - 访问所需的权限类型（默认为'read'）
 * @property menuKey - 菜单项的唯一标识
 */
interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: PermissionType;
  menuKey?: string;
}

/**
 * 权限守卫组件 - 根据用户权限决定是否显示页面内容
 */
const PermissionGuard = ({ 
  children, 
  requiredPermission = 'read', // 默认需要阅读权限
  menuKey 
}: PermissionGuardProps) => {
  // 获取当前登录用户信息
  const { user } = useSelector((state: RootState) => state.auth);
  // 获取当前页面路径
  const pathname = usePathname();
  
  /**
   * 根据路径查找对应的菜单项
   * @param path - 当前页面路径
   * @returns 找到的菜单项或undefined
   */
  const findMenuItemByPath = (path: string) => {
    // 先尝试直接匹配主菜单
    let menuItem = menuItems.find(item => item.path === path);
    
    // 如果没找到，查找子菜单
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
  
  // 获取当前菜单项的标识符
  const currentMenuKey = menuKey || findMenuItemByPath(pathname)?.key;
  
  /**
   * 检查用户是否有访问权限
   * @returns 有权限返回true，无权限返回false
   */
  const hasPermission = () => {
    // 管理员拥有所有权限
    if (user?.role === 'admin') {
      return true;
    }
    
    // 如果找不到对应菜单项，则跳过检查
    if (!currentMenuKey) {
      console.warn('未找到匹配的菜单Key，权限检查已跳过');
      return true;
    }
    
    // 检查用户权限配置
    if (user?.permissions && user.permissions.length > 0) {
      // 查找当前菜单的权限设置
      const permission = user.permissions.find((p: { menuKey: string; permission: string }) => p.menuKey === currentMenuKey);
      
      // 如果没有配置，默认允许访问
      if (!permission) {
        return true;
      }
      
      // 根据权限级别检查
      switch (requiredPermission) {
        case 'read': // 读取权限
          return ['read', 'write', 'manage'].includes(permission.permission);
        case 'write': // 写入权限
          return ['write', 'manage'].includes(permission.permission);
        case 'manage': // 管理权限
          return permission.permission === 'manage';
        default:
          return false;
      }
    }
    
    // 默认允许访问
    return true;
  };
  
  // 如果没有权限，显示权限不足提示
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
  
  // 有权限时，显示页面内容
  return <>{children}</>;
};

export default PermissionGuard; 