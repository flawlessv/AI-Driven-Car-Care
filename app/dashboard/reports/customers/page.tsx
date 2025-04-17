'use client';

/**
 * 客户分析报表页面组件
 * 
 * 这个页面用来展示客户相关的统计数据。
 * 它包括总客户数、新增客户数、活跃客户数、总消费额、平均消费额等。
 * 还用表格展示了按客户类型分类的统计和消费最高的客户列表。
 * 用户可以通过日期选择器查看不同时间段的客户数据。
 */

import { useState, useEffect } from 'react';
import {
  Card,           // 卡片，用来包住一部分内容
  Row,            // 行，用于页面布局
  Col,            // 列，用于页面布局
  DatePicker,     // 日期选择器
  Statistic,      // 显示统计数字的组件
  Table,          // 表格，用来展示详细数据
  message,        // 消息提示，比如显示错误信息
  Typography,     // 排版组件，用来设置文字样式（比如标题）
} from 'antd';
import {
  UserOutlined,     // 用户图标
  CarOutlined,      // 汽车图标 (这里没用到)
  DollarOutlined,   // 钱的图标
  ShoppingOutlined, // 购物图标 (这里没用到)
  StarOutlined,     // 星星图标
} from '@ant-design/icons'; // 引入需要的图标
import type { ColumnsType } from 'antd/es/table'; // 表格列的类型定义
import dayjs from 'dayjs'; // 处理日期和时间的库

// 从排版组件中获取标题组件
const { Title } = Typography;
// 获取日期范围选择器组件
const { RangePicker } = DatePicker;

/**
 * 定义客户报表数据的结构
 * 
 * 这个就像一个数据模板，规定了从服务器拿到的客户报表数据应该包含哪些内容。
 */
interface CustomerReport {
  totalCustomers: number;   // 总客户数量
  newCustomers: number;     // 新增客户数量
  activeCustomers: number;  // 活跃客户数量（比如最近有消费的客户）
  totalSpending: number;    // 所有客户的总消费金额
  averageSpending: number;  // 平均每个客户的消费金额
  customersByType: {        // 按客户类型分类的统计数据
    type: string;           // 客户类型 (比如：个人、企业、VIP)
    count: number;          // 该类型的客户数量
    spending: number;       // 该类型客户的总消费金额
  }[];                     // 这是一个列表，可以包含多种客户类型
  topCustomers: {           // 消费最高的客户列表
    name: string;           // 客户姓名
    phone: string;          // 客户电话
    visits: number;         // 该客户来店的次数
    spending: number;       // 该客户的总消费金额
    lastVisit: string;      // 该客户最近一次来店的日期
  }[];                     // 这是一个列表，包含多个高价值客户
}

/**
 * 客户分析报表页面主组件
 * 
 * 这个函数包含了客户分析页面的所有逻辑和显示内容。
 */
