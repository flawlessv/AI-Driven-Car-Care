'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { WorkOrder } from '@/types/workOrder';

const { TextArea } = Input;
const { Option } = Select;

interface MaintenanceFormProps {
  workOrderId: string | string[];
  workOrder: WorkOrder;
  onSuccess?: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ 
  workOrderId, 
  workOrder,
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 确保workOrderId是字符串
  const id = Array.isArray(workOrderId) ? workOrderId[0] : workOrderId;

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/work-orders/${id}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          workOrder: id
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        message.success('维修记录添加成功');
        form.resetFields();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        message.error(result.message || '维修记录添加失败');
      }
    } catch (error) {
      console.error('添加维修记录失败:', error);
      message.error('维修记录添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        maintenanceType: '维修',
        vehicle: workOrder?.vehicle?._id || ''
      }}
    >
      <Form.Item
        name="description"
        label="维修内容"
        rules={[{ required: true, message: '请输入维修内容' }]}
      >
        <TextArea rows={3} placeholder="详细描述您执行的维修工作..." />
      </Form.Item>

      <Form.Item
        name="maintenanceType"
        label="维修类型"
        rules={[{ required: true, message: '请选择维修类型' }]}
      >
        <Select placeholder="选择维修类型">
          <Option value="维修">维修</Option>
          <Option value="保养">保养</Option>
          <Option value="检查">检查</Option>
          <Option value="更换零件">更换零件</Option>
          <Option value="其他">其他</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="hoursSpent"
        label="花费时间(小时)"
        rules={[{ required: true, message: '请输入花费的时间' }]}
      >
        <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="partsUsed"
        label="使用的零件"
      >
        <TextArea rows={2} placeholder="列出使用的零件(可选)..." />
      </Form.Item>

      <Form.Item
        name="technicianNotes"
        label="技师备注"
      >
        <TextArea rows={2} placeholder="添加任何其他备注信息(可选)..." />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={submitting}
          icon={<PlusOutlined />}
        >
          添加维修记录
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MaintenanceForm; 