/**
 * 保养统计信息组件
 * 用于展示保养记录的统计数据，包括总费用、维修次数、类型分布等
 * 支持多种筛选条件和导出功能
 */
import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Select,
  DatePicker,
  Button,
  Progress,
} from 'antd';
import {
  DownloadOutlined,
  DollarOutlined,
  ToolOutlined,
  CarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type {
  MaintenanceStats,
  MaintenanceTimeGroupBy,
  MaintenanceType,
} from '../types';

const { RangePicker } = DatePicker;

// 保养类型的中文显示映射
const typeText = {
  regular: '常规保养',
  repair: '维修',
  inspection: '检查',
};

/**
 * 保养统计组件属性接口
 * @param stats - 保养统计数据
 * @param loading - 是否正在加载数据
 * @param onTimeGroupChange - 时间分组变更回调
 * @param onDateRangeChange - 日期范围变更回调
 * @param onTypeChange - 维修类型变更回调
 * @param onVehicleChange - 车辆选择变更回调
 * @param onExport - 导出统计数据回调
 */
interface MaintenanceStatsProps {
  stats: MaintenanceStats;
  loading?: boolean;
  onTimeGroupChange?: (groupBy: MaintenanceTimeGroupBy) => void;
  onDateRangeChange?: (dates: [Date | null, Date | null]) => void;
  onTypeChange?: (type: MaintenanceType | undefined) => void;
  onVehicleChange?: (vehicleId: string | undefined) => void;
  onExport?: () => void;
}

export default function MaintenanceStats({
  stats,
  loading = false,
  onTimeGroupChange,
  onDateRangeChange,
  onTypeChange,
  onVehicleChange,
  onExport,
}: MaintenanceStatsProps) {
  // 维修类型表格列配置
  const typeColumns = [
    {
      title: '维修类型',
      dataIndex: '_id',
      key: '_id',
      render: (type: MaintenanceType) => typeText[type],
    },
    {
      title: '维修次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '总费用',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.totalCost - b.totalCost,
    },
    {
      title: '平均费用',
      dataIndex: 'avgCost',
      key: 'avgCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.avgCost - b.avgCost,
    },
  ];

  // 车辆维修表格列配置
  const vehicleColumns = [
    {
      title: '车辆信息',
      dataIndex: ['vehicle'],
      key: 'vehicle',
      render: (vehicle: any) => (
        `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`
      ),
    },
    {
      title: '维修次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '总费用',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.totalCost - b.totalCost,
    },
    {
      title: '平均费用',
      dataIndex: 'avgCost',
      key: 'avgCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.avgCost - b.avgCost,
    },
  ];

  // 时间统计表格列配置
  const timeColumns = [
    {
      title: '时间',
      dataIndex: '_id',
      key: '_id',
    },
    {
      title: '维修次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: '总费用',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.totalCost - b.totalCost,
    },
    {
      title: '配件费用',
      dataIndex: 'partsCost',
      key: 'partsCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.partsCost - b.partsCost,
    },
    {
      title: '工时费用',
      dataIndex: 'laborCost',
      key: 'laborCost',
      render: (cost: number) => `¥${cost.toFixed(2)}`,
      sorter: (a: any, b: any) => a.laborCost - b.laborCost,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 筛选工具栏 */}
      <div className="flex justify-between items-center mb-6">
        <Space size="large">
          {/* 时间分组选择器 */}
          <Select
            placeholder="时间分组"
            style={{ width: 120 }}
            onChange={onTimeGroupChange}
            defaultValue="month"
          >
            <Select.Option value="day">按日</Select.Option>
            <Select.Option value="week">按周</Select.Option>
            <Select.Option value="month">按月</Select.Option>
            <Select.Option value="year">按年</Select.Option>
          </Select>
          
          {/* 日期范围选择器 */}
          <RangePicker
            onChange={(_, dateStrings) =>
              onDateRangeChange?.([
                dateStrings[0] ? new Date(dateStrings[0]) : null,
                dateStrings[1] ? new Date(dateStrings[1]) : null,
              ])
            }
          />
          
          {/* 维修类型选择器 */}
          <Select
            placeholder="维修类型"
            style={{ width: 120 }}
            allowClear
            onChange={onTypeChange}
          >
            {Object.entries(typeText).map(([key, text]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
        </Space>
        
        {/* 导出按钮 */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
        >
          导出统计
        </Button>
      </div>

      {/* 数据概览卡片组 */}
      <Row gutter={16}>
        {/* 总维修次数统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="总维修次数"
              value={stats.basic.totalCount}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        
        {/* 总维修费用统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="总维修费用"
              value={stats.basic.totalCost}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        
        {/* 平均维修费用统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="平均维修费用"
              value={stats.basic.avgCost}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        
        {/* 平均配件数量统计卡片 */}
        <Col span={6}>
          <Card>
            <Statistic
              title="平均配件数量"
              value={stats.summary.avgPartsPerMaintenance}
              precision={1}
              prefix={<SettingOutlined />}
              suffix="个/次"
            />
          </Card>
        </Col>
      </Row>

      {/* 费用构成卡片 */}
      <Card title="费用构成">
        <Row gutter={16}>
          {/* 工时费用占比 */}
          <Col span={12}>
            <div className="text-center mb-4">工时费用占比</div>
            <Progress
              type="circle"
              percent={Math.round(stats.summary.laborCostRatio * 100)}
              format={percent => `${percent}%`}
            />
          </Col>
          
          {/* 配件费用占比 */}
          <Col span={12}>
            <div className="text-center mb-4">配件费用占比</div>
            <Progress
              type="circle"
              percent={Math.round(stats.summary.partsCostRatio * 100)}
              format={percent => `${percent}%`}
            />
          </Col>
        </Row>
      </Card>

      {/* 维修类型统计表格 */}
      <Card title="按维修类型统计" loading={loading}>
        <Table
          dataSource={stats.byType}
          columns={typeColumns}
          rowKey="_id"
          pagination={false}
        />
      </Card>

      {/* 车辆维修统计表格 */}
      <Card title="按车辆统计" loading={loading}>
        <Table
          dataSource={stats.byVehicle}
          columns={vehicleColumns}
          rowKey="_id"
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
          }}
        />
      </Card>

      {/* 时间维度统计表格 */}
      <Card title="按时间统计" loading={loading}>
        <Table
          dataSource={stats.byTime}
          columns={timeColumns}
          rowKey="_id"
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
          }}
        />
      </Card>
    </div>
  );
} 