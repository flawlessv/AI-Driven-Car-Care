/**
 * 工单表单组件
 * 
 * 这个组件用于创建和编辑工单信息，包含表单验证和提交功能
 * 不同于其他表单组件，这个组件接收外部传入的Form实例，以便在父组件中控制表单行为
 */
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

/**
 * 工单表单组件的属性接口
 * 
 * @property {FormInstance} form - Ant Design表单实例，由父组件控制
 * @property {Vehicle[]} vehicles - 可选的车辆列表
 * @property {WorkOrder} initialValues - 可选的初始工单数据，用于编辑模式
 * @property {'create' | 'edit'} mode - 表单模式：创建或编辑
 * @property {Function} onFinish - 表单提交成功的回调函数
 * @property {Function} onCancel - 取消操作的回调函数
 * @property {boolean} showButtons - 是否显示表单按钮
 */
interface WorkOrderFormProps {
  form: FormInstance;
  vehicles: Vehicle[];
  initialValues?: WorkOrder;
  mode?: 'create' | 'edit';
  onFinish?: (values: any) => void;
  onCancel?: () => void;
  showButtons?: boolean;
}

/**
 * 优先级选项
 * 提供工单优先级的下拉选项
 */
const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

/**
 * 工单类型选项
 * 提供工单类型的下拉选项
 */
const typeOptions = [
  { label: '常规保养', value: 'maintenance' },
  { label: '故障维修', value: 'repair' },
  { label: '车辆检查', value: 'inspection' },
];

/**
 * 工单表单组件
 * 用于创建新工单或编辑现有工单信息
 * 
 * @param {WorkOrderFormProps} props - 组件属性
 * @returns {JSX.Element} 返回表单组件
 */
export default function WorkOrderForm({
  form,
  vehicles,
  initialValues,
  mode = 'create',
  onFinish,
  onCancel,
  showButtons = true,
}: WorkOrderFormProps) {
  console.log('WorkOrderForm props:', { vehicles, initialValues }); // 添加日志
  
  /**
   * 处理表单提交
   * 验证表单并调用父组件的回调函数
   */
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
        priority: 'medium',  // 默认优先级为"中"
        vehicle: initialValues?.vehicle, // 确保这里设置了vehicle
        ...initialValues,
        // 转换日期字符串为dayjs对象，用于DatePicker组件
        startDate: initialValues?.startDate ? dayjs(initialValues.startDate) : undefined,
        completionDate: initialValues?.completionDate ? dayjs(initialValues.completionDate) : undefined,
      }}
      onFinish={onFinish}
    >
      {/* 车辆选择字段 */}
      <Form.Item
        name="vehicle"
        label="车辆"
        rules={[{ required: true, message: '请选择车辆' }]}
      >
        <Select
          placeholder="请选择车辆"
          disabled={mode === 'edit'} // 编辑模式下不允许修改车辆
        >
          {vehicles?.map(vehicle => (
            <Select.Option key={vehicle._id} value={vehicle._id}>
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 维修类型字段 */}
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

      {/* 问题描述字段 */}
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

      {/* 优先级字段 */}
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

      {/* 预计工时字段 */}
      <Form.Item
        name="estimatedHours"
        label="预计工时"
        rules={[{ type: 'number', min: 0, message: '预计工时不能小于0' }]}
      >
        <InputNumber
          min={0}
          step={0.5} // 允许半小时为单位
          style={{ width: '100%' }}
          placeholder="请输入预计工时"
          addonAfter="小时"
        />
      </Form.Item>

      {/* 期望开始日期字段 */}
      <Form.Item
        name="startDate"
        label="期望开始日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择期望开始日期"
        />
      </Form.Item>

      {/* 完成日期字段 */}
      <Form.Item
        name="completionDate"
        label="完成日期"
      >
        <DatePicker
          style={{ width: '100%' }}
          placeholder="请选择完成日期"
        />
      </Form.Item>

      {/* 客户备注字段 */}
      <Form.Item
        name="customerNotes"
        label="客户备注"
      >
        <TextArea
          rows={3}
          placeholder="请输入其他需要说明的事项"
        />
      </Form.Item>

      {/* 仅在编辑模式下显示的字段 */}
      {mode === 'edit' && (
        <>
          {/* 故障诊断字段 */}
          <Form.Item
            name="diagnosis"
            label="故障诊断"
          >
            <TextArea
              rows={3}
              placeholder="请输入故障诊断结果"
            />
          </Form.Item>

          {/* 解决方案字段 */}
          <Form.Item
            name="solution"
            label="解决方案"
          >
            <TextArea
              rows={3}
              placeholder="请输入解决方案"
            />
          </Form.Item>

          {/* 实际工时字段 */}
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

          {/* 费用字段 */}
          <Form.Item
            name="cost"
            label="费用"
            rules={[{ type: 'number', min: 0, message: '费用不能小于0' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入费用"
              addonAfter="元"
              precision={2} // 金额精确到分
            />
          </Form.Item>

          {/* 技师备注字段 */}
          <Form.Item
            name="technicianNotes"
            label="技师备注"
          >
            <TextArea
              rows={3}
              placeholder="请输入技师备注"
            />
          </Form.Item>
        </>
      )}

      {/* 表单按钮 */}
      {showButtons && (
        <Form.Item className="mt-4 mb-0 flex justify-end">
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button type="primary" onClick={handleFinish}>
              {mode === 'create' ? '创建工单' : '更新工单'}
            </Button>
          </Space>
        </Form.Item>
      )}
    </Form>
  );
} 