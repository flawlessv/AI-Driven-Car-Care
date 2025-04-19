/**
 * 仪表盘页面组件
 * 
 * 这个文件实现了系统的主仪表盘页面，显示各种统计数据和图表
 * 'use client' 标记表示在浏览器端运行
 */
'use client';

// 导入React相关钩子，用于状态管理和副作用
import React, { useState, useEffect } from 'react';
// 导入Ant Design组件，用于构建用户界面
import {
  Card,       // 卡片容器
  Row,        // 行布局
  Col,        // 列布局
  Statistic,  // 统计数字
  Spin,       // 加载动画
  message,    // 消息提示
  Typography, // 文字排版
  Divider,    // 分割线
} from 'antd';
// 导入图标组件
import {
  CarOutlined,               // 汽车图标
  ToolOutlined,              // 工具图标
  CheckCircleOutlined,       // 勾选图标
  ClockCircleOutlined,       // 时钟图标
  UserOutlined,              // 用户图标
  AppstoreOutlined,          // 应用图标
  ExclamationCircleOutlined, // 警告图标
} from '@ant-design/icons';
// 导入饼图组件
import { Pie } from '@ant-design/plots';
// 导入Redux相关
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';

// 从Typography组件中解构出Title和Text组件
const { Title, Text } = Typography;

/**
 * 不同工单状态对应的颜色
 * pending: 黄色 - 待处理
 * assigned: 蓝色 - 已分配
 * in_progress: 亮蓝色 - 进行中
 * pending_check: 紫色 - 待审核
 * completed: 绿色 - 已完成
 * cancelled: 灰色 - 已取消
 */
const STATUS_COLORS = {
  pending: '#faad14',
  assigned: '#1677ff',
  in_progress: '#1890ff',
  pending_check: '#722ed1',
  completed: '#52c41a',
  cancelled: '#d9d9d9',
};

/**
 * 不同工单类型对应的颜色
 * regular: 蓝色 - 常规保养
 * repair: 粉色 - 维修
 * inspection: 绿色 - 检查
 * maintenance: 紫色 - 保养
 * emergency: 橙色 - 紧急维修
 */
const TYPE_COLORS = {
  regular: '#1890ff',
  repair: '#eb2f96',
  inspection: '#52c41a',
  maintenance: '#722ed1',
  emergency: '#fa541c',
};

/**
 * 不同配件类型对应的颜色
 * engine: 蓝色 - 发动机
 * transmission: 粉色 - 变速箱
 * brake: 绿色 - 刹车系统
 * electrical: 紫色 - 电气系统
 * body: 橙色 - 车身部件
 * other: 浅橙色 - 其他配件
 */
const PART_CATEGORY_COLORS = {
  engine: '#1890ff',
  transmission: '#eb2f96',
  brake: '#52c41a',
  electrical: '#722ed1',
  body: '#fa541c',
  other: '#fa8c16',
};

/**
 * 仪表盘数据类型接口
 * 定义了从服务器获取的仪表盘数据的结构
 */
interface DashboardDataType {
  username: string;  // 用户名
  overview: {  // 概览数据
    vehicles: {  // 车辆统计
      total: number;  // 车辆总数
      active: number;  // 活跃车辆
      inMaintenance: number;  // 维修中车辆
    };
    appointments: {  // 预约统计
      total: number;  // 预约总数
      pending: number;  // 待处理预约
      today: number;  // 今日预约
    };
    workOrders: {  // 工单统计
      total: number;  // 工单总数
      pending: number;  // 待处理工单
      inProgress: number;  // 进行中工单
      completed: number;  // 已完成工单
      thisMonth: number;  // 本月工单
    };
    technicians: {  // 技师统计
      total: number;  // 技师总数
      active: number;  // 活跃技师
    };
    parts: {  // 配件统计
      total: number;  // 配件总数
      lowStock: number;  // 低库存配件
      outOfStock: number;  // 缺货配件
    };
  };
  charts: {  // 图表数据
    workOrderStatus: {  // 工单状态分布
      status: string;  // 状态
      count: number;   // 数量
    }[];
    workOrderTypes: {  // 工单类型分布
      type: string;  // 类型
      count: number;  // 数量
    }[];
    partCategories: {  // 配件类型分布
      category: string;  // 类别
      count: number;     // 数量
    }[];
  };
}

/**
 * 仪表盘页面组件
 * 展示系统概览和数据统计图表
 */
