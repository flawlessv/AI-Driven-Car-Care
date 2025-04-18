import React from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { Vehicle } from '@/types/vehicle';
import type { WorkOrder, WorkOrderPriority } from '@/types/workOrder';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface WorkOrderFormProps {
  form: FormInstance;
  vehicles: Vehicle[];
  initialValues?: WorkOrder;
  mode?: 'create' | 'edit';
  onFinish?: (values: any) => void;
  onCancel?: () => void;
}

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const typeOptions = [
  { label: '常规保养', value: 'regular' },
  { label: '故障维修', value: 'repair' },
  { label: '事故维修', value: 'accident' },
  { label: '其他', value: 'other' },
];

export default function WorkOrderForm({
  form,
  vehicles,
  initialValues,
  mode = 'create',
  onFinish,
  onCancel,
}: WorkOrderFormProps) {
  console.log('WorkOrderForm props:', { vehicles, initialValues }); // 添加日志
  
  const handleFinish = () => {
    form.validateFields()
      .then(values => {
        if (onFinish) {
          onFinish(values);
        }
      })
      .catch(info => {
        console.log('表单验证失败:', info);
      });
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        priority: 'medium',
        vehicle: initialValues?.vehicle, // 确保这里设置了vehicle
        ...initialValues,
        startDate: initialValues?.startDate ? dayjs(initialValues.startDate) : undefined,
        completionDate: initialValues?.completionDate ? dayjs(initialValues.completionDate) : undefined,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="vehicle"
        label="车辆"
        rules={[{ required: true, message: '请选择车辆' }]}
      >
        <Select
          placeholder="请选择车辆"
          disabled={mode === 'edit'}
        >
          {vehicles?.map(vehicle => (
            <Select.Option key={vehicle._id} value={vehicle._id}>
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="type"
        label="维修类型"
        rules={[{ required: true, message: '请选择维修类型' }]}
      >
        <Select
          placeholder="请选择维修类型"
          options={typeOptions}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="问题描述"
        rules={[{ required: true, message: '请输入问题描述' }]}
      >
        <TextArea
          rows={4}
          placeholder="请详细描述车辆问题"
        />
      </Form.Item>

      <Form.Item
        name="priority"
        label="优先级"
        rules={[{ required: true, message: '请选择优先级' }]}
      >
        <Select
          placeholder="请选择优先级"
          options={priorityOptions}
        />
      </Form.Item>

      <Form.Item
        name="estimatedHours"
        label="预计工时"
        rules={[{ type: 'number', min: 0, message: '预计工时不能小于0' }]}
      >
        <InputNumber
          min={0}
          step={0.5}
          style={{ width: '100%' }}
          placeholder="请输入预计工时"
          addonAfter="小时"
        />
      </Form.Item>

      <Form.Item
        name="startDate"
        label="期望开始日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择期望开始日期"
        />
      </Form.Item>

      <Form.Item
        name="completionDate"
        label="完成日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择完成日期"
        />
      </Form.Item>

      <Form.Item
        name="customerNotes"
        label="客户备注"
      >
        <TextArea
          rows={3}
          placeholder="请输入其他需要说明的事项"
        />
      </Form.Item>

      {mode === 'edit' && (
        <>
          <Form.Item
            name="diagnosis"
            label="故障诊断"
          >
            <TextArea
              rows={3}
              placeholder="请输入故障诊断结果"
            />
          </Form.Item>

          <Form.Item
            name="solution"
            label="解决方案"
          >
            <TextArea
              rows={3}
              placeholder="请输入解决方案"
            />
          </Form.Item>

          <Form.Item
            name="actualHours"
            label="实际工时"
            rules={[{ type: 'number', min: 0, message: '实际工时不能小于0' }]}
          >
            <InputNumber
              min={0}
              step={0.5}
              style={{ width: '100%' }}
              placeholder="请输入实际工时"
              addonAfter="小时"
            />
          </Form.Item>

          <Form.Item
            name="technicianNotes"
            label="技师备注"
          >
            <TextArea
              rows={3}
              placeholder="请输入维修过程中的注意事项"
            />
          </Form.Item>
        </>
      )}
      
      {/* 添加表单底部的按钮组 */}
      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleFinish} className="admin-btn admin-btn-primary">
            提交
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
} 