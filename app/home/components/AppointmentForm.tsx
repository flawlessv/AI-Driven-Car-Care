'use client';

import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { motion } from 'framer-motion';

const { TextArea } = Input;
const { Option } = Select;

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const serviceTypes = [
  { label: '常规保养', value: 'maintenance' },
  { label: '故障维修', value: 'repair' },
  { label: '年检服务', value: 'inspection' },
];

export default function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const formattedData = {
        name: values.name,
        phone: values.phone,
        vehicleBrand: values.vehicleBrand,
        vehicleModel: values.vehicleModel,
        licensePlate: values.licensePlate,
        serviceType: values.serviceType,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        description: values.description
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      message.success('预约成功！我们会尽快与您联系确认。');
      form.resetFields();
      onSuccess?.();
    } catch (error: any) {
      message.error(error.message || '预约失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="appointment-form"
    >
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入您的姓名' }]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="联系电话"
        rules={[
          { required: true, message: '请输入联系电话' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
        ]}
      >
        <Input placeholder="请输入手机号码" />
      </Form.Item>

      <Form.Item
        name="vehicleBrand"
        label="车辆品牌"
        rules={[{ required: true, message: '请输入车辆品牌' }]}
      >
        <Input placeholder="请输入车辆品牌" />
      </Form.Item>

      <Form.Item
        name="vehicleModel"
        label="车型"
        rules={[{ required: true, message: '请输入车型' }]}
      >
        <Input placeholder="请输入车型" />
      </Form.Item>

      <Form.Item
        name="licensePlate"
        label="车牌号"
        rules={[{ required: true, message: '请输入车牌号' }]}
      >
        <Input placeholder="请输入车牌号" />
      </Form.Item>

      <Form.Item
        name="serviceType"
        label="服务类型"
        rules={[{ required: true, message: '请选择服务类型' }]}
      >
        <Select placeholder="请选择服务类型">
          {serviceTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="date"
        label="预约日期"
        rules={[{ required: true, message: '请选择预约日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="time"
        label="预约时间"
        rules={[{ required: true, message: '请选择预约时间' }]}
      >
        <TimePicker 
          format="HH:mm"
          minuteStep={30}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="问题描述"
        rules={[{ required: true, message: '请描述车辆问题或服务需求' }]}
      >
        <TextArea 
          rows={4}
          placeholder="请简要描述您的车辆问题或服务需求"
        />
      </Form.Item>

      <Form.Item>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? '提交中...' : '提交预约'}
        </motion.button>
      </Form.Item>
    </Form>
  );
} 