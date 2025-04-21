/**
 * 权限检查组件
 * 
 * 这个组件用于根据当前用户的权限决定是否允许执行特定操作
 * 主要用于控制UI元素（如按钮）的可用状态
 */
import React, { ReactNode } from 'react';
import { Tooltip, Button } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import type { PermissionLevel } from '@/types/user';

/**
 * 权限项接口定义
 * 
 * @property {string} menuKey - 菜单项标识
 * @property {string} permission - 权限级别
 */
interface PermissionItem {
  menuKey: string;
  permission: string;
}

/**
 * 权限检查组件的属性接口
 * 
 * @property {string} menuKey - 菜单项标识
 * @property {PermissionLevel} requiredPermission - 所需权限级别
 * @property {ReactNode} children - 子组件（通常是按钮内容）
 * @property {string} noPermissionTip - 无权限提示文本
 * @property {any} buttonProps - 传递给Button组件的额外属性
 */
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
 * @param {PermissionCheckerProps} props - 组件属性
 * @returns {JSX.Element} 返回带有权限控制的按钮组件
 */
const PermissionChecker: React.FC<PermissionCheckerProps> = ({
  menuKey,
  requiredPermission,
  children,
  noPermissionTip = "您没有足够的权限执行此操作",
  buttonProps = {}
}) => {
  // 从Redux状态获取当前用户信息
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * 获取角色的默认权限配置
   * 
   * @param {string} role - 用户角色
   * @returns {PermissionItem[]} 权限项数组
   */
  const getDefaultPermissions = (role: string): PermissionItem[] => {
    // 客户角色默认权限
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
    } 
    // 技师角色默认权限
    else if (role === 'technician') {
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
    // 其他角色默认无权限
    return [];
  };

  /**
   * 检查权限级别是否满足所需权限
   * 
   * @param {string} permission - 用户拥有的权限级别
   * @returns {boolean} 是否满足所需权限级别
   */
  const checkPermissionLevel = (permission: string): boolean => {
    switch (requiredPermission) {
      case 'read': // 读取权限 - 拥有read、write或manage权限即可
        return ['read', 'write', 'manage'].includes(permission);
      case 'write': // 写入权限 - 需要write或manage权限
        return ['write', 'manage'].includes(permission);
      case 'manage': // 管理权限 - 仅manage权限可满足
        return permission === 'manage';
      default:
        return false;
    }
  };

  /**
   * 检查用户是否具有所需的权限
   * 
   * @returns {boolean} 用户是否有权限
   */
  const hasPermission = (): boolean => {
    // 管理员拥有所有权限
    if (user?.role === 'admin') {
      return true;
    }
    
    // 如果无法获取用户信息，则无权限
    if (!user) {
      return false;
    }
    
    // 技师对配件的特殊处理：技师对配件有读写权限
    if (user.role === 'technician' && menuKey === 'parts' && 
        (requiredPermission === 'read' || requiredPermission === 'write')) {
      console.log('技师角色对配件有写入权限');
      return true;
    }
    
    // 首先检查用户是否有自定义权限配置
    if (user.permissions && user.permissions.length > 0) {
      // 查找指定菜单的权限设置
      const permission = user.permissions.find((p: PermissionItem) => p.menuKey === menuKey);
      
      // 如果找到了该菜单的权限配置，检查权限级别
      if (permission) {
        return checkPermissionLevel(permission.permission);
      }
    }
    
    // 如果没有找到自定义权限配置，使用角色默认权限
    console.log(`用户 ${user.name || user.username} (${user.role}) 没有 ${menuKey} 的自定义权限配置，使用默认权限`);
    // 获取角色的默认权限列表
    const defaultPermissions = getDefaultPermissions(user.role);
    // 在默认权限中查找指定菜单的权限设置
    const defaultPermission = defaultPermissions.find(p => p.menuKey === menuKey);
    
    // 如果找到默认权限设置，检查权限级别
    if (defaultPermission) {
      console.log(`${menuKey} 的默认权限为: ${defaultPermission.permission}`);
      return checkPermissionLevel(defaultPermission.permission);
    }
    
    // 如果默认权限中也没有找到对应配置，则无权限
    return false;
  };

  // 检查用户是否有权限
  const isAllowed = hasPermission();

  // 返回带有权限控制的按钮
  // 如果无权限，显示提示信息并禁用按钮
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