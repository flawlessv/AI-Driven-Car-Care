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

// 将 getStatusColor 移到组件外部作为工具函数
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'processing';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};


// 添加类型和状态的映射
const TYPE_MAP = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查'
};

const STATUS_MAP = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

const formatVehicleInfo = (vehicle: any) => {
  if (!vehicle) return '未知车辆';
  
  const brand = vehicle.brand || '';
  const model = vehicle.model || '';
  const licensePlate = vehicle.licensePlate || '';
  
  return (
    <>
      <span className="font-medium">{brand} {model}</span>
      {licensePlate && <span className="text-gray-500 ml-2">({licensePlate})</span>}
    </>
  );
};

const DashboardPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMaintenance, setRecentMaintenance] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [startDate, endDate] = dateRange;

        // 并行请求所有数据
        const [statsResponse, maintenanceResponse] = await Promise.all([
          // 获取仪表盘统计数据
          fetch(`/api/dashboard/stats?startDate=${startDate.format('YYYY-MM-DD')}&endDate=${endDate.format('YYYY-MM-DD')}`),
          // 获取最近保养记录
          fetch('/api/maintenance/recent')
        ]);
        
        // 单独处理预约请求以便更好地处理错误
        const appointmentsResponse = await fetch('/api/appointments/upcoming');

        // 处理统计数据
        const statsResult = await statsResponse.json();
        if (!statsResponse.ok) {
          throw new Error(statsResult.message || '获取统计数据失败');
        }

        // 处理保养记录
        const maintenanceResult = await maintenanceResponse.json();
        if (!maintenanceResponse.ok) {
          throw new Error(maintenanceResult.message || '获取保养记录失败');
        }

        // 处理预约数据
        // 检查响应状态
        if (!appointmentsResponse.ok) {
          const errorText = await appointmentsResponse.text();
          console.error('预约API返回错误状态:', appointmentsResponse.status, appointmentsResponse.statusText);
          console.log('错误响应内容:', errorText.substring(0, 200) + '...');
          throw new Error(`获取预约数据失败: HTTP ${appointmentsResponse.status}`);
        }
        
        // 解析JSON
        let appointmentsResult;
        try {
          appointmentsResult = await appointmentsResponse.json();
        } catch (error) {
          console.error('解析预约数据JSON失败:', error);
          throw new Error('获取预约数据失败: 返回格式错误');
        }

        // 更新所有状态
        setStats(statsResult.data);
        setRecentMaintenance(maintenanceResult.data);
        setUpcomingAppointments(appointmentsResult.data);

      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Spin spinning={loading} tip="Loading...">
          <div className="dashboard-content">
            <div className="welcome-section mb-6">
              <h1 className="text-2xl font-bold mb-2">欢迎回来, {user?.name || '用户'}</h1>
              <p className="text-gray-600">这里是您的汽车保养管理中心</p>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="我的车辆"
                    value={0}
                    prefix={<CarOutlined />}
                    suffix="辆"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="待处理保养"
                    value={0}
                    prefix={<ToolOutlined />}
                    suffix="项"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card>
                  <Statistic
                    title="预约服务"
                    value={0}
                    prefix={<ClockCircleOutlined />}
                    suffix="个"
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
                            <div className="font-medium">
                              {formatVehicleInfo(item.vehicle)}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {TYPE_MAP[item.type as keyof typeof TYPE_MAP] || item.type} - {' '}
                              {dayjs(item.startDate).format('YYYY-MM-DD')}
                            </div>
                          </div>
                          <Tag color={getStatusColor(item.status)}>
                            {STATUS_MAP[item.status as keyof typeof STATUS_MAP] || item.status}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                    locale={{
                      emptyText: <Empty description="暂无保养记录" />
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card 
                  title="即将到来的预约" 
                  extra={
                    <Button 
                      type="link" 
                      onClick={() => router.push('/dashboard/appointments')}
                    >
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
        </Spin>
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

  return (
    <div className="dashboard-container">
      <Spin spinning={loading} tip="Loading...">
        <div className="dashboard-content">
          <div className="welcome-section mb-6">
            <h1 className="text-2xl font-bold mb-2">欢迎回来, {user?.name || '用户'}</h1>
            <p className="text-gray-600">这里是您的汽车保养管理中心</p>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="我的车辆"
                  value={stats?.overview.totalVehicles || 0}
                  prefix={<CarOutlined />}
                  suffix="辆"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="待处理保养"
                  value={stats?.overview.pendingMaintenance || 0}
                  prefix={<ToolOutlined />}
                  suffix="项"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="预约服务"
                  value={stats?.overview.todayAppointments || 0}
                  prefix={<ClockCircleOutlined />}
                  suffix="个"
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
                          <div className="font-medium">
                            {formatVehicleInfo(item.vehicle)}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {TYPE_MAP[item.type as keyof typeof TYPE_MAP] || item.type} - {' '}
                            {dayjs(item.startDate).format('YYYY-MM-DD')}
                          </div>
                        </div>
                        <Tag color={getStatusColor(item.status)}>
                          {STATUS_MAP[item.status as keyof typeof STATUS_MAP] || item.status}
                        </Tag>
                      </div>
                    </List.Item>
                  )}
                  locale={{
                    emptyText: <Empty description="暂无保养记录" />
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title="即将到来的预约" 
                extra={
                  <Button 
                    type="link" 
                    onClick={() => router.push('/dashboard/appointments')}
                  >
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
      </Spin>
    </div>
  );
};

export default DashboardPage; 