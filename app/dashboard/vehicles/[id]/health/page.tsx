'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Progress,
  List,
  Typography,
  Alert,
  Spin,
  Statistic,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CarOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  AlertOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface HealthScore {
  overall: number;
  maintenance: number;
  mileage: number;
  age: number;
  repairs: number;
}

interface HealthReport {
  score: HealthScore;
  recommendations: string[];
  warnings: string[];
  lastUpdate: Date;
}

export default function VehicleHealthPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthReport();
  }, []);

  const fetchHealthReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vehicles/${params.id}/health`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取健康报告失败');
      }

      setHealthReport(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        className="m-6"
      />
    );
  }

  if (!healthReport) {
    return (
      <Alert
        message="暂无数据"
        description="未能获取车辆健康报告"
        type="info"
        showIcon
        className="m-6"
      />
    );
  }

  return (
    <div className="p-6">
      <Title level={2}>车辆健康评分</Title>
      <Text type="secondary" className="block mb-6">
        最后更新时间：{new Date(healthReport.lastUpdate).toLocaleString()}
      </Text>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div className="text-center">
              <Progress
                type="dashboard"
                percent={healthReport.score.overall}
                strokeColor={getScoreColor(healthReport.score.overall)}
                format={percent => (
                  <div>
                    <div className="text-2xl font-bold">{percent}</div>
                    <div className="text-sm text-gray-500">总体评分</div>
                  </div>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="保养评分"
              value={healthReport.score.maintenance}
              suffix="/100"
              prefix={<ToolOutlined />}
              valueStyle={{ color: getScoreColor(healthReport.score.maintenance) }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="里程评分"
              value={healthReport.score.mileage}
              suffix="/100"
              prefix={<CarOutlined />}
              valueStyle={{ color: getScoreColor(healthReport.score.mileage) }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="车龄评分"
              value={healthReport.score.age}
              suffix="/100"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: getScoreColor(healthReport.score.age) }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="维修评分"
              value={healthReport.score.repairs}
              suffix="/100"
              prefix={<AlertOutlined />}
              valueStyle={{ color: getScoreColor(healthReport.score.repairs) }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <CheckCircleOutlined className="mr-2 text-green-500" />
                建议
              </span>
            }
          >
            <List
              dataSource={healthReport.recommendations}
              renderItem={item => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无建议' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <WarningOutlined className="mr-2 text-yellow-500" />
                警告
              </span>
            }
          >
            <List
              dataSource={healthReport.warnings}
              renderItem={item => (
                <List.Item>
                  <Text type="danger">{item}</Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无警告' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 