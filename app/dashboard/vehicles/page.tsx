'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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
      setData(Array.isArray(responseData.data) ? responseData.data : []);
      setTotal(responseData.total || 0);
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
          active: { color: 'green', text: '正常' },
          maintenance: { color: 'orange', text: '保养中' },
          inactive: { color: 'red', text: '停用' },
          default: { color: 'default', text: '未知状态' }
        };
        
        const statusConfig = statusMap[status as keyof typeof statusMap] || statusMap.default;
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
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
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">车辆管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
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
      />
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
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