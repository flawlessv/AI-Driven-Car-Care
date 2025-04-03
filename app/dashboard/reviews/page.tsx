'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Rate,
  message,
  Form,
  Input,
  Select,
  Typography,
} from 'antd';
import { StarOutlined, MessageOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Review {
  _id: string;
  author: {
    name: string;
    phone: string;
  };
  targetType: 'technician' | 'shop';
  targetId: {
    name: string;
    level?: string;
  };
  maintenanceRecord: {
    date: string;
    type: string;
    cost: number;
  };
  rating: number;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: string;
}

interface Technician {
  _id: string;
  name: string;
}

export default function ReviewsPage() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [newReviewModalVisible, setNewReviewModalVisible] = useState(false);
  const [newReviewForm] = Form.useForm();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchTechnicians();
    
    console.log('组件挂载或依赖更新，当前技师列表:', technicians);
  }, [page, pageSize]);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reviews?page=${page}&limit=${pageSize}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取评价列表失败');
      }

      setReviews(result.data.items);
      setTotal(result.data.total);
    } catch (error: any) {
      message.error(error.message || '获取评价列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('获取到的技师数据:', result.data);
        setTechnicians(result.data);
      } else {
        console.error('获取技师列表失败:', result);
      }
    } catch (error) {
      console.error('获取技师列表失败:', error);
    }
  };

  const handleCreateReview = async () => {
    try {
      const values = await newReviewForm.validateFields();
      setSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        message.success('添加评价成功');
        setNewReviewModalVisible(false);
        newReviewForm.resetFields();
        fetchReviews();
      } else {
        throw new Error(result.message || '添加评价失败');
      }
    } catch (error: any) {
      message.error(error.message || '添加评价失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (record: Review, status: Review['status']) => {
    try {
      const response = await fetch(`/api/reviews/${record._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '更新状态失败');
      }

      message.success('状态更新成功');
      fetchReviews();
    } catch (error: any) {
      message.error(error.message || '更新状态失败');
    }
  };

  const openNewReviewModal = () => {
    console.log('打开添加评价弹窗，技师列表状态:', technicians);
    setNewReviewModalVisible(true);
  };

  const columns: ColumnsType<Review> = [
    {
      title: '评价对象',
      key: 'target',
      render: (_, record) => (
        <Space direction="vertical">
          <span>{record.targetId.name}</span>
          <Tag color="blue">
            {record.targetType === 'technician' ? '技师' : '门店'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
    },
    {
      title: '评价人',
      key: 'author',
      render: (_, record) => (
        <Space direction="vertical">
          <span>{record.author.name}</span>
          <span className="text-gray-500">{record.author.phone}</span>
        </Space>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          published: { text: '已发布', color: 'green' },
          hidden: { text: '已隐藏', color: 'orange' },
          deleted: { text: '已删除', color: 'red' },
        };
        return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'published' ? (
            <Button
              type="link"
              danger
              onClick={() => handleStatusChange(record, 'hidden')}
            >
              隐藏
            </Button>
          ) : (
            <Button
              type="link"
              onClick={() => handleStatusChange(record, 'published')}
            >
              显示
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>评价管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={openNewReviewModal}
          >
            添加评价
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>

      <Modal
        title="添加评价"
        open={newReviewModalVisible}
        onOk={handleCreateReview}
        onCancel={() => setNewReviewModalVisible(false)}
        confirmLoading={submitting}
        width={600}
        destroyOnClose={true}
      >
        <Form form={newReviewForm} layout="vertical">
          <Form.Item
            name="author"
            label="评价人信息"
            rules={[{ required: true, message: '请输入评价人信息' }]}
          >
            <Input.Group compact>
              <Form.Item
                name={['author', 'name']}
                noStyle
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input style={{ width: '50%' }} placeholder="姓名" />
              </Form.Item>
              <Form.Item
                name={['author', 'phone']}
                noStyle
                rules={[{ required: true, message: '请输入联系方式' }]}
              >
                <Input style={{ width: '50%' }} placeholder="联系方式" />
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="targetType"
            label="评价对象类型"
            rules={[{ required: true, message: '请选择评价对象类型' }]}
          >
            <Select placeholder="请选择评价对象类型">
              <Option value="technician">技师</Option>
              <Option value="shop">门店</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.targetType !== currentValues.targetType
            }
          >
            {({ getFieldValue }) => {
              const targetType = getFieldValue('targetType');
              console.log('渲染技师选择组件，当前选择的类型:', targetType);
              console.log('当前技师列表数据:', technicians);
              
              return targetType === 'technician' ? (
                <Form.Item
                  name={['targetId', '_id']}
                  label="选择技师"
                  rules={[{ required: true, message: '请选择技师' }]}
                >
                  <Select placeholder="请选择技师">
                    {technicians && technicians.length > 0 ? (
                      technicians.map(tech => (
                        <Option key={tech._id} value={tech._id}>{tech.name}</Option>
                      ))
                    ) : (
                      <Option value="" disabled>暂无技师数据</Option>
                    )}
                  </Select>
                </Form.Item>
              ) : targetType === 'shop' ? (
                <Form.Item
                  name={['targetId', 'name']}
                  label="门店名称"
                  rules={[{ required: true, message: '请输入门店名称' }]}
                >
                  <Input placeholder="请输入门店名称" />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="content"
            label="评价内容"
            rules={[{ required: true, message: '请输入评价内容' }]}
          >
            <TextArea rows={4} placeholder="请输入评价内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 
