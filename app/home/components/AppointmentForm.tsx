/**
 * 预约表单组件
 * 
 * 这个组件用于客户提交保养/维修预约申请
 * 包含个人信息、车辆信息、服务类型和预约时间等字段
 * 'use client' 标记表示这个组件在浏览器端运行，而不是在服务器端
 */
'use client';

import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
} from 'antd';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/lib/store';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 预约表单组件的属性接口
 * 
 * @property {Function} onSuccess - 可选的成功回调函数
 * @property {Function} onCancel - 可选的取消回调函数
 */
interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 服务类型选项
 * 提供预约服务类型的下拉选项
 */
const serviceTypes = [
  { label: '常规保养', value: 'maintenance' },
  { label: '故障维修', value: 'repair' },
  { label: '年检服务', value: 'inspection' },
];

/**
 * 预约表单组件
 * 用于客户提交车辆维修/保养预约
 * 
 * @param {AppointmentFormProps} props - 组件属性
 * @returns {JSX.Element | null} 返回表单组件或null（用户未登录时）
 */
export default function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  // 创建表单实例
  const [form] = Form.useForm();
  // 提交加载状态
  const [loading, setLoading] = useState(false);
  // 技师列表状态
  const [technicians, setTechnicians] = useState<any[]>([]);
  // 路由实例，用于页面导航
  const router = useRouter();
  
  // 从Redux获取当前用户登录状态
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  /**
   * 检查用户登录状态
   * 如果未登录则显示提示并重定向到登录页面
   */
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

  /**
   * 获取技师列表
   * 从API获取所有可用的技师信息
   */
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await fetch('/api/users?role=technician');
        const result = await response.json();
        if (!response.ok) {
          console.error('获取技师列表失败:', result.message);
          return;
        }
        // 过滤出状态为"active"的技师
        const activeTechnicians = (result.data || []).filter((tech: any) => tech.status === 'active');
        console.log('获取到技师列表:', activeTechnicians.length);
        setTechnicians(activeTechnicians);
      } catch (error) {
        console.error('获取技师列表失败:', error);
      }
    };
    fetchTechnicians();
  }, []);

  /**
   * 当用户登录状态变化时，自动填充用户信息
   * 使用已登录用户的用户名、电话和邮箱填充表单
   */
  console.log('user111', user);
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.username,
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user, form]);

  /**
   * 处理表单提交
   * 将表单数据发送到服务器并处理响应
   * 
   * @param {any} values - 表单提交的值
   */
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // 确保使用用户登录信息
      const name = user?.username || values.name;
      const phone = user?.phone || values.phone;
      const email = user?.email || values.email;
      
      // 构造预约数据，兼容新的数据结构，同时提供扁平结构和timeSlot结构
      const formattedData = {
        customer: {
          name,
          phone,
          email,
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

      // 发送预约请求到服务器
      const response = await fetch('/api/appointments/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      // 解析服务器响应
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // 预约成功处理
      message.success('预约成功！我们会尽快与您联系确认。');
      form.resetFields();
      // 预约成功后跳转到成功页面
      router.push('/appointment-success');
      // 如果提供了成功回调，则调用
      onSuccess?.();
    } catch (error: any) {
      // 显示错误消息
      message.error(error.message || '预约失败，请稍后重试');
    } finally {
      // 无论成功或失败，都结束加载状态
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
      {/* 姓名字段 */}
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入您的姓名' }]}
      >
        <Input placeholder="请输入姓名" disabled={!!user} />
      </Form.Item>

      {/* 联系电话字段 */}
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

      {/* 电子邮箱字段 */}
      <Form.Item
        name="email"
        label="电子邮箱"
        rules={[
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input placeholder="请输入电子邮箱" disabled={true} />
      </Form.Item>

      {/* 车辆品牌字段 */}
      <Form.Item
        name="vehicleBrand"
        label="车辆品牌"
        rules={[{ required: true, message: '请输入车辆品牌' }]}
      >
        <Input placeholder="请输入车辆品牌" />
      </Form.Item>

      {/* 车型字段 */}
      <Form.Item
        name="vehicleModel"
        label="车型"
        rules={[{ required: true, message: '请输入车型' }]}
      >
        <Input placeholder="请输入车型" />
      </Form.Item>

      {/* 车牌号字段 */}
      <Form.Item
        name="licensePlate"
        label="车牌号"
        rules={[{ required: true, message: '请输入车牌号' }]}
      >
        <Input placeholder="请输入车牌号" />
      </Form.Item>

      {/* 服务类型字段 */}
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

      {/* 问题描述字段 */}
      <Form.Item
        name="description"
        label="问题描述"
        rules={[{ required: true, message: '请描述您的车辆问题' }]}
      >
        <TextArea
          rows={4}
          placeholder="请详细描述您的车辆问题或需要的服务"
        />
      </Form.Item>

      {/* 预约日期字段 */}
      <Form.Item
        name="date"
        label="预约日期"
        rules={[{ required: true, message: '请选择预约日期' }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择日期"
        />
      </Form.Item>

      {/* 预约时间字段 */}
      <Form.Item
        name="time"
        label="预约时间"
        rules={[{ required: true, message: '请选择预约时间' }]}
      >
        <TimePicker
          style={{ width: '100%' }}
          format="HH:mm"
          minuteStep={30}
          placeholder="请选择时间"
        />
      </Form.Item>

      {/* 技师选择字段 */}
      <Form.Item
        name="technician"
        label="指定技师（可选）"
      >
        <Select placeholder="请选择技师（可选）" allowClear>
          {technicians.map(tech => (
            <Option key={tech._id} value={tech._id}>
              {tech.username} - {tech.specialties?.join(', ')}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* 提交按钮 */}
      <Form.Item>
        <motion.div
          className="flex justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md w-full transition-all duration-300 disabled:bg-gray-400"
          >
            {loading ? '提交中...' : '提交预约'}
          </button>
        </motion.div>
      </Form.Item>
    </Form>
  );
} 