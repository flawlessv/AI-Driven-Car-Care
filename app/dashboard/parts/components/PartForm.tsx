'use client';

import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import type { Part, PartFormData } from '../types';

// 预设的分类选项
const DEFAULT_CATEGORIES = [
  '发动机部件',
  '传动系统',
  '制动系统',
  '转向系统',
  '悬挂系统',
  '电气系统',
  '滤清器',
  '轮胎',
  '照明系统',
  '空调系统',
  '油品',
  '其他'
];

// 预设的制造商选项
const DEFAULT_MANUFACTURERS = [
  '博世（Bosch）',
  '德尔福（Delphi）',
  '马勒（MAHLE）',
  '法雷奥（Valeo）',
  '盖茨（Gates）',
  '天合（TRW）',
  '康迪泰克（ContiTech）',
  '李尔（Lear）',
  '电装（DENSO）',
  '其他'
];

interface PartFormProps {
  initialValues?: Part;
  onFinish: (values: PartFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  categories?: string[];
  manufacturers?: string[];
}

export default function PartForm({
  initialValues,
  onFinish,
  onCancel,
  loading = false,
  categories = [],
  manufacturers = [],
}: PartFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 合并预设选项和已有选项
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
  const allManufacturers = Array.from(new Set([...DEFAULT_MANUFACTURERS, ...manufacturers]));

  const handleSubmit = (values: any) => {
    // 确保 category 和 manufacturer 是字符串
    const formattedValues = {
      ...values,
      category: Array.isArray(values.category) ? values.category[0] : values.category,
      manufacturer: Array.isArray(values.manufacturer) ? values.manufacturer[0] : values.manufacturer,
    };
    onFinish(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="name"
        label="配件名称"
        rules={[{ required: true, message: '请输入配件名称' }]}
      >
        <Input placeholder="请输入配件名称" />
      </Form.Item>

      <Form.Item
        name="code"
        label="配件编号"
        rules={[{ required: true, message: '请输入配件编号' }]}
      >
        <Input placeholder="请输入配件编号" />
      </Form.Item>

      <Form.Item
        name="description"
        label="描述"
      >
        <Input.TextArea rows={4} placeholder="请输入配件描述" />
      </Form.Item>

      <Form.Item
        name="category"
        label="分类"
      >
        <Select
          placeholder="请选择或输入分类"
          options={allCategories.map(category => ({
            label: category,
            value: category,
          }))}
          allowClear
          showSearch
          mode="tags"
          maxTagCount={1}
        />
      </Form.Item>

      <Form.Item
        name="manufacturer"
        label="制造商"
      >
        <Select
          placeholder="请选择或输入制造商"
          options={allManufacturers.map(manufacturer => ({
            label: manufacturer,
            value: manufacturer,
          }))}
          allowClear
          showSearch
          mode="tags"
          maxTagCount={1}
        />
      </Form.Item>

      <Form.Item
        name="price"
        label="价格"
        rules={[{ required: true, message: '请输入价格' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          precision={2}
          placeholder="请输入价格"
          addonAfter="元"
        />
      </Form.Item>

      <Form.Item
        name="stock"
        label="库存"
        rules={[{ required: true, message: '请输入库存' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          placeholder="请输入库存"
        />
      </Form.Item>

      <Form.Item
        name="minStock"
        label="最小库存"
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          placeholder="请输入最小库存"
        />
      </Form.Item>

      <Form.Item
        name="unit"
        label="单位"
      >
        <Input placeholder="请输入单位" />
      </Form.Item>

      <Form.Item
        name="location"
        label="库位"
      >
        <Input placeholder="请输入库位" />
      </Form.Item>

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