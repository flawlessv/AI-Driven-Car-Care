'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface TechnicianStats {
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  averageRating: number;
  monthlyStats: {
    month: string;
    orderCount: number;
    completionRate: number;
    averageRating: number;
  }[];
}

export default function TechnicianStatisticsPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [stats, setStats] = useState<TechnicianStats | null>(null);

  useEffect(() => {
    // 检查用户是否登录
    if (!user) {
      router.push('/login');
      return;
    }

    // 检查用户权限
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    // 获取技师列表
    fetchTechnicians();
  }, [user, router]);

  useEffect(() => {
    if (selectedTechnician) {
      fetchTechnicianStats(selectedTechnician);
    }
  }, [selectedTechnician]);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?role=technician', {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTechnicians(result.data);
          if (result.data.length > 0) {
            setSelectedTechnician(result.data[0]._id);
          }
        }
      }
    } catch (error) {
      console.error('获取技师列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicianStats = async (technicianId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/technicians/${technicianId}/statistics`, {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error('获取技师统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '工单数量',
      dataIndex: 'orderCount',
      key: 'orderCount',
    },
    {
      title: '完成率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: '平均评分',
      dataIndex: 'averageRating',
      key: 'averageRating',
      render: (value: number) => value.toFixed(1),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <Select
          style={{ width: 200 }}
          placeholder="选择技师"
          value={selectedTechnician}
          onChange={setSelectedTechnician}
          loading={loading}
        >
          {technicians.map((tech: any) => (
            <Select.Option key={tech._id} value={tech._id}>
              {tech.name || tech.username}
            </Select.Option>
          ))}
        </Select>
      </div>

      {stats && (
        <>
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总工单数"
                  value={stats.totalOrders}
                  suffix="个"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已完成工单"
                  value={stats.completedOrders}
                  suffix="个"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="完成率"
                  value={stats.completionRate * 100}
                  suffix="%"
                  precision={1}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均评分"
                  value={stats.averageRating}
                  precision={1}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="mb-6">
            <Col span={24}>
              <Card title="月度工单数量趋势">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="orderCount" name="工单数量" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="mb-6">
            <Col span={12}>
              <Card title="月度完成率趋势">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                      <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="completionRate" name="完成率" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="月度评分趋势">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="averageRating" name="平均评分" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="月度统计详情">
            <Table
              columns={columns}
              dataSource={stats.monthlyStats}
              rowKey="month"
              loading={loading}
            />
          </Card>
        </>
      )}
    </div>
  );
} 