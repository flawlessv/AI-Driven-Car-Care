'use client';

/**
 * 保养表单组件
 * 该组件用于创建或编辑保养记录，包含所有保养相关的表单字段
 * 支持初始化数据展示、表单验证和提交功能
 */

import { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import type { MaintenanceFormData, MaintenanceRecord } from '../types';
import type { Vehicle } from '../../vehicles/types';
import dayjs from 'dayjs';

/**
 * 保养表单组件属性接口
 * @param initialValues - 可选的初始值，用于编辑模式
 * @param onFinish - 表单完成提交时的回调函数
 * @param onCancel - 取消表单时的回调函数
 * @param loading - 是否显示加载状态
 */
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
  // 表单实例
  const [form] = Form.useForm();
  // 车辆列表状态
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  // 技师列表状态
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  // 组件挂载时获取车辆和技师数据
  useEffect(() => {
    fetchVehicles();
    fetchTechnicians();
  }, []);

  /**
   * 获取车辆列表数据
   * 从API获取所有可用的车辆信息并更新状态
   */
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

  /**
   * 获取技师列表数据
   * 从API获取所有在职技师信息并更新状态
   */
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

  /**
   * 处理表单提交
   * 格式化日期并调用onFinish回调函数
   */
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

  // 当初始值存在时，设置表单字段值
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
      {/* 车辆选择字段 */}
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

      {/* 保养类型字段 */}
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

      {/* 保养描述字段 */}
      <Form.Item
        name="description"
        label="描述"
        rules={[{ required: true, message: '请输入保养描述' }]}
      >
        <Input.TextArea rows={4} placeholder="请输入保养描述" />
      </Form.Item>

      {/* 开始日期字段 */}
      <Form.Item
        name="startDate"
        label="开始日期"
        rules={[{ required: true, message: '请选择开始日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      {/* 完成日期字段（可选） */}
      <Form.Item
        name="completionDate"
        label="完成日期"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      {/* 里程数字段 */}
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

      {/* 费用字段 */}
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

      {/* 状态字段 */}
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

      {/* 技师字段 */}
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

      {/* 备注字段（可选） */}
      <Form.Item
        name="notes"
        label="备注"
      >
        <Input.TextArea rows={4} placeholder="请输入备注信息" />
      </Form.Item>

      {/* 表单按钮区域 */}
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