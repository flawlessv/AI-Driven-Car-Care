'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Row,
  Col,
  Tooltip,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { Part } from '@/types/part';

const { TextArea } = Input;

export default function PartsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Part[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState<{
    categories: string[];
    manufacturers: string[];
  }>({
    categories: [],
    manufacturers: []
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchParts();
  }, [pagination.current]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parts?page=${pagination.current}&limit=${pagination.pageSize}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取配件列表失败');
      }

      // 处理嵌套的data结构
      const partsData = result.data?.data || [];
      console.log('Parts data:', partsData);
      
      setData(partsData);
      setPagination(prev => ({
        ...prev,
        total: result.data.total || 0
      }));
      
      // 设置过滤选项
      if (result.data.filters) {
        setFilters(result.data.filters);
      }
    } catch (error: any) {
      console.error('获取配件列表失败:', error);
      message.error(error.message || '获取配件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Part> = [
    {
      title: '配件编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          {name}
          {record.stock <= record.minStock && (
            <Tooltip title="库存不足">
              <WarningOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryMap: { [key: string]: { color: string; text: string } } = {
          engine: { color: 'blue', text: '发动机' },
          transmission: { color: 'purple', text: '变速箱' },
          brake: { color: 'red', text: '制动系统' },
          electrical: { color: 'cyan', text: '电气系统' },
          body: { color: 'orange', text: '车身部件' },
        };
        const currentCategory = categoryMap[category] || { color: 'default', text: category };
        return <Tag color={currentCategory.color}>{currentCategory.text}</Tag>;
      },
    },
    {
      title: '品牌',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record) => (
        <Badge
          count={stock}
          showZero
          color={stock <= record.minStock ? '#faad14' : '#52c41a'}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          in_stock: { color: 'green', text: '有库存' },
          low_stock: { color: 'orange', text: '库存不足' },
          out_of_stock: { color: 'red', text: '无库存' },
          discontinued: { color: 'default', text: '已停产' }
        };
        const currentStatus = statusMap[status as keyof typeof statusMap] || { color: 'default', text: '未知' };
        return <Tag color={currentStatus.color}>{currentStatus.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: Part) => {
    setEditingPart(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (record: Part) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个配件吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/parts/${record._id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.message || '删除配件失败');
          }

          message.success('删除成功');
          fetchParts();
        } catch (error: any) {
          message.error(error.message || '删除配件失败');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingPart
        ? `/api/parts/${editingPart._id}`
        : '/api/parts';
      const method = editingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '操作失败');
      }

      message.success('操作成功');
      setModalVisible(false);
      form.resetFields();
      fetchParts();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  return (
    <div className="p-6">
      <Card
        title="配件库存"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPart(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            添加配件
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingPart ? '编辑配件' : '添加配件'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="配件编号"
            rules={[{ required: true, message: '请输入配件编号' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="配件名称"
            rules={[{ required: true, message: '请输入配件名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select>
              <Select.Option value="engine">发动机</Select.Option>
              <Select.Option value="transmission">变速箱</Select.Option>
              <Select.Option value="brake">制动系统</Select.Option>
              <Select.Option value="electrical">电气系统</Select.Option>
              <Select.Option value="body">车身部件</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="manufacturer"
            label="品牌"
            rules={[{ required: true, message: '请输入品牌' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="stock"
            label="库存数量"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="minStock"
            label="最低库存"
            rules={[{ required: true, message: '请输入最低库存' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="price"
            label="单价"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix="¥"
              className="w-full"
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Select.Option value="active">正常</Select.Option>
              <Select.Option value="discontinued">停产</Select.Option>
              <Select.Option value="outOfStock">缺货</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 