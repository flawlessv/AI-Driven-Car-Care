import React from 'react';
import { Form, Select, InputNumber, Switch } from 'antd';
import type { Vehicle } from '@/types/vehicle';
import type { MaintenanceRule, MaintenanceRuleFormData } from '../../types';
import type { FormInstance } from 'antd/es/form';

interface RuleFormProps {
  form: FormInstance;
  vehicles: Vehicle[];
  initialValues?: MaintenanceRule;
}

const typeOptions = [
  { label: '里程提醒', value: 'mileage' },
  { label: '时间提醒', value: 'time' },
  { label: '两者都有', value: 'both' },
];

export default function RuleForm({ form, vehicles, initialValues }: RuleFormProps) {
  const type = Form.useWatch('type', form);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        enabled: true,
        type: 'both',
        ...initialValues,
      }}
    >
      <Form.Item
        name="vehicle"
        label="车辆"
        rules={[{ required: true, message: '请选择车辆' }]}
      >
        <Select placeholder="请选择车辆">
          {vehicles.map(vehicle => (
            <Select.Option key={vehicle._id} value={vehicle._id}>
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="type"
        label="提醒类型"
        rules={[{ required: true, message: '请选择提醒类型' }]}
      >
        <Select options={typeOptions} />
      </Form.Item>

      {(type === 'mileage' || type === 'both') && (
        <Form.Item
          name="mileageInterval"
          label="里程提醒间隔"
          rules={[{ required: true, message: '请输入里程提醒间隔' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="请输入里程数"
            addonAfter="公里"
          />
        </Form.Item>
      )}

      {(type === 'time' || type === 'both') && (
        <Form.Item
          name="timeInterval"
          label="时间提醒间隔"
          rules={[{ required: true, message: '请输入时间提醒间隔' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="请输入天数"
            addonAfter="天"
          />
        </Form.Item>
      )}

      <Form.Item
        name="enabled"
        label="启用规则"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
} 