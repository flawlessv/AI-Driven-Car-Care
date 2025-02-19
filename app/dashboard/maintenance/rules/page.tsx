'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MaintenanceRule, Vehicle } from '@/types/maintenance';

export default function MaintenanceRulesPage() {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<MaintenanceRule | null>(null);
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchVehicles();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance/rules');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取保养规则失败');
      }

      setRules(result.data || []);
    } catch (error) {
      console.error('获取保养规则失败:', error);
      message.error('获取保养规则失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await fetch('/api/vehicles?withoutRule=true');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      setVehicles(result.data?.data || []);
    } catch (error: any) {
      console.error('获取车辆列表失败:', error);
      message.error(error.message || '获取车辆列表失败');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: MaintenanceRule) => {
    setEditingRule(record);
    form.setFieldsValue({
      ...record,
      vehicle: record.vehicle._id,
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: MaintenanceRule) => {
    try {
      const response = await fetch(`/api/maintenance/rules/${record._id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('删除失败');
      message.success('删除成功');
      fetchRules();
    } catch (error) {
      console.error('删除保养规则失败:', error);
      message.error('删除保养规则失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingRule
        ? `/api/maintenance/rules/${editingRule._id}`
        : '/api/maintenance/rules';
      const method = editingRule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '保存保养规则失败');
      }
      
      message.success(editingRule ? '更新成功' : '添加成功');
      setModalVisible(false);
      form.resetFields();
      fetchRules();
      fetchVehicles();
    } catch (error: any) {
      console.error('保存保养规则失败:', error);
      message.error(error.message || '保存保养规则失败');
    }
  };

  const columns = [
    {
      title: '车辆信息',
      dataIndex: ['vehicle'],
      key: 'vehicle',
      render: (vehicle: any) => {
        return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : '-';
      },
    },
    {
      title: '提醒类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          mileage: { color: 'blue', text: '里程提醒' },
          time: { color: 'green', text: '时间提醒' },
          both: { color: 'purple', text: '双重提醒' },
        };
        const current = typeMap[type as keyof typeof typeMap];
        return <Tag color={current.color}>{current.text}</Tag>;
      },
    },
    {
      title: '里程间隔',
      dataIndex: 'mileageInterval',
      key: 'mileageInterval',
      render: (val: number) => val ? `${val}公里` : '-',
    },
    {
      title: '时间间隔',
      dataIndex: 'timeInterval',
      key: 'timeInterval',
      render: (val: number) => val ? `${val}天` : '-',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MaintenanceRule) => (
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

  return (
    <div className="p-6">
      <Card
        title="保养规则"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加规则
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingRule ? '编辑保养规则' : '添加保养规则'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="vehicle"
            label="选择车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select loading={loadingVehicles}>
              {vehicles.map(vehicle => (
                <Select.Option key={vehicle._id} value={vehicle._id}>
                  {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="提醒类型"
            rules={[{ required: true, message: '请选择提醒类型' }]}
          >
            <Select>
              <Select.Option value="mileage">里程提醒</Select.Option>
              <Select.Option value="time">时间提醒</Select.Option>
              <Select.Option value="both">双重提醒</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <>
                  {(type === 'mileage' || type === 'both') && (
                    <Form.Item
                      name="mileageInterval"
                      label="里程间隔(公里)"
                      rules={[{ required: true, message: '请输入里程间隔' }]}
                    >
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                  )}

                  {(type === 'time' || type === 'both') && (
                    <Form.Item
                      name="timeInterval"
                      label="时间间隔(天)"
                      rules={[{ required: true, message: '请输入时间间隔' }]}
                    >
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Form.Item
            name="enabled"
            label="状态"
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 