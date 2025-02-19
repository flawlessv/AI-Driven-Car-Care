'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Statistic,
  Table,
  Select,
  Button,
  Space,
  message,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  CarOutlined,
  ToolOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  revenueByService: {
    type: string;
    revenue: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
  topServices: {
    service: string;
    revenue: number;
    orders: number;
  }[];
}

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(12, 'month'),
    dayjs(),
  ]);

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/revenue?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取收入数据失败');
      }

      setData(result.data);
    } catch (error) {
      console.error('获取收入数据失败:', error);
      message.error('获取收入数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/reports/revenue/export?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `收入报表_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success('导出成功');
    } catch (error) {
      console.error('导出收入报表失败:', error);
      message.error('导出收入报表失败');
    }
  };

  if (!data) {
    return null;
  }

  const revenueByServiceConfig = {
    data: data.revenueByService,
    angleField: 'revenue',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  const revenueByMonthConfig = {
    data: data.revenueByMonth,
    xField: 'month',
    yField: 'revenue',
    smooth: true,
    point: {
      size: 4,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
  };

  const columns = [
    {
      title: '服务项目',
      dataIndex: 'service',
      key: 'service',
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      sorter: (a: any, b: any) => a.orders - b.orders,
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: any, b: any) => a.revenue - b.revenue,
      render: (val: number) => `¥${val.toLocaleString()}`,
    },
    {
      title: '平均单价',
      key: 'average',
      render: (record: any) => 
        `¥${(record.revenue / record.orders).toLocaleString()}`,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0]!, dates[1]!]);
                }
              }}
            />
          </Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出报表
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={data.totalRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="订单数量"
                value={data.totalOrders}
                prefix={<CarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均订单金额"
                value={data.averageOrderValue}
                prefix={<ToolOutlined />}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="收入增长"
                value={data.revenueGrowth}
                prefix={<RiseOutlined />}
                suffix="%"
                valueStyle={{ color: data.revenueGrowth >= 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="收入趋势">
              <Line {...revenueByMonthConfig} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="收入构成">
              <Pie {...revenueByServiceConfig} />
            </Card>
          </Col>
        </Row>

        <Card title="热门服务" className="mt-6">
          <Table
            columns={columns}
            dataSource={data.topServices}
            rowKey="service"
            pagination={false}
          />
        </Card>
      </Card>
    </div>
  );
} 