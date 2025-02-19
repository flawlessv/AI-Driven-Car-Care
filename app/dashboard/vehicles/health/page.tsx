'use client';

import { useState, useEffect } from 'react';
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
  Select,
  message,
  Tag,
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
  totalScore: number;
  details: {
    ageScore: number;
    mileageScore: number;
    maintenanceScore: number;
    statusScore: number;
  };
  suggestions: string[];
}

interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive';
  healthScore?: HealthScore;
}

interface HealthReport {
  score: HealthScore;
  recommendations: string[];
  warnings: string[];
  lastUpdate: Date;
}

// 默认健康评分数据
const defaultHealthReport: HealthReport = {
  score: {
    totalScore: 0,
    details: {
      ageScore: 0,
      mileageScore: 0,
      maintenanceScore: 0,
      statusScore: 0,
    },
    suggestions: [],
  },
  recommendations: [],
  warnings: [],
  lastUpdate: new Date(),
};

export default function VehicleHealthPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehiclesHealth();
  }, []);

  const fetchVehiclesHealth = async () => {
    try {
      setLoading(true);
      console.log('开始获取车辆列表...');
      
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error(`获取车辆列表失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('车辆列表API响应:', result);

      if (!result.data?.data) {
        throw new Error('车辆列表数据格式错误');
      }

      // 获取所有车辆的健康评分
      const vehiclesWithHealth = await Promise.all(
        result.data.data.map(async (vehicle: Vehicle) => {
          try {
            const healthUrl = `/api/vehicles/${vehicle._id}/health`;
            console.log(`正在请求健康评分API: ${healthUrl}`);
            
            const healthResponse = await fetch(healthUrl);
            if (!healthResponse.ok) {
              throw new Error(`健康评分API请求失败: ${healthResponse.status} ${healthResponse.statusText}`);
            }
            
            const healthResult = await healthResponse.json();
            console.log(`车辆 ${vehicle.licensePlate} 的健康评分API响应:`, healthResult);
            
            if (!healthResult.data?.data) {
              throw new Error('健康评分数据格式错误');
            }
            
            // 确保健康评分数据结构完整
            const healthScore = {
              totalScore: Number(healthResult.data.data.totalScore) || 0,
              details: {
                ageScore: Number(healthResult.data.data.details?.ageScore) || 0,
                mileageScore: Number(healthResult.data.data.details?.mileageScore) || 0,
                maintenanceScore: Number(healthResult.data.data.details?.maintenanceScore) || 0,
                statusScore: Number(healthResult.data.data.details?.statusScore) || 0,
              },
              suggestions: Array.isArray(healthResult.data.data.suggestions) ? healthResult.data.data.suggestions : []
            };

            console.log(`处理后的健康评分数据:`, healthScore);

            return {
              ...vehicle,
              healthScore
            };
          } catch (error) {
            console.error(`获取车辆 ${vehicle.licensePlate} 健康评分失败:`, error);
            message.error(`获取车辆 ${vehicle.licensePlate} 健康评分失败`);
            return {
              ...vehicle,
              healthScore: null
            };
          }
        })
      );

      console.log('所有车辆数据处理完成:', vehiclesWithHealth);
      setVehicles(vehiclesWithHealth);
    } catch (error: any) {
      console.error('获取车辆健康评分失败:', error);
      setError(error.message || '获取车辆健康评分失败');
      message.error(error.message || '获取车辆健康评分失败');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return '良好';
    if (score >= 60) return '一般';
    return '需注意';
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
      <div className="p-6">
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">车辆健康评分</h1>
      <Row gutter={[16, 16]}>
        {vehicles.map(vehicle => (
          <Col key={vehicle._id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              title={
                <div className="flex justify-between items-center">
                  <span>{vehicle.licensePlate}</span>
                  <Tag color={
                    vehicle.status === 'active' ? 'green' :
                    vehicle.status === 'maintenance' ? 'orange' : 'red'
                  }>
                    {
                      vehicle.status === 'active' ? '正常' :
                      vehicle.status === 'maintenance' ? '保养中' : '停用'
                    }
                  </Tag>
                </div>
              }
              className="h-full"
            >
              {vehicle.healthScore ? (
                <>
                  <div className="text-center mb-4">
                    <Progress
                      type="dashboard"
                      percent={vehicle.healthScore.totalScore}
                      strokeColor={getScoreColor(vehicle.healthScore.totalScore)}
                      format={percent => (
                        <div>
                          <div className="text-2xl">{percent}</div>
                          <div className="text-sm">{getScoreStatus(percent)}</div>
                        </div>
                      )}
                    />
                  </div>
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic
                        title="车龄评分"
                        value={vehicle.healthScore.details?.ageScore || 0}
                        suffix="/20"
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="里程评分"
                        value={vehicle.healthScore.details?.mileageScore || 0}
                        suffix="/30"
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="保养评分"
                        value={vehicle.healthScore.details?.maintenanceScore || 0}
                        suffix="/30"
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="状态评分"
                        value={vehicle.healthScore.details?.statusScore || 0}
                        suffix="/20"
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                  </Row>
                  {vehicle.healthScore.suggestions && vehicle.healthScore.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">建议</h4>
                      <List
                        size="small"
                        dataSource={vehicle.healthScore.suggestions}
                        renderItem={item => (
                          <List.Item className="py-1">
                            <div className="text-xs text-gray-600">{item}</div>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">暂无健康评分数据</div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
} 