export default function DashboardPage() {
  // 状态管理：记录是否正在加载数据
  const [loading, setLoading] = useState(true);
  // 状态管理：存储仪表盘数据
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  // 获取当前用户信息
  const { user } = useSelector((state: RootState) => state.auth);

  /**
   * 工单状态的中文映射
   * 将英文状态转换为用户友好的中文显示
   */
  const statusMap: Record<string, string> = {
    'pending': '待处理',
    'assigned': '已分配',
    'in_progress': '进行中',
    'pending_check': '待审核',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  /**
   * 工单类型的中文映射
   * 将英文类型转换为用户友好的中文显示
   */
  const typeMap: Record<string, string> = {
    'regular': '常规保养',
    'repair': '维修',
    'inspection': '检查',
    'maintenance': '保养',
    'emergency': '紧急维修'
  };

  /**
   * 配件类型的中文映射
   * 将英文类型转换为用户友好的中文显示
   */
  const partCategoryMap: Record<string, string> = {
    'engine': '发动机',
    'transmission': '变速箱',
    'brake': '刹车系统',
    'electrical': '电气系统',
    'body': '车身部件',
    'other': '其他配件'
  };

  /**
   * 使用useEffect钩子在组件挂载时获取仪表盘数据
   */
  useEffect(() => {
    /**
     * 获取仪表盘数据的异步函数
     * 向服务器发送请求，获取统计数据
     */
    const fetchDashboardData = async () => {
      try {
        // 设置加载状态为true，显示加载动画
        setLoading(true);
        // 向服务器发送获取仪表盘数据的请求
        const response = await fetch('/api/dashboard/stats');
        
        // 记录API响应状态
        console.log('API响应状态:', response.status);
        
        // 如果响应状态为401（未授权），则显示错误消息
        if (response.status === 401) {
          message.error('您未登录或登录已过期，请重新登录');
          setLoading(false);
          return;
        }
        
        // 如果响应不成功，抛出错误
        if (!response.ok) {
          throw new Error('获取仪表盘数据失败');
        }
        
        // 解析返回的JSON数据
        const result = await response.json();
        // 记录仪表盘数据，用于调试
        console.log('仪表盘数据:', result);
        
        // 检查返回的数据格式是否正确
        if (!result.data) {
          message.error('服务器返回的数据格式不正确');
          setLoading(false);
          return;
        }
        
        // 更新仪表盘数据状态
        setDashboardData(result.data);
      } catch (error) {
        // 捕获并处理任何可能发生的错误
        console.error('加载仪表盘数据失败:', error);
        message.error('加载仪表盘数据失败，请稍后再试');
      } finally {
        // 无论成功还是失败，都设置加载状态为false，隐藏加载动画
        setLoading(false);
      }
    };

    // 调用获取仪表盘数据的函数
    fetchDashboardData();
  }, []); // 空依赖数组表示只在组件挂载时执行一次

  // 准备默认图表数据（当没有数据时显示）
  const emptyPieData = [{ type: '暂无数据', value: 1 }];
  
  // 工单状态饼图配置
  const workOrderStatusConfig = {
    // 使用dashboardData中的数据，如果没有数据则使用emptyPieData
    data: dashboardData?.charts?.workOrderStatus?.length 
      ? dashboardData.charts.workOrderStatus.map(item => ({
          type: statusMap[item.status] || item.status,  // 转换为中文状态
          value: item.count,  // 数量
          status: item.status // 保存原始状态用于颜色映射
        }))
      : emptyPieData.map(item => ({
          type: item.type,
          value: item.value,
          status: 'none'
        })),
    angleField: 'value',  // 数值字段
    colorField: 'type',   // 颜色字段
    radius: 0.8,          // 饼图半径
    legend: {  // 图例配置
      position: 'bottom',     // 位置在底部
      layout: 'horizontal',   // 水平布局
      itemName: {
        style: {
          fontSize: 12        // 字体大小
        }
      }
    },
    meta: {
      type: {
        alias: '状态'
      },
      value: {
        alias: '数量',
        formatter: (v: number) => `${v} 个`
      }
    },
    label: {  // 标签配置
      type: 'inner',             // 内部标签
      offset: '-30%',            // 偏移量
      content: ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`,  // 显示百分比
      style: {
        textAlign: 'center',
        fontSize: 14,
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
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '14px'
        },
        formatter: () => '工单状态',
      },
    },
  };

  // 工单类型饼图配置
  const workOrderTypeConfig = {
    data: dashboardData?.charts?.workOrderTypes?.length 
      ? dashboardData.charts.workOrderTypes.map(item => ({
          type: typeMap[item.type] || item.type,
          value: item.count,
          originalType: item.type  // 保存原始类型用于颜色映射
        }))
      : emptyPieData.map(item => ({
          type: item.type,
          value: item.value,
          originalType: 'none'
        })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    legend: {
      position: 'bottom',
      layout: 'horizontal',
      itemName: {
        style: {
          fontSize: 12
        }
      }
    },
    meta: {
      type: {
        alias: '类型'
      },
      value: {
        alias: '数量',
        formatter: (v: number) => `${v} 个`
      }
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
    interactions: [{ type: 'element-active' }],
    color: (datum: any) => {
      if (datum.type === '暂无数据') return '#c0c0c0';
      const type = Object.keys(typeMap).find(
        key => typeMap[key] === datum.type
      );
      return type ? TYPE_COLORS[type as keyof typeof TYPE_COLORS] : '#d9d9d9';
    },
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '14px'
        },
        formatter: () => '工单类型',
      },
    },
  };

  // 配件类型饼图配置
  const partCategoryConfig = {
    data: dashboardData?.charts?.partCategories?.length 
      ? dashboardData.charts.partCategories.map(item => ({
          category: partCategoryMap[item.category] || item.category,
          value: item.count,
          originalCategory: item.category  // 保存原始类别用于颜色映射
        }))
      : emptyPieData.map(item => ({ 
          category: item.type, 
          value: item.value,
          originalCategory: 'none'
        })),
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    legend: {
      position: 'bottom',
    },
    meta: {
      category: {
        alias: '类型'
      },
      value: {
        alias: '数量',
        formatter: (v: number) => `${v} 个`
      }
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
    interactions: [{ type: 'element-active' }],
    color: (datum: any) => {
      if (datum.category === '暂无数据') return '#c0c0c0';
      const category = Object.keys(partCategoryMap).find(
        key => partCategoryMap[key] === datum.category
      );
      return category ? PART_CATEGORY_COLORS[category as keyof typeof PART_CATEGORY_COLORS] : '#d9d9d9';
    },
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
    <div>
      <div className="page-title">
        <h1>仪表盘</h1>
        <div className="description">
          欢迎回来，{dashboardData?.username || '用户'}！以下是系统概览数据。
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="加载中..." />
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-wrapper">
                <Card className="dashboard-card" bordered={false}>
                  <Statistic
                    title={<div className="font-medium text-gray-600">车辆总数</div>}
                    value={dashboardData?.overview.vehicles.total || 0}
                    prefix={<CarOutlined className="text-blue-500 mr-1" />}
                    valueStyle={{ color: '#1890ff', fontWeight: 500 }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    其中 <span className="text-green-500 font-medium">{dashboardData?.overview.vehicles.active || 0}</span> 辆正常,
                    <span className="text-orange-500 font-medium"> {dashboardData?.overview.vehicles.inMaintenance || 0}</span> 辆维修中
                  </div>
                </Card>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-wrapper">
                <Card className="dashboard-card" bordered={false}>
                  <Statistic
                    title={<div className="font-medium text-gray-600">当前预约</div>}
                    value={dashboardData?.overview.appointments.pending || 0}
                    prefix={<ClockCircleOutlined className="text-orange-500 mr-1" />}
                    valueStyle={{ color: '#faad14', fontWeight: 500 }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    今天有 <span className="text-orange-500 font-medium">{dashboardData?.overview.appointments.today || 0}</span> 个预约,
                    累计 <span className="text-gray-700 font-medium">{dashboardData?.overview.appointments.total || 0}</span> 个
                  </div>
                </Card>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-wrapper">
                <Card className="dashboard-card" bordered={false}>
                  <Statistic
                    title={<div className="font-medium text-gray-600">工单处理</div>}
                    value={dashboardData?.overview.workOrders.inProgress || 0}
                    prefix={<ToolOutlined className="text-purple-500 mr-1" />}
                    valueStyle={{ color: '#722ed1', fontWeight: 500 }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    待处理 <span className="text-orange-500 font-medium">{dashboardData?.overview.workOrders.pending || 0}</span> 个,
                    已完成 <span className="text-green-500 font-medium">{dashboardData?.overview.workOrders.completed || 0}</span> 个
                  </div>
                </Card>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="stat-card-wrapper">
                <Card className="dashboard-card" bordered={false}>
                  <Statistic
                    title={<div className="font-medium text-gray-600">配件库存</div>}
                    value={dashboardData?.overview.parts.total || 0}
                    prefix={<AppstoreOutlined className="text-cyan-500 mr-1" />}
                    valueStyle={{ color: '#13c2c2', fontWeight: 500 }}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {dashboardData?.overview.parts.lowStock ? (
                      <>
                        <ExclamationCircleOutlined className="text-red-500 mr-1" />
                        <span className="text-red-500 font-medium">{dashboardData?.overview.parts.lowStock || 0}</span> 个配件库存不足
                      </>
                    ) : (
                      <span className="text-green-500">库存充足</span>
                    )}
                  </div>
                </Card>
              </div>
            </Col>
          </Row>

          {/* 图表卡片 - 仅管理员和技师可见 */}
          {user?.role !== 'customer' && (
            <Row gutter={[16, 16]} className="mt-6">
              <Col xs={24} lg={12}>
                <Card 
                  title="工单状态分布" 
                  className="chart-card" 
                  bordered={false}
                >
                  <div className="h-64">
                    <Pie {...workOrderStatusConfig} />
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card 
                  title="工单类型分布" 
                  className="chart-card" 
                  bordered={false}
                >
                  <div className="h-64">
                    <Pie {...workOrderTypeConfig} />
                  </div>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
} 