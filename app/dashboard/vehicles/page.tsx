'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, message, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CarOutlined, ToolOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import VehicleForm from './components/VehicleForm';
import type { Vehicle, VehicleFormData, VehiclesResponse } from './types';

export default function VehiclesPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    inMaintenance: 0
  });

  const fetchVehicles = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/vehicles?page=${page}&limit=${limit}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      // 处理嵌套的数据结构
      const { data: responseData } = result;
      const vehiclesData = Array.isArray(responseData.data) ? responseData.data : [];
      setData(vehiclesData);
      setTotal(responseData.total || 0);
      
      // 计算统计数据
      setStats({
        totalVehicles: vehiclesData.length,
        activeVehicles: vehiclesData.filter(v => v.status === 'active').length,
        inMaintenance: vehiclesData.filter(v => v.status === 'maintenance').length
      });
    } catch (error: any) {
      message.error(error.message || '获取车辆列表失败');
      // 发生错误时设置空数组
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const columns: ColumnsType<Vehicle> = [
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: string, record) => (
        <div className="flex items-center">
          <CarOutlined className="mr-2 text-blue-500" />
          <span className="font-medium">{brand}</span>
        </div>
      ),
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: '车牌号',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (plate: string) => <span className="font-medium">{plate}</span>,
    },
    {
      title: '车架号',
      dataIndex: 'vin',
      key: 'vin',
    },
    {
      title: '里程数',
      dataIndex: 'mileage',
      key: 'mileage',
      render: (mileage: number) => `${mileage.toLocaleString()} km`,
    },
    {
      title: '车主姓名',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: '联系方式',
      dataIndex: 'ownerContact',
      key: 'ownerContact',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { className: 'status-badge status-badge-completed', text: '正常' },
          maintenance: { className: 'status-badge status-badge-in-progress', text: '保养中' },
          inactive: { className: 'status-badge status-badge-cancelled', text: '停用' },
          default: { className: 'status-badge', text: '未知状态' }
        };
        
        const statusConfig = statusMap[status as keyof typeof statusMap] || statusMap.default;
        return <span className={statusConfig.className}>{statusConfig.text}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-500 hover:text-blue-600"
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setModalTitle('添加车辆');
    setEditingVehicle(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Vehicle) => {
    setModalTitle('编辑车辆');
    setEditingVehicle(record);
    setModalVisible(true);
  };

  const handleDelete = (record: Vehicle) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除车牌号为 ${record.licensePlate} 的车辆记录吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/vehicles/${record._id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('删除车辆失败');
          }

          message.success('删除成功');
          fetchVehicles(currentPage, pageSize);
        } catch (error: any) {
          message.error(error.message || '删除车辆失败');
        }
      },
    });
  };

  const handleFormSubmit = async (values: VehicleFormData) => {
    try {
      setSubmitting(true);
      console.log('提交的表单数据:', values);
      const url = editingVehicle
        ? `/api/vehicles/${editingVehicle._id}`
        : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      console.log('API响应:', result);

      if (!response.ok) {
        throw new Error(result.message || (editingVehicle ? '更新车辆失败' : '添加车辆失败'));
      }

      message.success(editingVehicle ? '更新成功' : '添加成功');
      setModalVisible(false);
      fetchVehicles(currentPage, pageSize);
    } catch (error: any) {
      console.error('提交表单错误:', error);
      message.error(error.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  return (
    <div className="page-transition">
      <div className="page-title">
        <h1>车辆管理</h1>
        <div className="description">查看和管理所有车辆信息</div>
      </div>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">车辆总数</div>}
                value={stats.totalVehicles}
                prefix={<CarOutlined className="text-blue-500 mr-1" />}
                valueStyle={{ color: '#1890ff', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">正常使用</div>}
                value={stats.activeVehicles}
                prefix={<CarOutlined className="text-green-500 mr-1" />}
                valueStyle={{ color: '#52c41a', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">保养中</div>}
                value={stats.inMaintenance}
                prefix={<ToolOutlined className="text-amber-500 mr-1" />}
                valueStyle={{ color: '#faad14', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
      </Row>
      
      <Card className="dashboard-card fade-in mb-6">
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="admin-btn admin-btn-primary"
          >
            添加车辆
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={handleTableChange}
          className="dashboard-table"
        />
      </Card>
      
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        className="enhanced-modal"
      >
        <VehicleForm
          initialValues={editingVehicle || undefined}
          onFinish={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
          loading={submitting}
        />
      </Modal>
    </div>
  );
} 