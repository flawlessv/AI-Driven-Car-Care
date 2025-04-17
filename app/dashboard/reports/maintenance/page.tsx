'use client';

/**
 * 维修保养统计报表页面组件
 * 
 * 这个页面专门展示维修保养方面的详细统计数据。
 * 它会显示总维修次数、已完成和待处理的维修次数、总收入、平均费用以及服务过的车辆数。
 * 还会用表格分别按维修类型和车辆展示更详细的统计信息。
 * 用户可以通过选择日期范围来查看特定时间段的数据。
 */

import { useState, useEffect } from 'react';
import {
  Card,           // 卡片组件
  Row,            // 行布局组件
  Col,            // 列布局组件
  DatePicker,     // 日期选择器
  Statistic,      // 统计数据显示组件
  Table,          // 表格组件
  message,        // 消息提示组件
  Typography,     // 排版组件（用于标题）
} from 'antd';
import {
  ToolOutlined,         // 工具图标（代表维修）
  DollarOutlined,       // 钱图标
  CarOutlined,          // 汽车图标
  CheckCircleOutlined,  // 对勾图标（代表已完成）
  ClockCircleOutlined,  // 时钟图标（代表待处理）
} from '@ant-design/icons'; // 引入所需图标
import type { ColumnsType } from 'antd/es/table'; // 表格列类型
import dayjs from 'dayjs'; // 日期时间处理库

