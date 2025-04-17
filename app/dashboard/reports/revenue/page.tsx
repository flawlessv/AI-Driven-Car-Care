'use client';

/**
 * 收入报表页面组件
 * 
 * 这个页面用于展示业务收入相关的统计数据。
 * 它包含总收入、订单数量、平均订单金额、收入增长率等关键指标。
 * 还会用图表展示收入按服务类型和按月份的分布情况。
 * 另外，用表格列出了最热门（收入最高）的服务项目。
 * 用户可以调整日期范围查看不同时间段的收入情况，并可以导出报表。
 */

import { useState, useEffect } from 'react';
import {
  Card,           // 卡片，用于组织内容块
  Row,            // 行布局
  Col,            // 列布局
  DatePicker,     // 日期选择器
  Statistic,      // 统计数据显示
  Table,          // 表格
  Select,         // 下拉选择 (虽然导入了但未使用)
  Button,         // 按钮
  Space,          // 间距
  message,        // 消息提示
} from 'antd';
import {
  DollarOutlined,   // 钱图标
  RiseOutlined,     // 上升趋势图标
  CarOutlined,      // 汽车图标（代表订单）
  ToolOutlined,     // 工具图标（代表平均订单金额）
  DownloadOutlined, // 下载图标（用于导出）
} from '@ant-design/icons'; // 引入图标
import { Line, Pie } from '@ant-design/plots'; // 引入图表库中的折线图和饼图组件
import dayjs from 'dayjs'; // 日期时间处理库

// 获取日期范围选择器
const { RangePicker } = DatePicker;

/**
 * 定义收入报表数据的结构
 * 
 * 规定了从服务器获取的收入报表数据应该包含哪些信息。
 */
interface RevenueData {
  totalRevenue: number;       // 总收入金额
  totalOrders: number;        // 总订单数量
  averageOrderValue: number;  // 平均每个订单的金额
  revenueGrowth: number;      // 收入增长率（通常与上一周期比较，这里是百分比）
  revenueByService: {         // 按服务类型分类的收入数据
    type: string;             // 服务类型 (例如：保养、维修)
    revenue: number;          // 该服务类型产生的收入
  }[];                       // 列表，包含多种服务类型
  revenueByMonth: {           // 按月份分类的收入数据
    month: string;            // 月份 (例如：'2023-10')
    revenue: number;          // 该月份的总收入
  }[];                       // 列表，包含多个月份的数据
  topServices: {              // 热门服务（收入最高的）列表
    service: string;          // 服务项目名称
    revenue: number;          // 该服务产生的总收入
    orders: number;           // 该服务的订单数量
  }[];                       // 列表，包含多个热门服务
}

/**
 * 收入报表页面主组件
 * 
 * 定义了页面的外观和所有功能。
 */
