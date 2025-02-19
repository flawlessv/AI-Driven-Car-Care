'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Descriptions,
  Tabs,
  Timeline,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  CarOutlined,
  FileTextOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';

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

interface VehicleFile {
  _id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  engineNumber?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  mileage: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceRecords?: any[];
  insuranceRecords?: any[];
  status: 'active' | 'inactive' | 'maintenance';
  ownerName: string;
  ownerContact: string;
  createdAt: string;
  updatedAt: string;
  healthScore?: HealthScore;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function VehicleFilesPage() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleFile[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFile | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  useEffect(() => {
    fetchVehicles(1);
  }, []);

  const fetchVehicles = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vehicles?page=${page}&limit=10`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      // 处理嵌套的data结构
      const vehiclesData = result.data?.data || [];
      setVehicles(vehiclesData);
      
      // 更新分页信息
      setPagination({
        total: result.data.total,
        page: result.data.page,
        limit: result.data.limit,
        totalPages: result.data.totalPages
      });
    } catch (error: any) {
      console.error('获取车辆列表失败:', error);
      message.error(error.message || '获取车辆列表失败');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchVehicles(pagination.current);
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
    },
    {
      title: '品牌型号',
      key: 'model',
      render: (record: VehicleFile) => `${record.brand} ${record.model}`,
    },
    {
      title: '车主',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: '联系方式',
      dataIndex: 'ownerContact',
      key: 'ownerContact',
    },
    {
      title: '上次保养',
      dataIndex: 'lastMaintenanceDate',
      key: 'lastMaintenanceDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '正常' },
          inactive: { color: 'red', text: '停用' },
          maintenance: { color: 'orange', text: '维修中' },
        };
        const currentStatus = statusMap[status as keyof typeof statusMap];
        return <Tag color={currentStatus.color}>{currentStatus.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: VehicleFile) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = async (vehicle: VehicleFile) => {
    try {
      // 获取详细信息
      const [vehicleResponse, healthResponse] = await Promise.all([
        fetch(`/api/vehicles/${vehicle._id}`),
        fetch(`/api/vehicles/${vehicle._id}/health`)
      ]);

      const [vehicleResult, healthResult] = await Promise.all([
        vehicleResponse.json(),
        healthResponse.json()
      ]);
      
      if (!vehicleResponse.ok) {
        throw new Error(vehicleResult.message || '获取车辆详情失败');
      }

      if (!healthResponse.ok) {
        throw new Error(healthResult.message || '获取健康评分失败');
      }

      // 正确获取嵌套的数据结构
      const vehicleData = {
        ...vehicleResult.data.data,
        maintenanceRecords: Array.isArray(vehicleResult.data.data.maintenanceRecords) ? vehicleResult.data.data.maintenanceRecords : [],
        mileage: typeof vehicleResult.data.data.mileage === 'number' ? vehicleResult.data.data.mileage : 0,
        year: typeof vehicleResult.data.data.year === 'number' ? vehicleResult.data.data.year : new Date().getFullYear(),
        brand: vehicleResult.data.data.brand || '',
        model: vehicleResult.data.data.model || '',
        licensePlate: vehicleResult.data.data.licensePlate || '',
        vin: vehicleResult.data.data.vin || '',
        ownerName: vehicleResult.data.data.ownerName || '',
        ownerContact: vehicleResult.data.data.ownerContact || '',
        status: vehicleResult.data.data.status || 'inactive',
        healthScore: healthResult.data
      };

      console.log('处理后的车辆数据:', vehicleData);
      setSelectedVehicle(vehicleData);
      setDetailVisible(true);
    } catch (error: any) {
      console.error('获取车辆详情失败:', error);
      message.error(error.message || '获取车辆详情失败');
    }
  };

  const items: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: selectedVehicle && (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="车牌号">{selectedVehicle.licensePlate || '-'}</Descriptions.Item>
          <Descriptions.Item label="品牌型号">
            {selectedVehicle.brand && selectedVehicle.model ? 
              `${selectedVehicle.brand} ${selectedVehicle.model}` : 
              '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="年份">{selectedVehicle.year || '-'}</Descriptions.Item>
          <Descriptions.Item label="VIN码">{selectedVehicle.vin || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前里程">
            {typeof selectedVehicle.mileage === 'number' ? 
              `${selectedVehicle.mileage.toLocaleString()} km` : 
              '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="车主姓名">{selectedVehicle.ownerName || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系方式">{selectedVehicle.ownerContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={
              selectedVehicle.status === 'active' ? 'green' :
              selectedVehicle.status === 'maintenance' ? 'orange' : 'red'
            }>
              {
                selectedVehicle.status === 'active' ? '正常' :
                selectedVehicle.status === 'maintenance' ? '保养中' : '停用'
              }
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'health',
      label: '健康评分',
      children: selectedVehicle?.healthScore && (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <div className="text-center">
                  <Statistic
                    title="综合健康评分"
                    value={selectedVehicle.healthScore.totalScore}
                    suffix="/100"
                    valueStyle={{
                      color: selectedVehicle.healthScore.totalScore >= 80 ? '#3f8600' :
                             selectedVehicle.healthScore.totalScore >= 60 ? '#d48806' : '#cf1322',
                      fontSize: '36px'
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="车龄评分"
                  value={selectedVehicle.healthScore.details.ageScore}
                  suffix="/20"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="里程评分"
                  value={selectedVehicle.healthScore.details.mileageScore}
                  suffix="/30"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="保养评分"
                  value={selectedVehicle.healthScore.details.maintenanceScore}
                  suffix="/30"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="状态评分"
                  value={selectedVehicle.healthScore.details.statusScore}
                  suffix="/20"
                />
              </Card>
            </Col>
          </Row>
          <Card title="健康建议">
            <ul className="list-disc pl-4 space-y-2">
              {selectedVehicle.healthScore.suggestions.map((suggestion, index) => (
                <li key={index} className="text-gray-600">{suggestion}</li>
              ))}
            </ul>
          </Card>
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: '保养记录',
      children: selectedVehicle?.maintenanceRecords && selectedVehicle.maintenanceRecords.length > 0 ? (
        <Timeline
          items={selectedVehicle.maintenanceRecords.map(record => ({
            color: record.status === 'completed' ? 'green' : 'blue',
            children: (
              <div>
                <p>
                  <Tag color={record.status === 'completed' ? 'green' : 'blue'}>
                    {record.type === 'regular' ? '常规保养' : record.type === 'repair' ? '维修' : '检查'}
                  </Tag>
                  <span className="ml-2">{dayjs(record.startDate).format('YYYY-MM-DD')}</span>
                  {record.technician && (
                    <span className="ml-2">技师: {record.technician.name}</span>
                  )}
                </p>
                <p className="mt-2">{record.description}</p>
                <p className="text-gray-500">
                  费用：¥{record.cost?.toLocaleString() || 0} | 里程：{record.mileage || 0}km
                </p>
                {record.status === 'completed' && record.completionDate && (
                  <p className="text-gray-500">
                    完成时间：{dayjs(record.completionDate).format('YYYY-MM-DD')}
                  </p>
                )}
              </div>
            ),
          }))}
        />
      ) : (
        <div className="text-center text-gray-500 py-4">暂无保养记录</div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="车辆档案">
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: pagination.total,
            pageSize: pagination.limit,
            current: pagination.page,
            showSizeChanger: false
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="车辆详细信息"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={800}
        footer={null}
      >
        {selectedVehicle && (
          <>
            <Row gutter={[16, 16]} className="mb-6">
              <Col span={12}>
                <Statistic
                  title="车龄"
                  value={selectedVehicle.year ? new Date().getFullYear() - selectedVehicle.year : 0}
                  prefix={<ClockCircleOutlined />}
                  suffix="年"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="当前里程"
                  value={typeof selectedVehicle.mileage === 'number' ? selectedVehicle.mileage : 0}
                  prefix={<CarOutlined />}
                  suffix="km"
                  formatter={value => value.toLocaleString()}
                />
              </Col>
            </Row>
            <Tabs items={items} />
          </>
        )}
      </Modal>
    </div>
  );
} 
