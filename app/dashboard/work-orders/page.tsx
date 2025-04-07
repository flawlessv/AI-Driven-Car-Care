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
} from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import type { RootState } from '@/lib/store';
import type { Vehicle } from '@/types/vehicle';
import type { WorkOrder } from '@/types/workOrder';
import WorkOrderForm from './components/WorkOrderForm';
import { statusText, statusColor } from './components/StatusTag';

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

// Add type options mapping for repair types
const typeOptions = {
  regular: '常规保养',
  repair: '故障维修',
  accident: '事故维修',
  other: '其他',
};

export default function WorkOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WorkOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [selectedVehicle, setSelectedVehicle] = useState<string>();
  const [selectedPriority, setSelectedPriority] = useState<string>();
  const [form] = Form.useForm();

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

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'orderNumber',
      render: (text: string, record: WorkOrder) => (
        <Button
          type="link"
          onClick={() => handleView(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '车辆',
      dataIndex: ['vehicle'],
      render: (vehicle: any) => {
        if (!vehicle) {
          return <span>未知车辆</span>;
        }
        
        return (
          <span>
            {vehicle?.brand || '未知品牌'} {vehicle?.model || '未知型号'}
            <br />
            {vehicle?.licensePlate || '无车牌'}
          </span>
        );
      },
    },
    {
      title: '维修类型',
      dataIndex: 'type',
      render: (type: keyof typeof typeOptions) => (
        <span>{typeOptions[type] || type}</span>
      ),
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (priority: keyof typeof priorityText) => (
        <Tag color={priorityColor[priority]}>
          {priorityText[priority]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: keyof typeof statusText, record: WorkOrder) => (
        <Tag color={statusColor[status]}>
          {statusText[status]}
        </Tag>
      ),
    },
    {
      title: '技师',
      dataIndex: ['technician', 'username'],
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkOrder) => (
        <Button
          type="link"
          onClick={() => handleView(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">维修工单管理</h1>
        <div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            className="mr-2"
          >
            新建工单
          </Button>
          <Button 
            onClick={fetchWorkOrders}
            loading={loading}
          >
            刷新列表
          </Button>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-4">
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

          {user?.role === 'admin' && (
            <Button 
              type="primary"
              danger
              onClick={() => setSelectedStatus('pending_check')}
              icon={<CheckOutlined />}
            >
              查看待审批工单
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title="创建工单"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <WorkOrderForm
          form={form}
          vehicles={vehicles || []}
          mode="create"
        />
      </Modal>
    </div>
  );
} 