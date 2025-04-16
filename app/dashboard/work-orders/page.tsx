'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Table,
  Button,
  Space,
  Modal,
  message,
  Tag,
  Select,
  Form,
  Card,
  Statistic,
  Badge,
  Row,
  Col,
  Tooltip,
  Avatar,
  Dropdown,
} from 'antd';
import { PlusOutlined, CheckOutlined, EditOutlined, DeleteOutlined, MoreOutlined, SyncOutlined, FileDoneOutlined, ClockCircleOutlined, ToolOutlined, UserOutlined, CarOutlined, CloseCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { RootState } from '@/app/lib/store';
import type { Vehicle } from '@/types/vehicle';
import type { WorkOrder } from '@/types/workOrder';
import WorkOrderForm from './components/WorkOrderForm';
import { statusText, statusColor } from './components/StatusTag';
import Link from 'next/link';
import dayjs from 'dayjs';

const priorityText = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const priorityColor = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

// 工单类型显示文本映射
const typeOptions = {
  maintenance: '常规保养',
  repair: '维修',
  inspection: '检查',
  regular: '常规保养',
  accident: '事故维修',
  other: '其他',
};

export default function WorkOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WorkOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedVehicle, setSelectedVehicle] = useState<string>();
  const [selectedPriority, setSelectedPriority] = useState<string>();
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    on_hold: 0,
    completed: 0,
    cancelled: 0,
  });

  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    fetchVehicles();
    fetchWorkOrders();
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

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedVehicle) queryParams.append('vehicle', selectedVehicle);
      if (selectedPriority) queryParams.append('priority', selectedPriority);

      // 添加随机参数，确保不使用缓存结果
      queryParams.append('_t', Date.now().toString());

      const response = await fetch(`/api/work-orders?${queryParams}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取工单列表失败');
      }

      // 处理不同的数据结构
      let workOrders = [];
      if (Array.isArray(result.data)) {
        workOrders = result.data;
      } else if (result.data && Array.isArray(result.data.data)) {
        workOrders = result.data.data;
      } else {
        console.error('工单数据格式错误:', result);
        throw new Error('工单数据格式错误');
      }

      // 获取工单统计数据
      const totalOrders = workOrders.length;
      const pendingOrders = workOrders.filter(order => order.status === 'pending').length;
      const inProgressOrders = workOrders.filter(order => order.status === 'in_progress').length;
      const onHoldOrders = workOrders.filter(order => order.status === 'on_hold').length;
      const completedOrders = workOrders.filter(order => order.status === 'completed').length;
      const cancelledOrders = workOrders.filter(order => order.status === 'cancelled').length;

      setStats({
        total: totalOrders,
        pending: pendingOrders,
        in_progress: inProgressOrders,
        on_hold: onHoldOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
      });

      setData(workOrders);
    } catch (error: any) {
      console.error('获取工单列表失败:', error);
      message.error(error.message || '获取工单列表失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleView = (record: WorkOrder) => {
    router.push(`/dashboard/work-orders/${record._id}`);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      if (response.ok) {
        message.success('工单创建成功');
        setModalVisible(false);
        fetchWorkOrders();
      } else {
        message.error(result.message || '工单创建失败');
      }
    } catch (error) {
      console.error('创建工单失败:', error);
      message.error('工单创建失败');
    }
  };

  const handleStatusChange = async (record: WorkOrder, newStatus: string) => {
    try {
      const response = await fetch(`/api/work-orders/${record._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新工单状态失败');
      }

      message.success('工单状态已更新');
      fetchWorkOrders();
    } catch (error: any) {
      console.error('更新工单状态失败:', error);
      message.error(error.message || '更新工单状态失败');
    }
  };

  const handleDelete = async (record: WorkOrder) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除工单 #${record._id.slice(-8)} 吗？`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/work-orders/${record._id}`, {
            method: 'DELETE',
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || '删除工单失败');
          }

          message.success('工单已删除');
          fetchWorkOrders();
        } catch (error: any) {
          console.error('删除工单失败:', error);
          message.error(error.message || '删除工单失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => (
        <Link href={`/dashboard/work-orders/${id}`} className="font-medium text-blue-600 hover:text-blue-800">
          #{id.slice(-8)}
        </Link>
      ),
    },
    {
      title: '客户信息',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: any) => (
        <div>
          <div className="font-medium flex items-center">
            <UserOutlined className="mr-1 text-blue-500" /> 
            {customer?.name}
          </div>
          <div className="text-gray-500 text-sm">{customer?.phone}</div>
        </div>
      ),
    },
    {
      title: '车辆信息',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle: any) => (
        <div className="flex items-center">
          <CarOutlined className="mr-1 text-green-500" /> 
          <span>{vehicle?.brand} {vehicle?.model} <span className="text-gray-600">({vehicle?.licensePlate})</span></span>
        </div>
      ),
    },
    {
      title: '工单类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: keyof typeof typeOptions) => (
        <div className="flex items-center">
          <ToolOutlined className="mr-1 text-purple-500" />
          <span className="capitalize">{typeOptions[type] || type}</span>
        </div>
      ),
    },
    {
      title: '技师',
      dataIndex: 'technician',
      key: 'technician',
      render: (technician: any) => (
        technician?.name ? (
          <div className="flex items-center">
            <Avatar 
              size="small" 
              style={{ backgroundColor: '#1890ff' }} 
              className="mr-2"
            >
              {technician.name.charAt(0)}
            </Avatar>
            {technician.name}
          </div>
        ) : '未分配'
      ),
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-1 text-blue-500" />
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusText) => (
        <Tag color={statusColor[status]}>
          {statusText[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link href={`/dashboard/work-orders/${record._id}`}>
            <Button type="text" className="text-blue-500 hover:text-blue-600">
              查看
            </Button>
          </Link>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'pending',
                  label: '标记为待处理',
                  icon: <ExclamationCircleOutlined style={{ color: statusColor.pending }} />,
                  disabled: record.status === 'pending',
                  onClick: () => handleStatusChange(record, 'pending'),
                },
                {
                  key: 'in_progress',
                  label: '标记为进行中',
                  icon: <SyncOutlined style={{ color: statusColor.in_progress }} />,
                  disabled: record.status === 'in_progress',
                  onClick: () => handleStatusChange(record, 'in_progress'),
                },
                {
                  key: 'on_hold',
                  label: '标记为暂停',
                  icon: <ClockCircleOutlined style={{ color: statusColor.on_hold }} />,
                  disabled: record.status === 'on_hold',
                  onClick: () => handleStatusChange(record, 'on_hold'),
                },
                {
                  key: 'completed',
                  label: '标记为已完成',
                  icon: <CheckCircleOutlined style={{ color: statusColor.completed }} />,
                  disabled: record.status === 'completed',
                  onClick: () => handleStatusChange(record, 'completed'),
                },
                {
                  key: 'cancelled',
                  label: '标记为已取消',
                  icon: <CloseCircleOutlined style={{ color: statusColor.cancelled }} />,
                  disabled: record.status === 'cancelled',
                  onClick: () => handleStatusChange(record, 'cancelled'),
                },
                {
                  key: 'delete',
                  label: '删除工单',
                  icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                  danger: true,
                  onClick: () => handleDelete(record),
                },
              ],
            }}
          >
            <Button type="text">
              <MoreOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-transition">
      <div className="page-title">
        <h1>工单管理</h1>
        <div className="description">查看和管理所有维修保养工单</div>
      </div>
      
      <Row gutter={[16, 16]} className="mb-6 fade-in" style={{animationDelay: '0.1s'}}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">全部工单</div>}
                value={stats.total}
                prefix={<FileDoneOutlined className="text-blue-500 mr-1" />}
                valueStyle={{ color: '#1890ff', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">待处理</div>}
                value={stats.pending}
                prefix={<ClockCircleOutlined className="text-amber-500 mr-1" />}
                valueStyle={{ color: '#faad14', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">进行中</div>}
                value={stats.in_progress}
                prefix={<ToolOutlined className="text-blue-500 mr-1" />}
                valueStyle={{ color: '#1890ff', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">已暂停</div>}
                value={stats.on_hold}
                prefix={<ExclamationCircleOutlined className="text-yellow-500 mr-1" />}
                valueStyle={{ color: '#fadb14', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">已完成</div>}
                value={stats.completed}
                prefix={<CheckCircleOutlined className="text-green-500 mr-1" />}
                valueStyle={{ color: '#52c41a', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">已取消</div>}
                value={stats.cancelled}
                prefix={<CloseCircleOutlined className="text-red-500 mr-1" />}
                valueStyle={{ color: '#ff4d4f', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
      </Row>
      
      <Card className="dashboard-card fade-in mb-6" style={{animationDelay: '0.2s'}}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <Select
              placeholder="工单状态筛选"
              style={{ width: 150 }}
              allowClear
              className="hover-glow"
              onChange={(value) => setSelectedStatus(value)}
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'in_progress', label: '处理中' },
                { value: 'on_hold', label: '已暂停' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
            <Select
              placeholder="车辆筛选"
              style={{ width: 200 }}
              allowClear
              className="hover-glow"
              onChange={(value) => setSelectedVehicle(value)}
              options={vehicles.map((vehicle) => ({
                value: vehicle._id,
                label: `${vehicle.licensePlate} (${vehicle.brand} ${vehicle.model})`,
              }))}
            />
            <Select
              placeholder="优先级筛选"
              style={{ width: 150 }}
              allowClear
              className="hover-glow"
              onChange={(value) => setSelectedPriority(value)}
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
            <Button
              icon={<SyncOutlined />}
              onClick={fetchWorkOrders}
              className="admin-btn hover-glow"
            >
              刷新数据
            </Button>
          </div>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="admin-btn admin-btn-primary hover-glow"
          >
            创建工单
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          rowKey="_id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          className="dashboard-table"
          rowClassName={(record, index) => (index % 2 === 0 ? 'bg-gray-50' : '')}
          columns={columns}
        />
      </Card>

      <Modal
        title="创建工单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
        className="enhanced-modal"
      >
        <WorkOrderForm
          onFinish={handleSubmit}
          vehicles={vehicles}
          form={form}
        />
      </Modal>
    </div>
  );
} 