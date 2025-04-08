import React, { ReactNode } from 'react';
import { Tooltip, Button } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { PermissionLevel } from '@/types/user';

// 定义权限项接口
interface PermissionItem {
  menuKey: string;
  permission: string;
}

interface PermissionCheckerProps {
  menuKey: string;
  requiredPermission: PermissionLevel;
  children: ReactNode;
  noPermissionTip?: string;
  buttonProps?: any;
}

/**
 * 权限检查组件 - 根据用户权限级别决定按钮是否可点击
 * 
 * @param menuKey - 菜单项标识
 * @param requiredPermission - 所需权限级别: 'read' | 'write' | 'manage'
 * @param children - 按钮内容
 * @param noPermissionTip - 无权限提示文本
 * @param buttonProps - 传递给Button的其他属性
 */
const PermissionChecker: React.FC<PermissionCheckerProps> = ({
  menuKey,
  requiredPermission,
  children,
  noPermissionTip = "您没有足够的权限执行此操作",
  buttonProps = {}
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  // 获取默认权限
  const getDefaultPermissions = (role: string): PermissionItem[] => {
    if (role === 'customer') {
      return [
        { menuKey: 'dashboard', permission: 'read' },
        { menuKey: 'vehicles', permission: 'read' },
        { menuKey: 'vehicle-list', permission: 'read' },
        { menuKey: 'vehicle-files', permission: 'read' },
        { menuKey: 'vehicle-health', permission: 'read' },
        { menuKey: 'maintenance', permission: 'read' },
        { menuKey: 'maintenance-records', permission: 'read' },
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

  // 检查权限级别是否符合要求
  const checkPermissionLevel = (permission: string): boolean => {
    switch (requiredPermission) {
      case 'read':
        return ['read', 'write', 'manage'].includes(permission);
      case 'write':
        return ['write', 'manage'].includes(permission);
      case 'manage':
        return permission === 'manage';
      default:
        return false;
    }
  };

  // 检查用户是否有权限
  const hasPermission = (): boolean => {
    // 管理员有所有权限
    if (user?.role === 'admin') {
      return true;
    }
    
    // 如果无法获取用户信息，则无权限
    if (!user) {
      return false;
    }
    
    // 如果是技师且需要parts的write权限，直接允许
    if (user.role === 'technician' && menuKey === 'parts' && 
        (requiredPermission === 'read' || requiredPermission === 'write')) {
      console.log('技师角色对配件有写入权限');
      return true;
    }
    
    // 首先检查用户是否有自定义权限配置
    if (user.permissions && user.permissions.length > 0) {
      const permission = user.permissions.find((p: PermissionItem) => p.menuKey === menuKey);
      
      // 如果找到了权限配置，根据权限级别检查
      if (permission) {
        return checkPermissionLevel(permission.permission);
      }
    }
    
    // 如果没有找到自定义权限配置，使用角色默认权限
    console.log(`用户 ${user.name || user.username} (${user.role}) 没有 ${menuKey} 的自定义权限配置，使用默认权限`);
    const defaultPermissions = getDefaultPermissions(user.role);
    const defaultPermission = defaultPermissions.find(p => p.menuKey === menuKey);
    
    // 如果找到了默认权限配置，根据权限级别检查
    if (defaultPermission) {
      console.log(`${menuKey} 的默认权限为: ${defaultPermission.permission}`);
      return checkPermissionLevel(defaultPermission.permission);
    }
    
    // 如果默认权限也没有找到，则无权限
    return false;
  };

  const isAllowed = hasPermission();

  return (
    <Tooltip title={!isAllowed ? noPermissionTip : ""}>
      <Button
        {...buttonProps}
        disabled={!isAllowed || buttonProps.disabled}
      >
        {children}
      </Button>
    </Tooltip>
  );
};

export default PermissionChecker; 