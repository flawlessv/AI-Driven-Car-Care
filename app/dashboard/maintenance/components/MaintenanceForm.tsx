'use client';

import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import type { MaintenanceFormData, MaintenanceRecord } from '../types';
import type { Vehicle } from '../../vehicles/types';
import dayjs from 'dayjs';

interface MaintenanceFormProps {
  initialValues?: MaintenanceRecord;
  onFinish: (values: MaintenanceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function MaintenanceForm({
  initialValues,
  onFinish,
  onCancel,
  loading = false,
}: MaintenanceFormProps) {
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchTechnicians();
  }, []);

  const fetchVehicles = async () => {
    try {
      setFetchingVehicles(true);
      const response = await fetch('/api/vehicles');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取车辆列表失败');
      }

      const { data: responseData } = result;
      setVehicles(Array.isArray(responseData.data) ? responseData.data : []);
    } catch (error: any) {
      message.error(error.message || '获取车辆列表失败');
    } finally {
      setFetchingVehicles(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const response = await fetch('/api/users?role=technician&status=active');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }

      // 只显示在职的技师
      const activeTechnicians = result.data.filter((tech: any) => tech.status === 'active');
      setTechnicians(activeTechnicians.map((tech: any) => ({
        _id: tech._id,
        name: tech.name || tech.username,
        specialties: tech.specialties || []
      })));
    } catch (error: any) {
      console.error('获取技师列表失败:', error);
      message.error('获取技师列表失败');
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleFinish = async (values: any) => {
    try {
      const formData: MaintenanceFormData = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        completionDate: values.completionDate?.format('YYYY-MM-DD'),
      };
      await onFinish(formData);
    } catch (error: any) {
      // 处理API返回的错误结构
      if (error.errors?.general) {
        // 如果有general错误，显示第一个错误消息
        message.error(error.errors.general[0]);
      } else if (error.errors) {
        // 如果有其他字段错误，显示所有错误消息
        const errorMessages = Object.values(error.errors).flat();
        message.error(errorMessages.join('；'));
      } else {
        // 如果只有普通错误消息
        message.error(error.message || '提交失败');
      }
    }
  };

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        startDate: dayjs(initialValues.startDate),
        completionDate: initialValues.completionDate ? dayjs(initialValues.completionDate) : undefined,
        vehicle: typeof initialValues.vehicle === 'string' ? initialValues.vehicle : initialValues.vehicle._id,
      });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        type: 'regular',
        status: 'pending',
      }}
    >
      <Form.Item
        name="vehicle"
        label="车辆"
        rules={[{ required: true, message: '请选择车辆' }]}
      >
        <Select
          loading={fetchingVehicles}
          placeholder="请选择车辆"
          options={vehicles.map(vehicle => ({
            label: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
            value: vehicle._id,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="type"
        label="保养类型"
        rules={[{ required: true, message: '请选择保养类型' }]}
      >
        <Select
          options={[
            { label: '常规保养', value: 'regular' },
            { label: '维修', value: 'repair' },
            { label: '年检', value: 'inspection' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="描述"
        rules={[{ required: true, message: '请输入保养描述' }]}
      >
        <Input.TextArea rows={4} placeholder="请输入保养描述" />
      </Form.Item>

      <Form.Item
        name="startDate"
        label="开始日期"
        rules={[{ required: true, message: '请选择开始日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="completionDate"
        label="完成日期"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="mileage"
        label="当前里程数"
        rules={[{ required: true, message: '请输入当前里程数' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          placeholder="请输入当前里程数"
          addonAfter="km"
        />
      </Form.Item>

      <Form.Item
        name="cost"
        label="费用"
        rules={[{ required: true, message: '请输入费用' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          placeholder="请输入费用"
          addonAfter="元"
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="状态"
        rules={[{ required: true, message: '请选择状态' }]}
      >
        <Select
          options={[
            { label: '待处理', value: 'pending' },
            { label: '进行中', value: 'in_progress' },
            { label: '已完成', value: 'completed' },
            { label: '已取消', value: 'cancelled' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="technician"
        label="技师"
      >
        <Select
          loading={loadingTechnicians}
          placeholder="请选择技师"
          options={technicians.map(technician => ({
            label: technician.name,
            value: technician._id,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label="备注"
      >
        <Input.TextArea rows={4} placeholder="请输入备注信息" />
      </Form.Item>

      <Form.Item>
        <Space className="w-full justify-end">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
} 