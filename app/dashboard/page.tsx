'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  message,
  Typography,
  Divider,
} from 'antd';
import {
  CarOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';

const { Title, Text } = Typography;

// 状态颜色映射
const STATUS_COLORS = {
  pending: '#faad14',
  in_progress: '#1890ff',
  completed: '#52c41a',
  cancelled: '#d9d9d9',
};

// 工单类型颜色映射
const TYPE_COLORS = {
  regular: '#1890ff',
  repair: '#eb2f96',
  inspection: '#52c41a',
  maintenance: '#722ed1',
  emergency: '#fa541c',
};

// 配件类型颜色映射
const PART_CATEGORY_COLORS = {
  engine: '#1890ff',
  transmission: '#eb2f96',
  brake: '#52c41a',
  electrical: '#722ed1',
  body: '#fa541c',
  other: '#fa8c16',
};

interface DashboardDataType {
  username: string;
  overview: {
    vehicles: {
      total: number;
      active: number;
      inMaintenance: number;
    };
    appointments: {
      total: number;
      pending: number;
      today: number;
    };
    workOrders: {
      total: number;
      pending: number;
      inProgress: number;
      completed: number;
      thisMonth: number;
    };
    technicians: {
      total: number;
      active: number;
    };
    parts: {
      total: number;
      lowStock: number;
      outOfStock: number;
    };
  };
  charts: {
    workOrderStatus: {
      status: string;
      count: number;
    }[];
    workOrderTypes: {
      type: string;
      count: number;
    }[];
    partCategories: {
      category: string;
      count: number;
    }[];
    monthlyWorkOrders: {
      month: string;
      count: number;
    }[];
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);

  // 中文状态映射
  const statusMap: Record<string, string> = {
    'pending': '待处理',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  // 中文工单类型映射
  const typeMap: Record<string, string> = {
    'regular': '常规保养',
    'repair': '维修',
    'inspection': '检查',
    'maintenance': '保养',
    'emergency': '紧急维修'
  };

  // 中文配件类型映射
  const partCategoryMap: Record<string, string> = {
    'engine': '发动机',
    'transmission': '变速箱',
    'brake': '刹车系统',
    'electrical': '电气系统',
    'body': '车身部件',
    'other': '其他配件'
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        
        console.log('API响应状态:', response.status);
        
        if (response.status === 401) {
          message.error('您未登录或登录已过期，请重新登录');
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error('获取仪表盘数据失败');
        }
        
        const result = await response.json();
        console.log('仪表盘数据:', result); // 添加调试信息
        
        if (!result.data) {
          message.error('服务器返回的数据格式不正确');
          setLoading(false);
          return;
        }
        
        setDashboardData(result.data);
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        message.error('加载仪表盘数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 准备默认图表数据
  const emptyPieData = [{ type: '暂无数据', value: 1 }];
  const emptyColumnData = [{ month: '暂无数据', count: 0 }];
  
  // 工单状态饼图配置
  const workOrderStatusConfig = {
    data: dashboardData?.charts?.workOrderStatus?.length 
      ? dashboardData.charts.workOrderStatus.map(item => ({
          type: statusMap[item.status] || item.status,
          value: item.count,
        }))
      : emptyPieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: {
      position: 'bottom',
    },
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        textAlign: 'center',
        fontSize: 14,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.type, value: `${datum.value} 个` };
      },
    },
    interactions: [{ type: 'element-active' }],
    color: (datum: any) => {
      if (datum.type === '暂无数据') return '#c0c0c0';
      const status = Object.keys(statusMap).find(
        key => statusMap[key] === datum.type
      );
      return status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : '#d9d9d9';
    },
  };

  // 工单类型饼图配置
  const workOrderTypeConfig = {
    data: dashboardData?.charts?.workOrderTypes?.length 
      ? dashboardData.charts.workOrderTypes.map(item => ({
          type: typeMap[item.type] || item.type,
          value: item.count,
        }))
      : emptyPieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: {
      position: 'bottom',
    },
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        textAlign: 'center',
        fontSize: 14,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.type, value: `${datum.value} 个` };
      },
    },
    interactions: [{ type: 'element-active' }],
    color: (datum: any) => {
      if (datum.type === '暂无数据') return '#c0c0c0';
      const type = Object.keys(typeMap).find(
        key => typeMap[key] === datum.type
      );
      return type ? TYPE_COLORS[type as keyof typeof TYPE_COLORS] : '#d9d9d9';
    },
  };

  // 配件类型饼图配置
  const partCategoryConfig = {
    data: dashboardData?.charts?.partCategories?.length 
      ? dashboardData.charts.partCategories.map(item => ({
          category: partCategoryMap[item.category] || item.category,
          value: item.count,
        }))
      : emptyPieData.map(item => ({ category: item.type, value: item.value })),
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    legend: {
      position: 'bottom',
    },
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        textAlign: 'center',
        fontSize: 14,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.category, value: `${datum.value} 个` };
      },
    },
    interactions: [{ type: 'element-active' }],
    color: (datum: any) => {
      if (datum.category === '暂无数据') return '#c0c0c0';
      const category = Object.keys(partCategoryMap).find(
        key => partCategoryMap[key] === datum.category
      );
      return category ? PART_CATEGORY_COLORS[category as keyof typeof PART_CATEGORY_COLORS] : '#d9d9d9';
    },
  };

  // 月度工单柱状图配置
  const monthlyWorkOrdersConfig = {
    data: dashboardData?.charts?.monthlyWorkOrders?.length 
      ? dashboardData.charts.monthlyWorkOrders 
      : emptyColumnData,
    xField: 'month',
    yField: 'count',
    meta: {
      month: {
        alias: '月份',
      },
      count: {
        alias: '工单数量',
      },
    },
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        formatter: (val: string) => {
          // 转换YYYY-MM为MM月
          return val.includes('-') ? val.split('-')[1] + '月' : val;
        },
      },
    },
    yAxis: {
      title: {
        text: '工单数量',
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return { name: '工单数量', value: `${datum.count} 个` };
      },
    },
    color: '#1890ff',
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 无数据状态
  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Title level={2}>欢迎使用佳伟汽车维修管理系统</Title>
          <Text type="secondary">仪表盘数据加载失败，可能是因为网络问题或您尚未有相关数据</Text>
        </div>
        <Divider />
        <div className="flex justify-center items-center h-96 flex-col">
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
          <Title level={4}>暂无数据</Title>
          <Text type="secondary">系统未能获取到仪表盘数据，请稍后刷新页面或联系管理员</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 欢迎信息 */}
      <div className="mb-6">
        <Title level={2}>欢迎，{dashboardData?.username || '用户'}！</Title>
        <Text type="secondary">这里是您的汽车维修管理系统仪表盘</Text>
      </div>
      
      <Divider />
      
      {/* 统计卡片 */}
      <div className="mb-8">
        <Title level={4}>系统概览</Title>
        <Row gutter={[16, 16]}>
          {/* 车辆统计 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="车辆总数"
                value={dashboardData?.overview?.vehicles?.total || 0}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="mt-2 flex justify-between">
                <Text type="secondary">
                  激活: {dashboardData?.overview?.vehicles?.active || 0}
                </Text>
                <Text type="secondary">
                  维修中: {dashboardData?.overview?.vehicles?.inMaintenance || 0}
                </Text>
              </div>
            </Card>
          </Col>
          
          {/* 工单统计 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="工单总数"
                value={dashboardData?.overview?.workOrders?.total || 0}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="mt-2 flex justify-between text-xs">
                <Text type="secondary">
                  待处理: {dashboardData?.overview?.workOrders?.pending || 0}
                </Text>
                <Text type="secondary">
                  进行中: {dashboardData?.overview?.workOrders?.inProgress || 0}
                </Text>
                <Text type="secondary">
                  已完成: {dashboardData?.overview?.workOrders?.completed || 0}
                </Text>
              </div>
            </Card>
          </Col>
          
          {/* 预约统计 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="预约总数"
                value={dashboardData?.overview?.appointments?.total || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div className="mt-2 flex justify-between">
                <Text type="secondary">
                  待处理: {dashboardData?.overview?.appointments?.pending || 0}
                </Text>
                <Text type="secondary">
                  今日预约: {dashboardData?.overview?.appointments?.today || 0}
                </Text>
              </div>
            </Card>
          </Col>
          
          {/* 技师统计 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="技师总数"
                value={dashboardData?.overview?.technicians?.total || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div className="mt-2 flex justify-between">
                <Text type="secondary">
                  在岗技师: {dashboardData?.overview?.technicians?.active || 0}
                </Text>
              </div>
            </Card>
          </Col>
          
          {/* 配件统计 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="配件总数"
                value={dashboardData?.overview?.parts?.total || 0}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#eb2f96' }}
              />
              <div className="mt-2 flex justify-between">
                <Text type="secondary">
                  低库存: {dashboardData?.overview?.parts?.lowStock || 0}
                </Text>
                <Text type="secondary">
                  缺货: {dashboardData?.overview?.parts?.outOfStock || 0}
                </Text>
              </div>
            </Card>
          </Col>
          
          {/* 本月工单 */}
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Card bordered={false}>
              <Statistic
                title="本月工单"
                value={dashboardData?.overview?.workOrders?.thisMonth || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="mt-2 flex justify-center">
                <Text type="secondary">
                  当月处理的工单总数
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      
      <Divider />
      
      {/* 图表区域 - 暂时注释掉
      <div>
        <Title level={4}>数据分析与统计</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12}>
            <Card title="工单状态分布" bordered={false}>
              <div style={{ height: 300 }}>
                <Pie {...workOrderStatusConfig} />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={12}>
            <Card title="工单类型分布" bordered={false}>
              <div style={{ height: 300 }}>
                <Pie {...workOrderTypeConfig} />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={12}>
            <Card title="配件类别分布" bordered={false}>
              <div style={{ height: 300 }}>
                <Pie {...partCategoryConfig} />
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={24} md={12}>
            <Card title="半年工单趋势" bordered={false}>
              <div style={{ height: 300 }}>
                <Column {...monthlyWorkOrdersConfig} />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
      */}
    </div>
  );
} 