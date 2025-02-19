'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Statistic,
  Table,
  message,
  Typography,
} from 'antd';
import {
  UserOutlined,
  CarOutlined,
  DollarOutlined,
  ShoppingOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalSpending: number;
  averageSpending: number;
  customersByType: {
    type: string;
    count: number;
    spending: number;
  }[];
  topCustomers: {
    name: string;
    phone: string;
    visits: number;
    spending: number;
    lastVisit: string;
  }[];
}

export default function CustomerReportPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerReport | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reports/customers?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取报表数据失败');
      }

      setData(result.data);
    } catch (error: any) {
      message.error(error.message || '获取报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const customerTypeColumns: ColumnsType<CustomerReport['customersByType'][0]> = [
    {
      title: '客户类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          individual: '个人客户',
          corporate: '企业客户',
          vip: 'VIP客户',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '消费总额',
      dataIndex: 'spending',
      key: 'spending',
      render: (spending: number) => `¥${spending.toLocaleString()}`,
    },
  ];

  const topCustomersColumns: ColumnsType<CustomerReport['topCustomers'][0]> = [
    {
      title: '客户姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '到店次数',
      dataIndex: 'visits',
      key: 'visits',
    },
    {
      title: '消费总额',
      dataIndex: 'spending',
      key: 'spending',
      render: (spending: number) => `¥${spending.toLocaleString()}`,
    },
    {
      title: '最近到店',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>客户分析</Title>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!]);
              }
            }}
            className="w-64"
          />
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="总客户数"
                value={data?.totalCustomers || 0}
                prefix={<UserOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="新增客户"
                value={data?.newCustomers || 0}
                prefix={<UserOutlined />}
                loading={loading}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="活跃客户"
                value={data?.activeCustomers || 0}
                prefix={<StarOutlined />}
                loading={loading}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总消费额"
                value={data?.totalSpending || 0}
                prefix={<DollarOutlined />}
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="客均消费"
                value={data?.averageSpending || 0}
                prefix={<DollarOutlined />}
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="客户类型分布" loading={loading}>
              <Table
                columns={customerTypeColumns}
                dataSource={data?.customersByType || []}
                rowKey="type"
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={24}>
            <Card title="高价值客户" loading={loading}>
              <Table
                columns={topCustomersColumns}
                dataSource={data?.topCustomers || []}
                rowKey="phone"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 