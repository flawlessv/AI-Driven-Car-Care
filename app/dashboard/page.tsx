'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  DatePicker,
  Spin,
  Empty,
  message,
  List,
  Button,
} from 'antd';
import {
  CarOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  AlertOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  overview: {
    totalVehicles: number;
    totalMaintenance: number;
    completedMaintenance: number;
    pendingMaintenance: number;
    todayAppointments: number;
    monthlyRevenue: number;
    activeTechnicians: number;
    alerts: number;
  };
  maintenanceByType: {
    type: string;
    count: number;
  }[];
  maintenanceByStatus: {
    status: string;
    count: number;
  }[];
  recentMaintenance: any[];
  monthlyStats: {
    month: string;
    maintenance: number;
    revenue: number;
  }[];
}

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, [dateRange]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange;
      
      console.log('请求日期范围:', {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      });

      const response = await fetch(
        `/api/dashboard/stats?startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`
      );
      
      console.log('API响应状态:', response.status);
      const result = await response.json();
      console.log('API返回数据:', result);

      if (!response.ok) {
        throw new Error(result.message || '获取数据失败');
      }

      if (!result.data) {
        throw new Error('返回数据格式错误');
      }

      // 处理嵌套的 data 结构
      const statsData = result.data.data || result.data;
      console.log('设置状态数据:', statsData);
      
      if (!statsData.overview) {
        throw new Error('数据格式不正确');
      }

      setStats(statsData);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      message.error('获取数据失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!stats || !stats.overview) {
    return (
      <div className="p-6">
        <Empty description="暂无数据" />
      </div>
    );
  }

  console.log('Dashboard stats:', stats);

  const maintenanceTypeConfig = {
    data: stats.maintenanceByType,
    angleField: 'count',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  const monthlyStatsConfig = {
    data: stats.monthlyStats,
    xField: 'month',
    yField: 'maintenance',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  const recentMaintenanceColumns = [
    {
      title: '车辆',
      dataIndex: ['vehicle', 'licensePlate'],
      render: (text: string, record: any) => (
        <span>
          {record.vehicle.brand} {record.vehicle.model}
          <br />
          {text}
        </span>
      ),
    },
    {
      title: '维修类型',
      dataIndex: 'type',
      render: (type: string) => {
        const typeText = {
          regular: '常规保养',
          repair: '维修',
          inspection: '检查',
        };
        return typeText[type as keyof typeof typeText] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => {
        const statusColors = {
          pending: 'orange',
          in_progress: 'blue',
          completed: 'green',
          cancelled: 'red',
        };
        const statusText = {
          pending: '待处理',
          in_progress: '进行中',
          completed: '已完成',
          cancelled: '已取消',
        };
        return (
          <Tag color={statusColors[status as keyof typeof statusColors]}>
            {statusText[status as keyof typeof statusText]}
          </Tag>
        );
      },
    },
    {
      title: '技师',
      dataIndex: ['technician', 'name'],
      render: (name: string, record: any) => record.technician?.name || record.technician?.username || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const recentMaintenance = [
    {
      id: 1,
      vehicleName: '奥迪A6L',
      type: '常规保养',
      date: '2024-03-15',
      status: '已完成',
    },
    {
      id: 2,
      vehicleName: '宝马5系',
      type: '维修',
      date: '2024-03-14',
      status: '进行中',
    },
    {
      id: 3,
      vehicleName: '奔驰C级',
      type: '年检',
      date: '2024-03-13',
      status: '待处理',
    },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      vehicleName: '奥迪A6L',
      service: '机油更换',
      date: '2024-03-20 14:30',
    },
    {
      id: 2,
      vehicleName: '宝马5系',
      service: '轮胎更换',
      date: '2024-03-22 10:00',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'success';
      case '进行中':
        return 'processing';
      case '待处理':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section mb-6">
        <h1 className="text-2xl font-bold mb-2">欢迎回来, {user?.name || '用户'}</h1>
        <p className="text-gray-600">这里是您的汽车保养管理中心</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="我的车辆"
              value={3}
              prefix={<CarOutlined />}
              suffix="辆"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理保养"
              value={2}
              prefix={<ToolOutlined />}
              suffix="项"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="预约服务"
              value={1}
              prefix={<ClockCircleOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="未读消息"
              value={5}
              prefix={<BellOutlined />}
              suffix="条"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card 
            title="最近保养记录" 
            extra={
              <Button type="link" onClick={() => router.push('/dashboard/maintenance')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentMaintenance}
              renderItem={item => (
                <List.Item>
                  <div className="w-full flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item.vehicleName}</div>
                      <div className="text-gray-500 text-sm">
                        {item.type} - {item.date}
                      </div>
                    </div>
                    <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="即将到来的预约" 
            extra={
              <Button type="link" onClick={() => router.push('/appointments')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={upcomingAppointments}
              renderItem={item => (
                <List.Item>
                  <div className="w-full">
                    <div className="font-medium">{item.vehicleName}</div>
                    <div className="text-gray-500 text-sm">
                      {item.service}
                    </div>
                    <div className="text-gray-400 text-sm">
                      预约时间: {item.date}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage; 