'use client';

/**
 * 报表页面组件
 * 
 * 这个页面主要用于显示维修保养相关的统计报表。
 * 它会显示一段时间内的总维修次数、总收入、平均费用、服务车辆数等关键信息。
 * 同时，它还用表格展示按维修类型和按车辆分类的统计数据。
 * 用户可以通过日期选择器来查看不同时间段的报表。
 */

import { useState, useEffect } from 'react';
import {
  Card,           // 卡片组件，用于分组展示信息
  Row,            // 行组件，用于布局
  Col,            // 列组件，用于布局
  DatePicker,     // 日期选择器组件
  Select,         // 下拉选择组件（虽然导入了但没用上）
  Button,         // 按钮组件（虽然导入了但没用上）
  Table,          // 表格组件，用于展示详细数据
  Statistic,      // 统计数据显示组件
  message,        // 消息提示组件，用于显示错误信息
} from 'antd';
import type { ColumnsType } from 'antd/es/table'; // antd表格列的类型定义
import {
  CarOutlined,    // 汽车图标
  ToolOutlined,   // 工具图标
  DollarOutlined, // 美元/钱图标
  UserOutlined,   // 用户图标（虽然导入了但没用上）
} from '@ant-design/icons'; // 引入需要的图标
import dayjs from 'dayjs'; // 用于处理日期和时间的库

// 获取antd日期范围选择器组件
const { RangePicker } = DatePicker;

/**
 * 定义报表数据的结构
 * 
 * 这个接口描述了从服务器获取的报表数据应该包含哪些信息。
 * 就像一份清单，规定了报表数据里应该有总维修次数、总收入等等。
 */
interface ReportData {
  totalMaintenance: number; // 总维修次数
  totalRevenue: number;     // 总收入金额
  avgCost: number;          // 平均每次维修的费用
  completedMaintenance: number; // 已完成的维修次数
  pendingMaintenance: number; // 等待处理的维修次数
  totalVehicles: number;    // 服务过的车辆总数
  maintenanceByType: {      // 按维修类型分类的统计数据
    type: string;           // 维修类型（比如：常规保养、维修、检查）
    count: number;          // 该类型的维修次数
    revenue: number;        // 该类型带来的收入
  }[];                     // 这是一个数组，可以包含多种类型的数据
  maintenanceByVehicle: {   // 按车辆分类的统计数据
    vehicle: {              // 车辆信息
      brand: string;        // 品牌
      model: string;        // 型号
      licensePlate: string; // 车牌号
    };
    count: number;          // 这辆车的维修次数
    revenue: number;        // 这辆车带来的总收入
  }[];                     // 这是一个数组，可以包含多辆车的数据
}

/**
 * 报表页面主组件
 * 
 * 这个函数定义了报表页面的所有功能和显示内容。
 */