export default function CustomerReportPage() {
  // --- 状态管理 --- 
  // 使用 useState 来管理组件内部会变化的数据

  // 加载状态，`true` 表示正在从服务器请求数据
  const [loading, setLoading] = useState(false);
  
  // 存储从服务器获取的客户报表数据，初始为 `null` (还没有数据)
  const [data, setData] = useState<CustomerReport | null>(null);
  
  // 存储用户选择的日期范围，默认是当前月份
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'), // 当前月份的第一天
    dayjs().endOf('month'),   // 当前月份的最后一天
  ]);

  // --- 数据获取 --- 
  // 使用 useEffect 在组件加载或日期范围变化时自动获取数据
  useEffect(() => {
    fetchReportData(); // 调用下面的函数去获取数据
  }, [dateRange]); // 依赖项是 dateRange，当日期范围变化时，重新获取数据

  /**
   * 从服务器获取客户报表数据的函数
   * 
   * 它会根据用户选择的日期范围，向服务器发送请求。
   */
  const fetchReportData = async () => {
    try {
      setLoading(true); // 开始加载，显示加载动画
      
      // 准备请求的 URL 地址，包含开始和结束日期
      const startDate = dateRange[0].format('YYYY-MM-DD'); // 格式化开始日期
      const endDate = dateRange[1].format('YYYY-MM-DD');   // 格式化结束日期
      const apiUrl = `/api/reports/customers?startDate=${startDate}&endDate=${endDate}`;
      
      // 发送网络请求
      const response = await fetch(apiUrl);
      const result = await response.json(); // 解析返回的 JSON 数据

      // 检查请求是否成功
      if (!response.ok) {
        // 如果失败，显示服务器返回的错误信息，或者显示默认的错误信息
        throw new Error(result.message || '获取报表数据失败');
      }

      // 如果成功，把获取到的数据存到组件的 `data` 状态里
      setData(result.data);

    } catch (error: any) {
      // 如果过程中出现任何错误（比如网络问题或服务器错误）
      message.error(error.message || '获取报表数据失败'); // 显示错误提示
    } finally {
      // 不管成功还是失败，最后都要结束加载状态
      setLoading(false);
    }
  };

  // --- 表格列定义 --- 
  // 定义两个表格需要显示的列

  // “客户类型分布”表格的列定义
  const customerTypeColumns: ColumnsType<CustomerReport['customersByType'][0]> = [
    {
      title: '客户类型', // 列的标题
      dataIndex: 'type', // 对应数据里的 'type' 字段
      key: 'type', // 列的唯一标识
      render: (type: string) => { // 自定义显示内容
        // 把英文类型转换成中文
        const typeMap: { [key: string]: string } = {
          individual: '个人客户',
          corporate: '企业客户',
          vip: 'VIP客户',
        };
        return typeMap[type] || type; // 如果没找到对应的中文，就显示原来的英文
      },
    },
    {
      title: '数量', // 列标题
      dataIndex: 'count', // 对应数据里的 'count' 字段
      key: 'count', // 唯一标识
    },
    {
      title: '消费总额', // 列标题
      dataIndex: 'spending', // 对应数据里的 'spending' 字段
      key: 'spending', // 唯一标识
      render: (spending: number) => `¥${spending.toLocaleString()}`, // 把数字格式化成人民币金额样式
    },
  ];

  // “高价值客户”表格的列定义
  const topCustomersColumns: ColumnsType<CustomerReport['topCustomers'][0]> = [
    {
      title: '客户姓名', // 列标题
      dataIndex: 'name', // 对应数据里的 'name' 字段
      key: 'name', // 唯一标识
    },
    {
      title: '联系电话', // 列标题
      dataIndex: 'phone', // 对应数据里的 'phone' 字段
      key: 'phone', // 唯一标识
    },
    {
      title: '到店次数', // 列标题
      dataIndex: 'visits', // 对应数据里的 'visits' 字段
      key: 'visits', // 唯一标识
    },
    {
      title: '消费总额', // 列标题
      dataIndex: 'spending', // 对应数据里的 'spending' 字段
      key: 'spending', // 唯一标识
      render: (spending: number) => `¥${spending.toLocaleString()}`, // 格式化金额
    },
    {
      title: '最近到店', // 列标题
      dataIndex: 'lastVisit', // 对应数据里的 'lastVisit' 字段
      key: 'lastVisit', // 唯一标识
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'), // 把日期字符串格式化成 '年-月-日' 的形式
    },
  ];

  // --- 页面渲染 --- 
  // 返回页面的最终样子 (HTML结构)
  return (
    <div className="p-6"> {/* 页面最外层的容器，有内边距 */} 
      <Card> {/* 用一个卡片把所有内容包起来 */} 
        <div className="mb-6"> {/* 页面顶部区域，有下边距 */} 
          <Title level={2}>客户分析</Title> {/* 页面大标题 */} 
          <RangePicker
            value={dateRange} // 日期选择器的值绑定到 `dateRange` 状态
            onChange={(dates) => { // 当用户改变日期时的处理函数
              if (dates && dates[0] && dates[1]) { // 确保选择了开始和结束日期
                setDateRange([dates[0]!, dates[1]!]); // 更新 `dateRange` 状态
              }
            }}
            className="w-64" // 设置日期选择器的宽度
          />
        </div>

        {/* 统计数字卡片区域 */} 
        <Row gutter={[16, 16]} className="mb-6"> {/* 使用行和列进行布局，gutter 是列之间的间距 */} 
          {/* 总客户数卡片 */} 
          <Col span={8}> {/* 每行3个卡片，所以每个占 8 列 (24/3 = 8) */} 
            <Card>
              <Statistic
                title="总客户数"
                value={data?.totalCustomers || 0} // 显示总客户数，如果 `data` 不存在就显示 0
                prefix={<UserOutlined />} // 显示用户图标
                loading={loading} // 如果正在加载，显示加载动画
              />
            </Card>
          </Col>
          {/* 新增客户卡片 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="新增客户"
                value={data?.newCustomers || 0}
                prefix={<UserOutlined />} // 用户图标
                loading={loading}
                valueStyle={{ color: '#52c41a' }} // 设置数字颜色为绿色
              />
            </Card>
          </Col>
          {/* 活跃客户卡片 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="活跃客户"
                value={data?.activeCustomers || 0}
                prefix={<StarOutlined />} // 显示星星图标
                loading={loading}
                valueStyle={{ color: '#1890ff' }} // 设置数字颜色为蓝色
              />
            </Card>
          </Col>
          {/* 总消费额卡片 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="总消费额"
                value={data?.totalSpending || 0}
                prefix={<DollarOutlined />} // 钱的图标
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化成人民币金额
              />
            </Card>
          </Col>
          {/* 客均消费卡片 */} 
          <Col span={8}>
            <Card>
              <Statistic
                title="客均消费"
                value={data?.averageSpending || 0}
                prefix={<DollarOutlined />} // 钱的图标
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`} // 格式化成人民币金额
              />
            </Card>
          </Col>
        </Row>

        {/* 表格区域 */} 
        <Row gutter={[16, 16]}>
          {/* 客户类型分布表格 */} 
          <Col span={12}> {/* 这个表格占一半宽度 */} 
            <Card title="客户类型分布" loading={loading}> {/* 卡片标题，并显示加载状态 */} 
              <Table
                columns={customerTypeColumns} // 使用上面定义的列
                dataSource={data?.customersByType || []} // 表格数据来源
                rowKey="type" // 每行的唯一标识是客户类型
                pagination={false} // 不显示分页
              />
            </Card>
          </Col>
          {/* 高价值客户表格 */} 
          <Col span={24}> {/* 这个表格占整行宽度 */} 
            <Card title="高价值客户" loading={loading}> {/* 卡片标题 */} 
              <Table
                columns={topCustomersColumns} // 使用上面定义的列
                dataSource={data?.topCustomers || []} // 表格数据来源
                rowKey="phone" // 每行的唯一标识是电话号码
                pagination={{ pageSize: 5 }} // 显示分页，每页显示 5 条
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 