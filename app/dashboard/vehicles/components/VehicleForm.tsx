'use client';

import { Form, Input, InputNumber, Select, Button } from 'antd';
import type { Vehicle, VehicleFormData } from '../types';

interface VehicleFormProps {
  initialValues?: Partial<Vehicle>;
  onFinish: (values: VehicleFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function VehicleForm({
  initialValues,
  onFinish,
  onCancel,
  loading = false,
}: VehicleFormProps) {
  const [form] = Form.useForm<VehicleFormData>();

  const handleFinish = (values: VehicleFormData) => {
    // 确保所有必填字段都存在
    const formData: VehicleFormData = {
      brand: values.brand,
      model: values.model,
      year: values.year,
      licensePlate: values.licensePlate,
      vin: values.vin,
      mileage: values.mileage,
      status: values.status,
      ownerName: values.ownerName,
      ownerPhone: values.ownerPhone,
    };
    console.log('表单数据:', formData); // 添加日志
    onFinish(formData);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      className="admin-form fade-in"
    >
      <div className="slide-up" style={{ animationDelay: '0.1s' }}>
        <Form.Item
          name="brand"
          label="品牌"
          rules={[{ required: true, message: '请输入车辆品牌' }]}
        >
          <Input placeholder="请输入车辆品牌" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.15s' }}>
        <Form.Item
          name="model"
          label="型号"
          rules={[{ required: true, message: '请输入车辆型号' }]}
        >
          <Input placeholder="请输入车辆型号" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.2s' }}>
        <Form.Item
          name="year"
          label="年份"
          rules={[
            { required: true, message: '请输入车辆年份' },
            {
              type: 'number',
              min: 1900,
              max: new Date().getFullYear() + 1,
              message: '请输入有效的年份',
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入车辆年份"
            min={1900}
            max={new Date().getFullYear() + 1}
            className="hover-glow"
          />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.25s' }}>
        <Form.Item
          name="licensePlate"
          label="车牌号"
          rules={[
            { required: true, message: '请输入车牌号' },
            {
              pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/,
              message: '请输入正确格式的车牌号（例：豫B12345）',
            },
          ]}
        >
          <Input placeholder="请输入车牌号（例：豫B12345）" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.3s' }}>
        <Form.Item
          name="vin"
          label="车架号"
          rules={[
            { required: true, message: '请输入车架号' },
            {
              pattern: /^[0-9A-Z]{17}$/,
              message: '请输入正确格式的17位车架号',
            },
          ]}
        >
          <Input placeholder="请输入17位车架号" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.35s' }}>
        <Form.Item
          name="mileage"
          label="里程数"
          rules={[
            { required: true, message: '请输入里程数' },
            {
              type: 'number',
              min: 0,
              message: '里程数不能为负数',
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入里程数"
            min={0}
            addonAfter="km"
            className="hover-glow"
          />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.4s' }}>
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择车辆状态' }]}
        >
          <Select
            placeholder="请选择车辆状态"
            options={[
              { label: '正常', value: 'active' },
              { label: '保养中', value: 'maintenance' },
              { label: '停用', value: 'inactive' },
            ]}
            className="hover-glow"
          />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.45s' }}>
        <Form.Item
          name="ownerName"
          label="车主姓名"
          rules={[{ required: true, message: '请输入车主姓名' }]}
        >
          <Input placeholder="请输入车主姓名" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.5s' }}>
        <Form.Item
          name="ownerPhone"
          label="联系方式"
          rules={[
            { required: true, message: '请输入联系方式' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
          ]}
        >
          <Input placeholder="请输入联系方式" className="hover-glow" />
        </Form.Item>
      </div>

      <div className="slide-up" style={{ animationDelay: '0.55s' }}>
        <Form.Item className="mb-0 flex justify-end">
          <Button className="mr-2 hover-glow" onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} className="admin-btn admin-btn-primary hover-glow">
            确定
          </Button>
        </Form.Item>
      </div>
    </Form>
  );
} 