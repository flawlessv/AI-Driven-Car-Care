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
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  WarningOutlined,
  SyncOutlined,
  SearchOutlined,
  AppstoreOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { Part } from '@/types/part';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import PermissionChecker from '@/app/components/PermissionChecker';

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
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    categories: 0
  });

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
      
      // 设置统计数据
      setStats({
        total: partsData.length,
        lowStock: partsData.filter((part: Part) => part.stock <= part.minStock && part.stock > 0).length,
        outOfStock: partsData.filter((part: Part) => part.stock === 0).length,
        categories: new Set(partsData.map((part: Part) => part.category)).size
      });
    } catch (error: any) {
      console.error('获取配件列表失败:', error);
      message.error(error.message || '获取配件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 优化状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusMap = {
      in_stock: { className: 'status-badge status-badge-completed', text: '有库存' },
      low_stock: { className: 'status-badge status-badge-pending', text: '库存不足' },
      out_of_stock: { className: 'status-badge status-badge-cancelled', text: '无库存' },
      discontinued: { className: 'status-badge status-badge-cancelled', text: '已停产' }
    };
    const currentStatus = statusMap[status as keyof typeof statusMap] || { className: 'status-badge', text: '未知' };
    
    return <span className={currentStatus.className}>{currentStatus.text}</span>;
  };

  const columns: ColumnsType<Part> = [
    {
      title: '配件编号',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <span className="font-medium">{code}</span>,
    },
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div className="flex items-center">
          <AppstoreOutlined className="mr-2 text-blue-500" />
          <div>
            <div className="font-medium">{name}</div>
            {record.stock <= record.minStock && (
              <div className="flex items-center text-xs text-amber-500">
                <WarningOutlined className="mr-1" />
                <span>库存不足</span>
              </div>
            )}
          </div>
        </div>
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
        return (
          <Tag color={currentCategory.color} className="px-2 py-1">
            <span className="flex items-center">
              <ToolOutlined className="mr-1" />
              {currentCategory.text}
            </span>
          </Tag>
        );
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
          style={{ backgroundColor: stock <= record.minStock ? '#faad14' : '#52c41a' }}
          className="px-2 py-1"
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span className="font-medium">¥{price.toLocaleString()}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <PermissionChecker
            menuKey="parts"
            requiredPermission="write"
            buttonProps={{
              type: "text",
              icon: <EditOutlined />,
              onClick: () => handleEdit(record),
              className: "text-blue-500 hover:text-blue-600"
            }}
            noPermissionTip="您没有编辑配件的权限"
          >
            编辑
          </PermissionChecker>
          
          <PermissionChecker
            menuKey="parts"
            requiredPermission="manage"
            buttonProps={{
              type: "text",
              danger: true,
              icon: <DeleteOutlined />,
              onClick: () => handleDelete(record)
            }}
            noPermissionTip="您没有删除配件的权限"
          >
            删除
          </PermissionChecker>
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
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
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
    <div className="page-transition">
      <div className="page-title">
        <h1>配件库存</h1>
        <div className="description">管理汽车零部件的库存和信息</div>
      </div>
      
      <Row gutter={[16, 16]} className="mb-6 fade-in" style={{animationDelay: '0.1s'}}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">配件总数</div>}
                value={stats.total}
                prefix={<AppstoreOutlined className="text-blue-500 mr-1" />}
                valueStyle={{ color: '#1890ff', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">库存不足</div>}
                value={stats.lowStock}
                prefix={<WarningOutlined className="text-amber-500 mr-1" />}
                valueStyle={{ color: '#faad14', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">无库存</div>}
                value={stats.outOfStock}
                prefix={<ExclamationCircleOutlined className="text-red-500 mr-1" />}
                valueStyle={{ color: '#ff4d4f', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card-wrapper">
            <Card className="dashboard-card" bordered={false}>
              <Statistic
                title={<div className="font-medium text-gray-600">配件分类</div>}
                value={stats.categories}
                prefix={<BarChartOutlined className="text-green-500 mr-1" />}
                valueStyle={{ color: '#52c41a', fontWeight: 500 }}
              />
            </Card>
          </div>
        </Col>
      </Row>
      
      <Card className="dashboard-card fade-in mb-6" style={{animationDelay: '0.2s'}}>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <Select 
              style={{ width: 200 }}
              placeholder="选择配件类别"
              allowClear
              options={filters.categories.map(category => ({
                label: category,
                value: category
              }))}
              className="hover-glow"
            />
            <Select 
              style={{ width: 200 }}
              placeholder="选择制造商"
              allowClear
              options={filters.manufacturers.map(manufacturer => ({
                label: manufacturer,
                value: manufacturer
              }))}
              className="hover-glow"
            />
          </div>
          
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={fetchParts}
              className="admin-btn hover-glow"
            >
              刷新数据
            </Button>
            <PermissionChecker
              menuKey="parts"
              requiredPermission="write"
              buttonProps={{
                type: "primary",
                icon: <PlusOutlined />,
                onClick: () => {
                  setEditingPart(null);
                  form.resetFields();
                  setModalVisible(true);
                },
                className: "admin-btn admin-btn-primary hover-glow"
              }}
              noPermissionTip="您没有添加配件的权限"
            >
              添加配件
            </PermissionChecker>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showQuickJumper: true,
            showSizeChanger: true,
            onChange: (page) => {
              setPagination(prev => ({ ...prev, current: page }));
            }
          }}
          className="dashboard-table"
          rowClassName={(record, index) => (index % 2 === 0 ? 'bg-gray-50' : '')}
        />
      </Card>
      
      <Modal
        title={editingPart ? '编辑配件' : '添加配件'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="enhanced-modal"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'in_stock',
            minStock: 5
          }}
          className="admin-form mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="配件编号"
                rules={[{ required: true, message: '请输入配件编号' }]}
              >
                <Input placeholder="输入配件编号" className="hover-glow" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="配件名称"
                rules={[{ required: true, message: '请输入配件名称' }]}
              >
                <Input placeholder="输入配件名称" className="hover-glow" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="配件类别"
                rules={[{ required: true, message: '请选择配件类别' }]}
              >
                <Select placeholder="选择配件类别" className="hover-glow">
                  <Select.Option value="engine">发动机</Select.Option>
                  <Select.Option value="transmission">变速箱</Select.Option>
                  <Select.Option value="brake">制动系统</Select.Option>
                  <Select.Option value="electrical">电气系统</Select.Option>
                  <Select.Option value="body">车身部件</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="制造商"
                rules={[{ required: true, message: '请输入制造商' }]}
              >
                <Input placeholder="输入制造商" className="hover-glow" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  addonBefore="¥"
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="库存数量"
                rules={[{ required: true, message: '请输入库存数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minStock"
                label="最低库存"
                tooltip="当库存低于此数量时会给出警告"
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="配件描述"
          >
            <TextArea rows={4} placeholder="输入配件的详细描述" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择配件状态">
              <Select.Option value="in_stock">有库存</Select.Option>
              <Select.Option value="low_stock">库存不足</Select.Option>
              <Select.Option value="out_of_stock">无库存</Select.Option>
              <Select.Option value="discontinued">已停产</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="admin-btn admin-btn-primary"
            >
              {editingPart ? '更新' : '保存'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
} 