// 获取标题和日期范围选择器组件
const { Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * 定义维修保养报表数据的结构
 * 
 * 这个接口就像一个清单，规定了从服务器获取的维修保养报表数据应该包含哪些项目。
 */
interface MaintenanceReport {
  totalMaintenance: number;     // 总的维修保养次数
  totalRevenue: number;         // 通过维修保养获得的总收入
  avgCost: number;              // 平均每次维修保养的费用
  completedMaintenance: number; // 已经完成的维修保养次数
  pendingMaintenance: number;   // 还在等待处理或正在进行的维修保养次数
  totalVehicles: number;        // 在这个时间段内，服务过的车辆总数
  maintenanceByType: {          // 按维修类型分类的统计
    type: string;               // 维修类型（如：常规保养、维修、年检）
    count: number;              // 这种类型的维修次数
    revenue: number;            // 这种类型产生的收入
  }[];                         // 这是一个列表，包含不同类型的数据
  maintenanceByVehicle: {       // 按车辆分类的统计
    vehicle: {                  // 车辆的基本信息
      brand: string;            // 品牌
      model: string;            // 型号
      licensePlate: string;     // 车牌号
    };
    count: number;              // 这辆车在这个时间段内维修的次数
    revenue: number;            // 这辆车在这个时间段内产生的收入
  }[];                         // 这是一个列表，包含多辆车的数据
}

/**
 * 维修保养统计报表页面主组件
 * 
 * 这个函数定义了页面的外观和功能。
 */
export default function MaintenanceReportPage() {
  // --- 状态管理 --- 
  // 使用 useState 来跟踪页面上需要变化的数据

  // 加载状态，`true` 表示正在请求数据
  const [loading, setLoading] = useState(false);
  
  // 存储从服务器获取的报表数据，初始为 `null`
  const [data, setData] = useState<MaintenanceReport | null>(null);
  
  // 存储用户选择的日期范围，默认是当前月份
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'), // 当前月第一天
    dayjs().endOf('month'),   // 当前月最后一天
  ]);

  // --- 数据获取 --- 
  // 当页面加载或日期范围改变时，自动去服务器获取数据
  useEffect(() => {
    fetchReportData(); // 调用获取数据的函数
  }, [dateRange]); // 依赖项是 `dateRange`，日期变了就重新获取

  /**
   * 从服务器获取维修保养报表数据的函数
   * 
   * 会根据 `dateRange` 去请求对应时间段的数据。
   */
  const fetchReportData = async () => {
    try {
      setLoading(true); // 开始加载
      
      // 准备 API 请求地址，包含日期参数
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const apiUrl = `/api/reports/maintenance?startDate=${startDate}&endDate=${endDate}`;
      
      // 发送请求
      const response = await fetch(apiUrl);
      const result = await response.json(); // 解析返回的 JSON

      // 检查请求是否成功
      if (!response.ok) {
        throw new Error(result.message || '获取报表数据失败'); // 失败则报错
      }

      // 成功则更新页面数据
      setData(result.data);

    } catch (error: any) {
      // 如果有错误，显示提示信息
      message.error(error.message || '获取报表数据失败');
    } finally {
      // 无论如何，最后都结束加载状态
      setLoading(false);
    }
  };

  // --- 表格列定义 --- 
  // 定义两个表格的列信息

  // “维修类型统计”表格的列
  const maintenanceTypeColumns: ColumnsType<MaintenanceReport['maintenanceByType'][0]> = [
    {
      title: '维修类型', // 列标题
      dataIndex: 'type', // 对应数据字段
      key: 'type', // 唯一标识
      render: (type: string) => { // 自定义显示方式
        // 把英文类型转成中文
        const typeMap: { [key: string]: string } = {
          regular: '常规保养',
          repair: '维修',
          inspection: '年检', // 注意这里和之前的报表页面可能有点不同
        };
        return typeMap[type] || type; // 找不到就显示原始英文
      },
    },
    {
      title: '数量', // 列标题
      dataIndex: 'count', // 对应数据字段
      key: 'count', // 唯一标识
    },
    {
      title: '收入', // 列标题
      dataIndex: 'revenue', // 对应数据字段
      key: 'revenue', // 唯一标识
      render: (revenue: number) => `¥${revenue.toLocaleString()}`, // 格式化金额
    },
  ];

  // “车辆维修统计”表格的列
  const vehicleColumns: ColumnsType<MaintenanceReport['maintenanceByVehicle'][0]> = [
    {
      title: '车辆信息', // 列标题
      dataIndex: 'vehicle', // 对应数据里的 'vehicle' 对象
      key: 'vehicle', // 唯一标识
      render: (vehicle) => 
        // 组合显示车辆的品牌、型号和车牌
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    },
    {
      title: '维修次数', // 列标题
      dataIndex: 'count', // 对应数据字段
      key: 'count', // 唯一标识
    },
    {
      title: '总收入', // 列标题
      dataIndex: 'revenue', // 对应数据字段
      key: 'revenue', // 唯一标识
      render: (revenue: number) => `¥${revenue.toLocaleString()}`, // 格式化金额
    },
  ];

  // --- 页面渲染 --- 
  // 返回页面的 HTML 结构
  return (
    <div className="p-6"> {/* 最外层容器 */} 
      <Card> {/* 用卡片包起来 */} 
        <div className="mb-6"> {/* 顶部区域 */} 
          <Title level={2}>维修保养统计</Title> {/* 页面标题 */} 
          <RangePicker
            value={dateRange} // 绑定日期选择器的值
            onChange={(dates) => { // 日期改变时的处理
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0]!, dates[1]!]); // 更新日期范围状态
              }
            }}
            className="w-64" // 设置宽度
          />
        </div>

        {/* 统计数字卡片区域，分成两行，每行3个 */} 
        <Row gutter={[16, 16]} className="mb-6">
          {/* 总维修次数 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="总维修次数"
                value={data?.totalMaintenance || 0} // 显示数据，如果data不存在则显示0
                prefix={<ToolOutlined />} // 工具图标
                loading={loading} // 显示加载状态
              />
            </Card>
          </Col>
          {/* 已完成维修 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="已完成维修"
                value={data?.completedMaintenance || 0}
                prefix={<CheckCircleOutlined />} // 对勾图标
                loading={loading}
                valueStyle={{ color: '#52c41a' }} // 数字显示为绿色
              />
            </Card>
          </Col>
          {/* 待处理维修 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="待处理维修"
                value={data?.pendingMaintenance || 0}
                prefix={<ClockCircleOutlined />} // 时钟图标
                loading={loading}
                valueStyle={{ color: '#faad14' }} // 数字显示为黄色
              />
            </Card>
          </Col>
          {/* 总收入 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="总收入"
                value={data?.totalRevenue || 0}
                prefix={<DollarOutlined />} // 钱图标
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化金额
              />
            </Card>
          </Col>
          {/* 平均维修费用 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="平均维修费用"
                value={data?.avgCost || 0}
                prefix={<DollarOutlined />} // 钱图标
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化金额
              />
            </Card>
          </Col>
          {/* 服务车辆数 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="服务车辆数"
                value={data?.totalVehicles || 0}
                prefix={<CarOutlined />} // 汽车图标
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* 表格区域，一行两个表格 */} 
        <Row gutter={[16, 16]}>
          {/* 维修类型统计表格 */} 
          <Col span={12}>
            <Card title="维修类型统计" loading={loading}> {/* 卡片标题和加载状态 */} 
              <Table
                columns={maintenanceTypeColumns} // 列定义
                dataSource={data?.maintenanceByType || []} // 数据源
                rowKey="type" // 行的唯一标识
                pagination={false} // 不分页
              />
            </Card>
          </Col>
          {/* 车辆维修统计表格 */} 
          <Col span={12}>
            <Card title="车辆维修统计" loading={loading}> {/* 卡片标题和加载状态 */} 
              <Table
                columns={vehicleColumns} // 列定义
                dataSource={data?.maintenanceByVehicle || []} // 数据源
                rowKey={(record) => record.vehicle.licensePlate} // 行的唯一标识（车牌号）
                pagination={false} // 不分页
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 