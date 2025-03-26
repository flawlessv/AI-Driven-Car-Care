import React from 'react';
import {
  CarOutlined,
  ToolOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  MessageOutlined,
  LockOutlined,
} from '@ant-design/icons';

// 菜单项定义
export const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'vehicles',
    icon: <CarOutlined />,
    label: '车辆管理',
    children: [
      {
        key: 'vehicle-list',
        label: '车辆列表',
        path: '/dashboard/vehicles',
      },
      {
        key: 'vehicle-files',
        label: '车辆档案',
        path: '/dashboard/vehicles/files',
      },
      {
        key: 'vehicle-health',
        label: '健康评分',
        path: '/dashboard/vehicles/health',
      },
    ],
  },
  {
    key: 'maintenance',
    icon: <ToolOutlined />,
    label: '保养维修',
    children: [
      {
        key: 'maintenance-records',
        label: '维修记录',
        path: '/dashboard/maintenance',
      },
      {
        key: 'maintenance-rules',
        label: '保养规则',
        path: '/dashboard/maintenance/rules',
      },
    ],
  },
  {
    key: 'appointments',
    icon: <CalendarOutlined />,
    label: '预约管理',
    path: '/dashboard/appointments',
  },
  {
    key: 'technicians',
    icon: <TeamOutlined />,
    label: '技师团队',
    path: '/dashboard/technicians',
  },
  {
    key: 'users',
    icon: <UserOutlined />,
    label: '用户管理',
    path: '/dashboard/users',
  },
  {
    key: 'parts',
    icon: <AppstoreOutlined />,
    label: '配件库存',
    path: '/dashboard/parts',
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: '统计报表',
    children: [
      {
        key: 'maintenance-stats',
        label: '维修统计',
        path: '/dashboard/reports/maintenance',
      },
      {
        key: 'revenue-stats',
        label: '收入统计',
        path: '/dashboard/reports/revenue',
      },
      {
        key: 'customer-analysis',
        label: '客户分析',
        path: '/dashboard/reports/customers',
      },
    ],
  },
  {
    key: 'reviews',
    icon: <MessageOutlined />,
    label: '评价管理',
    path: '/dashboard/reviews',
  },
  // 权限管理菜单
  {
    key: 'permissions',
    icon: <LockOutlined />,
    label: '权限管理',
    path: '/dashboard/permissions',
    adminOnly: true, // 标记仅管理员可见
  },
]; 