export default function ReportsPage() {
  // 使用 useState 来管理组件的状态
  
  // 加载状态，true表示正在加载数据，false表示加载完成
  const [loading, setLoading] = useState(false);
  
  // 存储从服务器获取的报表数据，初始值为null（表示还没有数据）
  const [data, setData] = useState<ReportData | null>(null);
  
  // 存储用户选择的日期范围，默认为当前月份的第一天到最后一天
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'), // 获取当前月份的第一天
    dayjs().endOf('month'),   // 获取当前月份的最后一天
  ]);

  // 使用 useEffect 来处理副作用，比如在组件加载或日期范围变化时获取数据
  useEffect(() => {
    fetchReportData(); // 调用获取报表数据的函数
  }, [dateRange]); // 当 dateRange 状态发生变化时，重新执行这个 effect

  /**
   * 从服务器获取报表数据的函数
   * 
   * 这个函数会向服务器发送请求，获取指定日期范围内的维修报表数据。
   */
  const fetchReportData = async () => {
    try {
      setLoading(true); // 开始加载数据，设置加载状态为true
      
      // 构造请求URL，包含开始和结束日期
      const startDate = dateRange[0].format('YYYY-MM-DD'); // 格式化开始日期
      const endDate = dateRange[1].format('YYYY-MM-DD');   // 格式化结束日期
      const apiUrl = `/api/reports/maintenance?startDate=${startDate}&endDate=${endDate}`;
      
      // 使用 fetch 函数向服务器发送 GET 请求
      const response = await fetch(apiUrl);
      const result = await response.json(); // 将服务器返回的 JSON 数据解析成 JavaScript 对象

      // 检查请求是否成功
      if (!response.ok) {
        // 如果请求失败，抛出一个错误，错误信息优先使用服务器返回的
        throw new Error(result.message || '获取报表数据失败');
      }

      // 如果请求成功，将获取到的数据更新到组件的 data 状态中
      setData(result.data);
      
    } catch (error: any) {
      // 如果在请求或处理数据过程中发生错误
      message.error(error.message || '获取报表数据失败'); // 显示错误提示信息
    } finally {
      // 无论成功还是失败，最后都要设置加载状态为 false
      setLoading(false);
    }
  };

  // 定义"维修类型统计"表格的列
  const maintenanceTypeColumns: ColumnsType<ReportData['maintenanceByType'][0]> = [
    {
      title: '维修类型', // 列标题
      dataIndex: 'type', // 对应数据中的 'type' 字段
      key: 'type', // 列的唯一标识
      render: (type: string) => { // 自定义如何显示这一列的内容
        // 将英文的类型标识符转换成中文显示
        const typeMap: { [key: string]: string } = {
          regular: '常规保养',
          repair: '维修',
          inspection: '检查',
        };
        return typeMap[type] || type; // 如果找不到对应的中文，就显示原始的英文标识符
      },
    },
    {
      title: '数量', // 列标题
      dataIndex: 'count', // 对应数据中的 'count' 字段
      key: 'count', // 列的唯一标识
    },
    {
      title: '收入', // 列标题
      dataIndex: 'revenue', // 对应数据中的 'revenue' 字段
      key: 'revenue', // 列的唯一标识
      render: (revenue: number) => `¥${revenue.toLocaleString()}`, // 将数字格式化成带人民币符号和千位分隔符的字符串
    },
  ];

  // 定义"车辆维修统计"表格的列
  const vehicleColumns: ColumnsType<ReportData['maintenanceByVehicle'][0]> = [
    {
      title: '车辆信息', // 列标题
      dataIndex: 'vehicle', // 对应数据中的 'vehicle' 对象
      key: 'vehicle', // 列的唯一标识
      render: (vehicle) => 
        // 将车辆的品牌、型号和车牌号组合起来显示
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    },
    {
      title: '维修次数', // 列标题
      dataIndex: 'count', // 对应数据中的 'count' 字段
      key: 'count', // 列的唯一标识
    },
    {
      title: '总收入', // 列标题
      dataIndex: 'revenue', // 对应数据中的 'revenue' 字段
      key: 'revenue', // 列的唯一标识
      render: (revenue: number) => `¥${revenue.toLocaleString()}`, // 格式化收入显示
    },
  ];

  // 返回页面的 JSX 结构，也就是页面的样子
  return (
    <div className="p-6"> {/* 最外层的容器，有一些内边距 */} 
      <div className="mb-6"> {/* 日期选择器的容器，有一些下边距 */} 
        <RangePicker
          value={dateRange} // 绑定日期范围选择器的值到 dateRange 状态
          onChange={(dates) => { // 当用户选择新的日期范围时的回调函数
            if (dates && dates[0] && dates[1]) { // 确保用户选择了完整的开始和结束日期
              setDateRange([dates[0]!, dates[1]!]); // 更新 dateRange 状态
            }
          }}
          className="w-64" // 设置选择器的宽度
        />
      </div>

      {/* 第一行统计卡片，使用 Row 和 Col 进行栅格布局 */} 
      <Row gutter={[16, 16]} className="mb-6"> {/* gutter 设置列之间的间距 */} 
        <Col span={6}> {/* 占 24 列中的 6 列 */} 
          <Card> {/* 卡片容器 */} 
            <Statistic
              title="总维修次数" // 统计项标题
              value={data?.totalMaintenance || 0} // 显示的值，从 data 状态中获取，如果 data 不存在则显示 0
              prefix={<ToolOutlined />} // 在数值前显示工具图标
              loading={loading} // 如果正在加载数据，显示加载状态
            />
          </Card>
        </Col>
        <Col span={6}> {/* 占 24 列中的 6 列 */} 
          <Card>
            <Statistic
              title="总收入"
              value={data?.totalRevenue || 0}
              prefix={<DollarOutlined />} // 显示钱图标
              loading={loading}
              formatter={(value) => `¥${value.toLocaleString()}`} // 自定义数值显示格式
            />
          </Card>
        </Col>
        <Col span={6}> {/* 占 24 列中的 6 列 */} 
          <Card>
            <Statistic
              title="平均维修费用"
              value={data?.avgCost || 0}
              prefix={<DollarOutlined />}
              loading={loading}
              formatter={(value) => `¥${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={6}> {/* 占 24 列中的 6 列 */} 
          <Card>
            <Statistic
              title="服务车辆数"
              value={data?.totalVehicles || 0}
              prefix={<CarOutlined />} // 显示汽车图标
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行表格区域 */} 
      <Row gutter={[16, 16]}>
        <Col span={12}> {/* 占 24 列中的 12 列 */} 
          <Card title="维修类型统计" loading={loading}> {/* 卡片标题，并根据加载状态显示加载效果 */} 
            <Table
              columns={maintenanceTypeColumns} // 设置表格的列定义
              dataSource={data?.maintenanceByType || []} // 设置表格的数据来源，如果 data 不存在则为空数组
              rowKey="type" // 设置每行的唯一标识为 'type' 字段
              pagination={false} // 不显示分页器
            />
          </Card>
        </Col>
        <Col span={12}> {/* 占 24 列中的 12 列 */} 
          <Card title="车辆维修统计" loading={loading}>
            <Table
              columns={vehicleColumns} // 设置表格的列定义
              dataSource={data?.maintenanceByVehicle || []} // 设置表格的数据来源
              rowKey={(record) => record.vehicle.licensePlate} // 设置每行的唯一标识为车牌号
              pagination={false} // 不显示分页器
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 