export default function RevenuePage() {
  // --- 状态管理 --- 
  // `useState` 用于存储和更新页面上会变化的数据

  // 加载状态，初始为 `true`，表示页面刚打开时需要加载数据
  const [loading, setLoading] = useState(true);
  
  // 存储从服务器获取的收入报表数据，初始为 `null`
  const [data, setData] = useState<RevenueData | null>(null);
  
  // 存储用户选择的日期范围，默认显示过去12个月的数据
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(12, 'month'), // 从今天往前推12个月
    dayjs(),                     // 今天
  ]);

  // --- 数据获取 --- 
  // `useEffect` 在组件加载或日期范围变化时执行获取数据的操作
  useEffect(() => {
    fetchRevenueData(); // 调用获取数据的函数
  }, [dateRange]); // 当 `dateRange` 变化时，重新执行

  /**
   * 从服务器获取收入报表数据的函数
   */
  const fetchRevenueData = async () => {
    try {
      setLoading(true); // 开始加载
      
      // 准备 API 请求地址，带上日期参数
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const apiUrl = `/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`;
      
      // 发送请求
      const response = await fetch(apiUrl);
      const result = await response.json(); // 解析返回的 JSON 数据

      // 检查请求是否成功
      if (!response.ok) {
        throw new Error(result.message || '获取收入数据失败'); // 失败则报错
      }

      // 成功则更新页面数据
      setData(result.data);

    } catch (error) {
      // 处理可能发生的错误
      console.error('获取收入数据失败:', error); // 在控制台打印错误信息，方便开发者排查
      message.error('获取收入数据失败'); // 给用户显示错误提示
    } finally {
      // 不论成功或失败，最后都结束加载状态
      setLoading(false);
    }
  };

  /**
   * 处理导出报表操作的函数
   * 
   * 当用户点击"导出报表"按钮时调用此函数。
   * 它会向服务器请求导出文件，并将文件下载到用户的电脑上。
   */
  const handleExport = async () => {
    try {
      // 准备导出请求的 API 地址，同样带上日期参数
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const exportUrl = `/api/reports/revenue/export?startDate=${startDate}&endDate=${endDate}`;
      
      // 发送导出请求（通常是 POST 请求，即使没有发送数据）
      const response = await fetch(exportUrl, {
        method: 'POST',
      });

      // 检查导出请求是否成功
      if (!response.ok) {
        throw new Error('导出失败'); // 失败则报错
      }

      // --- 处理文件下载 --- 
      // 如果请求成功，服务器会返回文件内容
      const blob = await response.blob(); // 获取返回的文件内容 (二进制大对象)
      const url = window.URL.createObjectURL(blob); // 创建一个临时的文件 URL
      const a = document.createElement('a'); // 创建一个隐藏的下载链接
      a.href = url; // 设置链接地址
      // 设置下载的文件名，包含当前日期
      a.download = `收入报表_${dayjs().format('YYYY-MM-DD')}.xlsx`; 
      document.body.appendChild(a); // 把链接添加到页面上
      a.click(); // 模拟点击链接，触发浏览器下载
      window.URL.revokeObjectURL(url); // 释放临时的 URL
      document.body.removeChild(a); // 从页面移除链接
      // --- 文件下载结束 --- 

      message.success('导出成功'); // 显示成功提示

    } catch (error) {
      // 处理导出过程中可能发生的错误
      console.error('导出收入报表失败:', error); // 在控制台记录错误
      message.error('导出收入报表失败'); // 给用户显示错误提示
    }
  };

  // --- 条件渲染 --- 
  // 如果数据还在加载中 (`data` 为 null)，则不显示任何内容
  // 避免在没有数据时渲染页面导致错误或显示空状态
  if (!data) {
    return null;
  }

  // --- 图表配置 --- 
  // 定义两个图表需要的数据和样式配置

  // "收入构成"饼图的配置
  const revenueByServiceConfig = {
    data: data.revenueByService, // 使用从服务器获取的按服务分类的收入数据
    angleField: 'revenue',      // 饼图的角度大小由 `revenue` (收入) 决定
    colorField: 'type',         // 饼图的颜色根据 `type` (服务类型) 区分
    radius: 0.8,              // 饼图的半径大小
    label: {                  // 标签设置
      type: 'outer',          // 标签显示在饼图外部
      content: '{name} {percentage}', // 标签内容显示服务名称和百分比
    },
    interactions: [{ type: 'element-active' }], // 添加交互效果，比如鼠标悬停高亮
  };

  // "收入趋势"折线图的配置
  const revenueByMonthConfig = {
    data: data.revenueByMonth,  // 使用按月份分类的收入数据
    xField: 'month',          // X轴（横轴）代表月份
    yField: 'revenue',        // Y轴（纵轴）代表收入
    smooth: true,             // 让折线变得平滑
    point: {                  // 折线上的点的样式
      size: 4,                // 点的大小
      shape: 'diamond',       // 点的形状为菱形
    },
    label: {                  // 是否在图表上直接显示数值（这里没开启，注释掉了）
      style: {
        fill: '#aaa',         // 标签文字颜色
      },
    },
  };

  // --- 表格列定义 --- 
  // 定义"热门服务"表格的列
  const columns = [
    {
      title: '服务项目',      // 列标题
      dataIndex: 'service',   // 对应数据字段 'service'
      key: 'service',         // 唯一标识
    },
    {
      title: '订单数',        // 列标题
      dataIndex: 'orders',    // 对应数据字段 'orders'
      key: 'orders',          // 唯一标识
      sorter: (a: any, b: any) => a.orders - b.orders, // 允许按订单数排序
    },
    {
      title: '收入',          // 列标题
      dataIndex: 'revenue',   // 对应数据字段 'revenue'
      key: 'revenue',         // 唯一标识
      sorter: (a: any, b: any) => a.revenue - b.revenue, // 允许按收入排序
      render: (val: number) => `¥${val.toLocaleString()}`, // 格式化金额显示
    },
    {
      title: '平均单价',      // 列标题
      key: 'average',         // 唯一标识（这个数据是计算出来的，没有直接对应的字段）
      render: (record: any) => 
        // 计算平均单价 (总收入 / 订单数) 并格式化显示
        `¥${(record.revenue / record.orders).toLocaleString()}`,
    },
  ];

  // --- 页面渲染 --- 
  // 返回最终的页面 HTML 结构
  return (
    <div className="p-6"> {/* 最外层容器 */} 
      <Card> {/* 用卡片包起来 */} 
        {/* 页面顶部：日期选择器和导出按钮 */} 
        <div className="flex justify-between items-center mb-6"> {/* 使用 flex 布局让元素左右分布 */} 
          <Space> {/* 左侧放日期选择器 */} 
            <RangePicker
              value={dateRange} // 绑定值
              onChange={(dates) => { // 日期改变时的处理
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0]!, dates[1]!]); // 更新日期
                }
              }}
            />
          </Space>
          {/* 右侧放导出按钮 */} 
          <Button
            type="primary" // 主要按钮样式
            icon={<DownloadOutlined />} // 显示下载图标
            onClick={handleExport} // 点击时调用导出函数
          >
            导出报表
          </Button>
        </div>

        {/* 第一行统计卡片区域 */} 
        <Row gutter={[16, 16]} className="mb-6"> {/* gutter 是列间距 */} 
          {/* 总收入卡片 */} 
          <Col span={6}> {/* 每行 4 个卡片，每个占 6 列 */} 
            <Card>
              <Statistic
                title="总收入"
                value={data.totalRevenue} // 显示总收入
                prefix={<DollarOutlined />} // 钱图标
                valueStyle={{ color: '#3f8600' }} // 数字显示为绿色
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化金额
              />
            </Card>
          </Col>
          {/* 订单数量卡片 */} 
          <Col span={6}>
            <Card>
              <Statistic
                title="订单数量"
                value={data.totalOrders}
                prefix={<CarOutlined />} // 汽车图标
              />
            </Card>
          </Col>
          {/* 平均订单金额卡片 */} 
          <Col span={6}>
            <Card>
              <Statistic
                title="平均订单金额"
                value={data.averageOrderValue}
                prefix={<ToolOutlined />} // 工具图标
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化金额
              />
            </Card>
          </Col>
          {/* 收入增长卡片 */} 
          <Col span={6}>
            <Card>
              <Statistic
                title="收入增长"
                value={data.revenueGrowth} // 显示增长率
                prefix={<RiseOutlined />} // 上升趋势图标
                suffix="%" // 单位是百分比
                // 根据增长率是正还是负显示不同颜色
                valueStyle={{ color: data.revenueGrowth >= 0 ? '#3f8600' : '#cf1322' }} 
              />
            </Card>
          </Col>
        </Row>

        {/* 第二行图表区域 */} 
        <Row gutter={[16, 16]}>
          {/* 收入趋势折线图 */} 
          <Col span={12}> {/* 图表占一半宽度 */} 
            <Card title="收入趋势">
              <Line {...revenueByMonthConfig} /> {/* 使用上面定义的折线图配置 */} 
            </Card>
          </Col>
          {/* 收入构成饼图 */} 
          <Col span={12}> {/* 图表占一半宽度 */} 
            <Card title="收入构成">
              <Pie {...revenueByServiceConfig} /> {/* 使用上面定义的饼图配置 */} 
            </Card>
          </Col>
        </Row>

        {/* 热门服务表格 */} 
        <Card title="热门服务" className="mt-6"> {/* mt-6 表示顶部外边距 */} 
          <Table
            columns={columns} // 使用上面定义的表格列
            dataSource={data.topServices} // 数据源是热门服务列表
            rowKey="service" // 每行的唯一标识是服务名称
            pagination={false} // 不显示分页
          />
        </Card>
      </Card>
    </div>
  );
} 