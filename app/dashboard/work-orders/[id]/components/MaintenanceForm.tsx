import React from 'react';
import { Form, Input, Button, message, InputNumber } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';

const { TextArea } = Input;

interface MaintenanceFormProps {
  workOrderId: string;
  workOrder: any;
  onSuccess?: () => void;
}

export default function MaintenanceForm({ workOrderId, workOrder, onSuccess }: MaintenanceFormProps) {
  const [form] = Form.useForm();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSubmit = async (values: any) => {
    try {
      // 直接提交表单数据，让后端处理总价计算
      const requestData = {
        description: values.description,
        mileage: values.mileage,
        cost: values.cost,
        notes: values.notes,
        workOrder: workOrderId,
        vehicle: workOrder.vehicle._id,
        technician: user._id,
        type: 'repair',
        status: 'completed',
        startDate: new Date().toISOString(),
        parts: [{
          part: "6795b034c3265f20497d6636",
          quantity: 1,
          unitPrice: 3
        }]
      };

      console.log('提交的数据:', requestData);

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      console.log('API响应:', result);
      
      if (!response.ok) {
        throw new Error(result.message || '提交失败');
      }

      message.success('维修记录添加成功');
      form.resetFields();
      onSuccess?.();
      
    } catch (error: any) {
      console.error('提交维修记录失败:', error);
      message.error(error.message || '提交失败，请重试');
    }
  };

  if (user?.role !== 'technician') {
    return null;
  }

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        name="description"
        label="维修描述"
        rules={[{ required: true, message: '请输入维修描述' }]}
      >
        <TextArea rows={4} placeholder="请详细描述维修内容" />
      </Form.Item>
      
      <Form.Item
        name="mileage"
        label="当前里程"
        rules={[{ required: true, message: '请输入当前里程' }]}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="cost"
        label="维修费用"
        rules={[{ required: true, message: '请输入维修费用' }]}
      >
        <InputNumber 
          min={0} 
          style={{ width: '100%' }} 
          placeholder="请输入维修费用"
        />
      </Form.Item>
      
      <Form.Item
        name="notes"
        label="备注"
      >
        <TextArea rows={2} placeholder="可选：添加其他备注信息" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          添加维修记录
        </Button>
      </Form.Item>
    </Form>
  );
} 