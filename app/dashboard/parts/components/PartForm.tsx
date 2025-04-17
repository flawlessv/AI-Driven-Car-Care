'use client';  // 这表示这个组件在浏览器端（客户端）运行，而不是在服务器端

/**
 * 配件表单组件
 * 
 * 这个组件用于添加新配件或编辑现有配件的信息
 * 表单包含配件的各种属性，如名称、编号、价格、库存等
 * 所有字段都有中文标签和提示信息，方便用户填写
 */

import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space } from 'antd';
import type { Part, PartFormData } from '../types';

// 预设的分类选项，这些是常见的汽车配件分类
// 用户可以直接从这个列表中选择，或者输入新的分类
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

// 预设的制造商选项，这些是常见的汽车配件制造商
// 用户可以直接从这个列表中选择，或者输入新的制造商
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

/**
 * 配件表单组件的属性定义
 * 
 * @param initialValues - 初始值，用于编辑现有配件时传入该配件的信息
 * @param onFinish - 表单提交成功后的回调函数，会将表单数据传给这个函数处理
 * @param onCancel - 点击取消按钮时的回调函数
 * @param loading - 是否显示加载状态（提交按钮显示转圈效果）
 * @param categories - 可选的额外分类选项，会与默认选项合并
 * @param manufacturers - 可选的额外制造商选项，会与默认选项合并
 */
interface PartFormProps {
  initialValues?: Part;              // 可选的初始值，用于编辑模式
  onFinish: (values: PartFormData) => void; // 表单提交完成时的回调函数
  onCancel: () => void;             // 取消按钮点击时的回调函数
  loading?: boolean;                // 是否处于加载状态
  categories?: string[];            // 额外的分类选项
  manufacturers?: string[];         // 额外的制造商选项
}

/**
 * 配件表单组件
 * 用于新增或编辑配件信息
 */
export default function PartForm({
  initialValues,
  onFinish,
  onCancel,
  loading = false,
  categories = [],
  manufacturers = [],
}: PartFormProps) {
  // 创建表单实例，用于控制表单的行为
  const [form] = Form.useForm();

  // 当组件加载时或初始值变化时，自动填充表单
  useEffect(() => {
    // 如果有初始值（编辑模式），自动填充表单字段
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 合并预设选项和已有选项，并去除重复项
  // 这样用户可以看到系统预设的选项和其他人添加过的选项
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
  const allManufacturers = Array.from(new Set([...DEFAULT_MANUFACTURERS, ...manufacturers]));

  /**
   * 处理表单提交
   * 如果分类或制造商是数组形式，只取第一个值（因为tag模式可能会返回数组）
   */
  const handleSubmit = (values: any) => {
    // 确保 category 和 manufacturer 是字符串而不是数组
    // 因为Select组件的tags模式可能会返回数组
    const formattedValues = {
      ...values,
      category: Array.isArray(values.category) ? values.category[0] : values.category,
      manufacturer: Array.isArray(values.manufacturer) ? values.manufacturer[0] : values.manufacturer,
    };
    // 将格式化后的值传给外部处理函数
    onFinish(formattedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"         // 表单布局采用垂直方式，标签在上，表单控件在下
      onFinish={handleSubmit}   // 表单提交时的处理函数
      initialValues={initialValues} // 初始值
    >
      {/* 配件名称输入框 */}
      <Form.Item
        name="name"
        label="配件名称"
        rules={[{ required: true, message: '请输入配件名称' }]} // 设置验证规则，必填
      >
        <Input placeholder="请输入配件名称" />
      </Form.Item>

      {/* 配件编号输入框 */}
      <Form.Item
        name="code"
        label="配件编号"
        rules={[{ required: true, message: '请输入配件编号' }]} // 设置验证规则，必填
      >
        <Input placeholder="请输入配件编号" />
      </Form.Item>

      {/* 描述文本框，可选填 */}
      <Form.Item
        name="description"
        label="描述"
      >
        <Input.TextArea rows={4} placeholder="请输入配件描述" />
      </Form.Item>

      {/* 分类选择器，用户可以选择预设选项或输入新的分类 */}
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
          allowClear           // 允许清除选择
          showSearch           // 允许搜索选项
          mode="tags"          // 支持自定义输入
          maxTagCount={1}      // 最多显示一个标签
        />
      </Form.Item>

      {/* 制造商选择器，用户可以选择预设选项或输入新的制造商 */}
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
          allowClear           // 允许清除选择
          showSearch           // 允许搜索选项
          mode="tags"          // 支持自定义输入
          maxTagCount={1}      // 最多显示一个标签
        />
      </Form.Item>

      {/* 价格输入框，必填 */}
      <Form.Item
        name="price"
        label="价格"
        rules={[{ required: true, message: '请输入价格' }]} // 设置验证规则，必填
      >
        <InputNumber
          style={{ width: '100%' }} // 设置宽度占满整行
          min={0}                   // 最小值为0
          precision={2}             // 精确到小数点后两位
          placeholder="请输入价格"
          addonAfter="元"           // 输入框后面显示"元"字
        />
      </Form.Item>

      {/* 库存输入框，必填 */}
      <Form.Item
        name="stock"
        label="库存"
        rules={[{ required: true, message: '请输入库存' }]} // 设置验证规则，必填
      >
        <InputNumber
          style={{ width: '100%' }} // 设置宽度占满整行
          min={0}                   // 最小值为0
          placeholder="请输入库存"
        />
      </Form.Item>

      {/* 最小库存输入框，可选填 */}
      <Form.Item
        name="minStock"
        label="最小库存"
      >
        <InputNumber
          style={{ width: '100%' }} // 设置宽度占满整行
          min={0}                   // 最小值为0
          placeholder="请输入最小库存"
        />
      </Form.Item>

      {/* 单位输入框，可选填 */}
      <Form.Item
        name="unit"
        label="单位"
      >
        <Input placeholder="请输入单位" />
      </Form.Item>

      {/* 库位输入框，可选填 */}
      <Form.Item
        name="location"
        label="库位"
      >
        <Input placeholder="请输入库位" />
      </Form.Item>

      {/* 按钮区域，包括取消和提交按钮 */}
      <Form.Item>
        <Space className="w-full justify-end"> {/* 将按钮放在右侧 */}
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
} 