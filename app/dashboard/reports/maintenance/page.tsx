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
  ToolOutlined,
  DollarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface MaintenanceReport {
  totalMaintenance: number;
  totalRevenue: number;
  avgCost: number;
  completedMaintenance: number;
  pendingMaintenance: number;
  totalVehicles: number;
  maintenanceByType: {
    type: string;
    count: number;
    revenue: number;
  }[];
  maintenanceByVehicle: {
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
    count: number;
    revenue: number;
  }[];
}

export default function MaintenanceReportPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MaintenanceReport | null>(null);
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
        `/api/reports/maintenance?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`
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

  const maintenanceTypeColumns: ColumnsType<MaintenanceReport['maintenanceByType'][0]> = [
    {
      title: '维修类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          regular: '常规保养',
          repair: '维修',
          inspection: '年检',
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
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `¥${revenue.toLocaleString()}`,
    },
  ];

  const vehicleColumns: ColumnsType<MaintenanceReport['maintenanceByVehicle'][0]> = [
    {
      title: '车辆信息',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle) => 
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    },
    {
      title: '维修次数',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '总收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `¥${revenue.toLocaleString()}`,
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <Title level={2}>维修保养统计</Title>
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
                title="总维修次数"
                value={data?.totalMaintenance || 0}
                prefix={<ToolOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="已完成维修"
                value={data?.completedMaintenance || 0}
                prefix={<CheckCircleOutlined />}
                loading={loading}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="待处理维修"
                value={data?.pendingMaintenance || 0}
                prefix={<ClockCircleOutlined />}
                loading={loading}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总收入"
                value={data?.totalRevenue || 0}
                prefix={<DollarOutlined />}
                loading={loading}
                formatter={(value) => `¥${value.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col span={8}>
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
          <Col span={8}>
            <Card>
              <Statistic
                title="服务车辆数"
                value={data?.totalVehicles || 0}
                prefix={<CarOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="维修类型统计" loading={loading}>
              <Table
                columns={maintenanceTypeColumns}
                dataSource={data?.maintenanceByType || []}
                rowKey="type"
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="车辆维修统计" loading={loading}>
              <Table
                columns={vehicleColumns}
                dataSource={data?.maintenanceByVehicle || []}
                rowKey={(record) => record.vehicle.licensePlate}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 