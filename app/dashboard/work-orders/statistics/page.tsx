'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Spin,
  message,
  Select,
  Space,
} from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WorkOrder } from '@/types/workOrder';
import type { Vehicle } from '@/types/vehicle';

const { RangePicker } = DatePicker;

const statusText = {
  pending: '待处理',
  assigned: '已分配',
  in_progress: '进行中',
  pending_check: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

const priorityText = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export default function WorkOrderStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalCount: 0,
    completedCount: 0,
    completionRate: 0,
    averageRating: 0,
    statusDistribution: [],
    priorityDistribution: [],
    monthlyStats: [],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedVehicle, setSelectedVehicle] = useState<string>();
  const [selectedPriority, setSelectedPriority] = useState<string>();

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedStatus, selectedVehicle, selectedPriority]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const result = await response.json();
      if (result.data?.data) {
        setVehicles(result.data.data);
      }
    } catch (error) {
      console.error('获取车辆列表失败:', error);
      message.error('获取车辆列表失败');
    }
  };

  const fetchStatistics = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('statistics', 'true');
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedVehicle) queryParams.append('vehicle', selectedVehicle);
      if (selectedPriority) queryParams.append('priority', selectedPriority);

      const response = await fetch(`/api/work-orders?${queryParams}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result.data);
      } else {
        message.error(result.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="mb-4">
        <Space size="large">
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="选择车辆"
            value={selectedVehicle}
            onChange={setSelectedVehicle}
          >
            {vehicles.map(vehicle => (
              <Select.Option key={vehicle._id} value={vehicle._id}>
                {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
              </Select.Option>
            ))}
          </Select>

          <Select
            allowClear
            style={{ width: 120 }}
            placeholder="状态"
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            {Object.entries(statusText).map(([key, text]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>

          <Select
            allowClear
            style={{ width: 120 }}
            placeholder="优先级"
            value={selectedPriority}
            onChange={setSelectedPriority}
          >
            {Object.entries(priorityText).map(([key, text]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="工单总数"
              value={data.totalCount}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成工单"
              value={data.completedCount}
              suffix="个"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={data.completionRate}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={data.averageRating}
              precision={1}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col span={12}>
          <Card title="工单状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => 
                    `${statusText[name as keyof typeof statusText]} (${(percent * 100).toFixed(1)}%)`
                  }
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="工单优先级分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.priorityDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#82ca9d"
                  label={({ name, percent }) => 
                    `${priorityText[name as keyof typeof priorityText]} (${(percent * 100).toFixed(1)}%)`
                  }
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="月度工单统计" className="mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar name="工单数量" dataKey="count" fill="#8884d8" />
            <Bar name="完成数量" dataKey="completed" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
} 