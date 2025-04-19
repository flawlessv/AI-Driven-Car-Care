'use client';  // 表示这个组件在浏览器（客户端）运行，而不是在服务器上

/**
 * 配件管理页面
 * 
 * 这个页面用于展示、添加、编辑和删除汽车维修配件信息
 * 包含配件列表、统计信息和操作按钮
 * 用户可以根据不同条件筛选配件，并进行库存管理
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Table,          // 表格组件，用于展示配件列表
  Button,         // 按钮组件
  Space,          // 间距组件，用于组织按钮等元素
  Tag,            // 标签组件，用于显示分类等信息
  message,        // 消息提示组件，用于操作后的反馈
  Modal,          // 对话框组件，用于添加/编辑配件
  Form,           // 表单组件
  Input,          // 输入框组件
  InputNumber,    // 数字输入框组件
  Select,         // 下拉选择组件
  Card,           // 卡片组件，用于展示统计信息
  Row,            // 行组件，用于布局
  Col,            // 列组件，用于布局
  Tooltip,        // 提示组件，鼠标悬停时显示更多信息
  Badge,          // 徽章组件，用于显示数量或状态
  Statistic,      // 统计数值组件
} from 'antd';
import type { ColumnsType } from 'antd/es/table';  // 表格列定义类型
import {
  EditOutlined,           // 编辑图标
  DeleteOutlined,         // 删除图标
  PlusOutlined,           // 添加图标
  WarningOutlined,        // 警告图标
  SyncOutlined,           // 同步/刷新图标
  SearchOutlined,         // 搜索图标
  AppstoreOutlined,       // 应用图标
  InboxOutlined,          // 收件箱图标
  ExclamationCircleOutlined, // 感叹号图标
  ToolOutlined,           // 工具图标
  BarChartOutlined,       // 图表图标
} from '@ant-design/icons';  // 引入各种图标
import { useSelector } from 'react-redux';  // 从全局状态获取数据的工具
import type { RootState } from '@/app/lib/store';  // 全局状态类型
import PermissionChecker from '@/app/components/PermissionChecker';  // 权限检查组件

// 配件类别映射表
const CATEGORY_MAP: { [key: string]: { color: string; text: string } } = {
  engine: { color: 'blue', text: '发动机' },
  transmission: { color: 'purple', text: '变速箱' },
  brake: { color: 'red', text: '制动系统' },
  electrical: { color: 'cyan', text: '电气系统' },
  body: { color: 'orange', text: '车身部件' },
};

// 配件类型定义，替代缺失的../types
interface Part {
  _id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  unit?: string;
  manufacturer?: string;
  location?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  createdAt?: Date;
  updatedAt?: Date;
}

const { TextArea } = Input;  // 获取文本区域组件

/**
 * 配件管理页面组件
 * 整个配件管理模块的主界面
 */
