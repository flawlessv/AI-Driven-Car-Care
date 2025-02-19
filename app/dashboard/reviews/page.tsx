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
import { StarOutlined, MessageOutlined, EyeOutlined } from '@ant-design/icons';
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
  reply?: {
    content: string;
    replyAt: string;
  };
  status: 'published' | 'hidden' | 'deleted';
  createdAt: string;
}

export default function ReviewsPage() {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyForm] = Form.useForm();

  useEffect(() => {
    fetchReviews();
  }, [page, pageSize]);

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

  const handleReply = (record: Review) => {
    setSelectedReview(record);
    setReplyModalVisible(true);
    replyForm.setFieldsValue({
      content: record.reply?.content || '',
    });
  };

  const handleSubmitReply = async () => {
    try {
      if (!selectedReview) return;
      
      const values = await replyForm.validateFields();
      const response = await fetch(`/api/reviews/${selectedReview._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: {
            content: values.content,
            replyAt: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || '回复失败');
      }

      message.success('回复成功');
      setReplyModalVisible(false);
      fetchReviews();
    } catch (error: any) {
      message.error(error.message || '回复失败');
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
        const statusMap = {
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
          <Button
            type="link"
            icon={<MessageOutlined />}
            onClick={() => handleReply(record)}
          >
            回复
          </Button>
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
        <Title level={2}>评价管理</Title>
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
        title="回复评价"
        open={replyModalVisible}
        onOk={handleSubmitReply}
        onCancel={() => setReplyModalVisible(false)}
      >
        <Form form={replyForm}>
          <Form.Item
            name="content"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 
