'use client';

import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  message,
  Alert,
} from 'antd';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

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
  const [technicians, setTechnicians] = useState<any[]>([]);
  const router = useRouter();
  
  // 获取当前用户登录状态
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // 如果用户未登录，显示提示信息并重定向
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录后再进行预约');
      router.push('/login?redirect=/appointment');
    }
  }, [isAuthenticated, router]);

  // 如果用户未登录，不显示表单
  if (!isAuthenticated) {
    return null;
  }

  // 获取技师列表
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await fetch('/api/users?role=technician');
        const result = await response.json();
        
        if (!response.ok) {
          console.error('获取技师列表失败:', result.message);
          return;
        }
        
        const activeTechnicians = (result.data || []).filter((tech: any) => tech.status === 'active');
        console.log('获取到技师列表:', activeTechnicians.length);
        setTechnicians(activeTechnicians);
      } catch (error) {
        console.error('获取技师列表失败:', error);
      }
    };
    
    fetchTechnicians();
  }, []);

  // 当用户登录状态变化时，自动填充用户信息
  console.log('user111', user);
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name || user.username,
        phone: user.phone || '',
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 确保使用用户登录信息
      const name = user?.name || user?.username || values.name;
      const phone = user?.phone || values.phone;
      
      // 兼容新的数据结构，同时提供扁平结构和timeSlot结构
      const formattedData = {
        customer: {
          name,
          phone,
        },
        vehicleBrand: values.vehicleBrand,
        vehicleModel: values.vehicleModel,
        licensePlate: values.licensePlate,
        serviceType: values.serviceType,
        serviceDescription: values.description,
        // 提供扁平结构的日期和时间
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.time.format('HH:mm'),
        // 如果选择了技师，则传递技师ID
        technician: values.technician || null,
        // 同时提供timeSlot结构以确保兼容性
        timeSlot: {
          date: values.date.format('YYYY-MM-DD'),
          startTime: values.time.format('HH:mm'),
          technician: values.technician || null
        },
        // 添加用户ID关联
        user: user?._id
      };

      console.log('正在提交预约数据:', JSON.stringify(formattedData, null, 2));

      const response = await fetch('/api/appointments/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      message.success('预约成功！我们会尽快与您联系确认。');
      form.resetFields();
      
      // 预约成功后跳转到成功页面
      router.push('/appointment-success');
      
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
        <Input placeholder="请输入姓名" disabled={!!user} />
      </Form.Item>

      <Form.Item
        name="phone"
        label="联系电话"
        rules={[
          { required: true, message: '请输入联系电话' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
        ]}
      >
        <Input placeholder="请输入手机号码" disabled={!!user} />
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
        name="description"
        label="问题描述"
        rules={[{ required: true, message: '请描述车辆问题或服务需求' }]}
      >
        <TextArea 
          rows={4}
          placeholder="请简要描述您的车辆问题或服务需求"
        />
      </Form.Item>

      <Form.Item
        name="date"
        label="期望预约日期"
        rules={[{ required: true, message: '请选择预约日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="time"
        label="期望预约时间"
        rules={[{ required: true, message: '请选择预约时间' }]}
      >
        <TimePicker 
          format="HH:mm"
          minuteStep={30}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="technician"
        label="选择技师"
      >
        <Select placeholder="请选择技师(可选)">
          {technicians.map(tech => (
            <Option key={tech._id} value={tech._id}>
              {tech.name || tech.username || '未命名技师'}
            </Option>
          ))}
        </Select>
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