export default function PartsPage() {
  // 定义各种状态变量

  // 页面加载状态，当为true时显示加载中效果
  const [loading, setLoading] = useState(false);
  
  // 配件数据列表，存储从服务器获取的配件信息
  const [data, setData] = useState<Part[]>([]);
  
  // 原始数据，用于筛选功能
  const [originalData, setOriginalData] = useState<Part[]>([]);
  
  // 筛选条件状态
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [manufacturerFilter, setManufacturerFilter] = useState<string | null>(null);
  
  // 分页信息，包含当前页码、每页数量和总记录数
  const [pagination, setPagination] = useState({
    current: 1,       // 当前页码，从1开始
    pageSize: 10,     // 每页显示10条记录
    total: 0          // 总记录数，初始为0
  });
  
  // 过滤器选项，包含可选的分类和制造商列表
  const [filters, setFilters] = useState<{
    categories: string[];
    manufacturers: string[];
  }>({
    categories: [],    // 可选的分类列表
    manufacturers: []  // 可选的制造商列表
  });
  
  // 模态框（弹出窗口）是否可见
  const [modalVisible, setModalVisible] = useState(false);
  
  // 当前正在编辑的配件信息，null表示新增模式
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  
  // 表单实例，用于控制表单的行为
  const [form] = Form.useForm();
  
  // 从全局状态获取当前登录的用户信息
  const user = useSelector((state: RootState) => state.auth.user);
  
  // 统计信息，包含配件总数、库存不足数量等
  const [stats, setStats] = useState({
    total: 0,          // 配件总数
    lowStock: 0,       // 库存不足的配件数量
    outOfStock: 0,     // 无库存的配件数量
    categories: 0      // 分类总数
  });

  // 当组件加载或页码变化时，自动获取配件数据
  useEffect(() => {
    fetchParts();  // 调用获取配件数据的函数
  }, [pagination.current]);  // 当页码变化时重新获取数据

  /**
   * 从服务器获取配件数据的函数
   * 发送请求到后端API，获取配件列表和相关统计信息
   */
  const fetchParts = async () => {
    try {
      // 设置加载状态为true，显示加载效果
      setLoading(true);
      
      // 发送请求到配件API，附带分页参数
      const response = await fetch(`/api/parts?page=${pagination.current}&limit=${pagination.pageSize}`);
      const result = await response.json();  // 将响应转换为JSON对象
      
      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(result.message || '获取配件列表失败');
      }

      // 处理服务器返回的数据
      // 从嵌套的data结构中提取配件数据
      const partsData = result.data?.data || [];
      console.log('Parts data:', partsData);  // 在控制台打印数据，方便调试
      
      // 更新原始数据和显示数据
      setOriginalData(partsData);
      setData(partsData);
      
      // 更新分页信息，保留之前的设置，只更新总记录数
      setPagination(prev => ({
        ...prev,
        total: result.data.total || 0
      }));
      
      // 如果返回了过滤器信息，更新过滤器选项
      if (result.data.filters) {
        setFilters(result.data.filters);
      }
      
      // 计算并更新统计信息
      setStats({
        total: partsData.length,  // 配件总数
        lowStock: partsData.filter((part: Part) => part.stock <= part.minStock && part.stock > 0).length,  // 库存不足数量
        outOfStock: partsData.filter((part: Part) => part.stock === 0).length,  // 无库存数量
        categories: new Set(partsData.map((part: Part) => part.category)).size  // 分类数量（不重复）
      });
    } catch (error: any) {
      // 捕获并处理错误
      console.error('获取配件列表失败:', error);  // 在控制台打印错误信息
      message.error(error.message || '获取配件列表失败');  // 显示错误提示
    } finally {
      // 无论成功还是失败，最后都设置加载状态为false
      setLoading(false);
    }
  };

  /**
   * 应用筛选条件
   * 根据选择的类别和制造商筛选配件列表
   */
  const applyFilters = useCallback(() => {
    if (!originalData.length) return;
    
    let filteredData = [...originalData];
    
    // 应用类别筛选
    if (categoryFilter) {
      filteredData = filteredData.filter(part => part.category === categoryFilter);
    }
    
    // 应用制造商筛选
    if (manufacturerFilter) {
      filteredData = filteredData.filter(part => part.manufacturer === manufacturerFilter);
    }
    
    // 更新显示数据
    setData(filteredData);
    
    // 重置分页到第一页
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, [categoryFilter, manufacturerFilter, originalData]);
  
  // 当筛选条件变化时，应用筛选
  useEffect(() => {
    applyFilters();
  }, [categoryFilter, manufacturerFilter, applyFilters]);

  /**
   * 处理类别筛选变化
   */
  const handleCategoryFilterChange = (value: string | null) => {
    setCategoryFilter(value);
  };
  
  /**
   * 处理制造商筛选变化
   */
  const handleManufacturerFilterChange = (value: string | null) => {
    setManufacturerFilter(value);
  };

  /**
   * 根据库存状态返回对应的标签样式
   * 不同状态有不同的颜色和文本
   */
  const renderStatusTag = (status: string) => {
    // 定义状态与样式的对应关系
    const statusMap = {
      in_stock: { className: 'status-badge status-badge-completed', text: '有库存' },
      low_stock: { className: 'status-badge status-badge-pending', text: '库存不足' },
      out_of_stock: { className: 'status-badge status-badge-cancelled', text: '无库存' },
      discontinued: { className: 'status-badge status-badge-cancelled', text: '已停产' }
    };
    // 获取当前状态的样式，如果找不到则使用默认样式
    const currentStatus = statusMap[status as keyof typeof statusMap] || { className: 'status-badge', text: '未知' };
    
    // 返回带样式的状态标签
    return <span className={currentStatus.className}>{currentStatus.text}</span>;
  };

  /**
   * 表格列定义
   * 设置表格每一列的显示内容和行为
   */
  const columns: ColumnsType<Part> = [
    {
      title: '配件编号',  // 列标题
      dataIndex: 'code',  // 对应数据字段名
      key: 'code',        // 列的唯一标识
      render: (code: string) => <span className="font-medium">{code}</span>,  // 自定义渲染函数
    },
    {
      title: '配件名称',       // 列标题
      dataIndex: 'name',       // 对应数据字段名
      key: 'name',             // 列的唯一标识
      render: (name: string, record) => (
        <div className="flex items-center">
          <AppstoreOutlined className="mr-2 text-blue-500" />  {/* 显示一个图标 */}
          <div>
            <div className="font-medium">{name}</div>  {/* 显示配件名称 */}
            {/* 如果库存低于最小库存，显示库存不足警告 */}
            {record.stock <= record.minStock && (
              <div className="flex items-center text-xs text-amber-500">
                <WarningOutlined className="mr-1" />  {/* 显示警告图标 */}
                <span>库存不足</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '类别',          // 列标题
      dataIndex: 'category',  // 对应数据字段名
      key: 'category',        // 列的唯一标识
      render: (category: string) => {
        // 使用全局定义的类别映射
        // 获取当前类别的样式，如果找不到则使用原始类别名
        const currentCategory = CATEGORY_MAP[category] || { color: 'default', text: category };
        return (
          <Tag color={currentCategory.color} className="px-2 py-1">
            <span className="flex items-center">
              <ToolOutlined className="mr-1" />  {/* 显示工具图标 */}
              {currentCategory.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: '品牌',          // 列标题
      dataIndex: 'manufacturer',  // 对应数据字段名
      key: 'manufacturer',        // 列的唯一标识
    },
    {
      title: '库存',          // 列标题
      dataIndex: 'stock',     // 对应数据字段名
      key: 'stock',           // 列的唯一标识
      render: (stock: number, record) => (
        <Badge
          count={stock}  // 显示库存数量
          showZero       // 即使是0也显示
          color={stock <= record.minStock ? '#faad14' : '#52c41a'}  // 库存不足时显示黄色，否则显示绿色
          style={{ backgroundColor: stock <= record.minStock ? '#faad14' : '#52c41a' }}
          className="px-2 py-1"
        />
      ),
    },
    {
      title: '单价',          // 列标题
      dataIndex: 'price',     // 对应数据字段名
      key: 'price',           // 列的唯一标识
      render: (price: number) => <span className="font-medium">¥{price.toLocaleString()}</span>,  // 格式化价格显示
    },
    {
      title: '状态',          // 列标题
      dataIndex: 'status',    // 对应数据字段名
      key: 'status',          // 列的唯一标识
      render: renderStatusTag,  // 使用自定义函数渲染状态标签
    },
    {
      title: '操作',          // 列标题：操作按钮列
      key: 'action',          // 列的唯一标识
      render: (_, record) => (
        <Space size="middle">  {/* 使用Space组件给按钮之间添加间距 */}
          {/* 编辑按钮：检查用户是否有权限 */}
          <PermissionChecker
            menuKey="parts"  // 对应的菜单键
            requiredPermission="write"  // 需要的权限类型
            buttonProps={{
              type: "text",
              icon: <EditOutlined />,  // 使用编辑图标
              onClick: () => handleEdit(record),  // 点击时调用编辑函数
              className: "text-blue-500 hover:text-blue-600"  // 按钮样式
            }}
            noPermissionTip="您没有编辑配件的权限"  // 无权限时的提示
          >
            编辑
          </PermissionChecker>
          
          {/* 删除按钮：检查用户是否有权限 */}
          <PermissionChecker
            menuKey="parts"  // 对应的菜单键
            requiredPermission="manage"  // 需要的权限类型（管理权限）
            buttonProps={{
              type: "text",
              danger: true,  // 使用危险样式（红色）
              icon: <DeleteOutlined />,  // 使用删除图标
              onClick: () => handleDelete(record)  // 点击时调用删除函数
            }}
            noPermissionTip="您没有删除配件的权限"  // 无权限时的提示
          >
            删除
          </PermissionChecker>
        </Space>
      ),
    },
  ];

  /**
   * 处理编辑配件的函数
   * 当用户点击编辑按钮时调用
   * @param record - 要编辑的配件记录
   */
  const handleEdit = (record: Part) => {
    // 设置当前编辑的配件
    setEditingPart(record);
    // 用配件数据填充表单
    form.setFieldsValue(record);
    // 显示编辑模态框
    setModalVisible(true);
  };

  /**
   * 处理删除配件的函数
   * 当用户点击删除按钮时调用
   * @param record - 要删除的配件记录
   */
  const handleDelete = (record: Part) => {
    // 显示确认对话框，避免误删
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,  // 显示感叹号图标
      content: `确定要删除配件 "${record.name}" 吗？此操作不可撤销。`,  // 确认信息
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },  // 确认按钮使用危险样式（红色）
      // 用户点击确认时
      onOk: async () => {
        try {
          // 发送删除请求到API
          const response = await fetch(`/api/parts/${record._id}`, {
            method: 'DELETE',
          });
          
          const result = await response.json();
          
          // 如果响应不成功，抛出错误
          if (!response.ok) {
            throw new Error(result.message || '删除配件失败');
          }
          
          // 显示成功消息
          message.success('配件已成功删除');
          // 重新获取配件列表，刷新数据
          fetchParts();
        } catch (error: any) {
          // 显示错误消息
          message.error(error.message || '删除配件失败');
        }
      },
    });
  };

  /**
   * 处理表单提交的函数
   * 当用户在模态框中填写完表单并提交时调用
   * @param values - 表单数据
   */
  const handleSubmit = async (values: any) => {
    try {
      // 设置加载状态为true，显示提交中效果
      setLoading(true);
      
      let response;
      
      // 如果是编辑现有配件
      if (editingPart?._id) {
        // 发送更新请求到API
        response = await fetch(`/api/parts/${editingPart._id}`, {
          method: 'PUT',  // 使用PUT方法表示更新
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),  // 将表单数据转为JSON
        });
      } else {
        // 否则是添加新配件
        // 发送创建请求到API
        response = await fetch('/api/parts', {
          method: 'POST',  // 使用POST方法表示创建
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),  // 将表单数据转为JSON
        });
      }
      
      const result = await response.json();
      
      // 如果响应不成功，抛出错误
      if (!response.ok) {
        throw new Error(result.message || '保存配件失败');
      }
      
      // 显示成功消息
      message.success(editingPart ? '配件已更新' : '配件已添加');
      // 关闭模态框
      setModalVisible(false);
      // 重置编辑状态
      setEditingPart(null);
      // 重置表单
      form.resetFields();
      // 重新获取配件列表，刷新数据
      fetchParts();
    } catch (error: any) {
      // 显示错误消息
      message.error(error.message || '保存配件失败');
    } finally {
      // 无论成功还是失败，最后都设置加载状态为false
      setLoading(false);
    }
  };

  /**
   * 处理批量导入配件的函数
   * 当用户点击批量导入按钮时调用
   */
  const handleImport = () => {
    // 显示提示，这个功能尚未实现
    message.info('批量导入功能正在开发中');
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
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              options={filters.categories.map(category => {
                // 使用全局定义的类别映射
                // 获取当前类别的中文名称，如果找不到则使用原始值
                const currentCategory = CATEGORY_MAP[category] || { color: 'default', text: category };
                return {
                  label: currentCategory.text, // 显示中文名称
                  value: category // 保留原始值用于筛选
                };
              })}
              className="hover-glow"
            />
            <Select 
              style={{ width: 200 }}
              placeholder="选择制造商"
              allowClear
              value={manufacturerFilter}
              onChange={handleManufacturerFilterChange}
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
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0} 
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minStock"
                label="最低库存"
                tooltip="当库存低于此数量时会给出警告"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0} 
                  placeholder="5"
                />
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