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
  Tooltip,
} from 'antd';
import { StarOutlined, MessageOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import PermissionChecker from '@/app/components/PermissionChecker';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Review {
  _id: string;
  author: {
    _id: string;
    username: string;
    phone?: string;
    email?: string;
  } | string;
  authorName?: string;
  authorPhone?: string;
  authorEmail?: string;
  targetType: 'technician' | 'shop';
  targetId: {
    _id: string;
    name: string;
    username?: string;
    level?: string;
  };
  maintenanceRecord: {
    _id: string;
    date: string;
    type: string;
    cost: number;
  };
  workOrder?: string;
  workOrderNumber?: string;
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
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchReviews();
    fetchTechnicians();
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

      const formattedReviews = result.data.items.map((review: any) => {
        let author = review.author || {};
        if (typeof author !== 'object') {
          author = { _id: author };
        }
        
        if (review.authorName && !author.username) {
          author.username = review.authorName;
        }
        
        if (!author.username && author._id) {
          author.username = '用户' + author._id.toString().substring(author._id.toString().length - 4);
        }
        
        return {
          ...review,
          author
        };
      });

      setReviews(formattedReviews);
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
      title: '关联工单',
      key: 'workOrder',
      render: (_, record) => {
        if (record.workOrderNumber) {
          return (
            <Button 
              type="link" 
              href={`/dashboard/work-orders/${record.workOrder}`}
            >
              {record.workOrderNumber}
            </Button>
          );
        } else if (record.workOrder) {
          return (
            <Button 
              type="link" 
              href={`/dashboard/work-orders/${record.workOrder}`}
            >
              查看工单
            </Button>
          );
        } else {
          return <span className="text-gray-500">无关联工单</span>;
        }
      },
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
      render: (_, record) => {
        let username = '';
        let contact = '';
        
        if (record.author && typeof record.author === 'object') {
          username = record.author.username || '';
          contact = record.author.phone || record.author.email || '';
        } else if (record.authorName) {
          username = record.authorName;
          contact = record.authorPhone || record.authorEmail || '';
        } else if (record.author && typeof record.author === 'string') {
          username = '用户' + record.author.substring(record.author.length - 4);
        } else {
          username = '未知用户';
        }
        
        return (
          <Space direction="vertical">
            <span>{username}</span>
            {contact && <span className="text-gray-500">{contact}</span>}
          </Space>
        );
      },
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
  ];

  return (
    <div className="p-6">
      <Card
        title={
          <Title level={5} className="m-0">
            评价管理
          </Title>
        }
      >
        <Table
          loading={loading}
          dataSource={reviews}
          columns={[
            ...columns,
            {
              title: '操作',
              key: 'action',
              render: (_: any, record: Review) => {
                // 判断当前用户是否为评价作者，或是否具有管理权限
                const isAuthor = user && 
                  ((typeof record.author === 'object' && record.author?._id === user._id) || 
                   (typeof record.author === 'string' && record.author === user._id));
                
                // 判断是否有权限操作评价：管理员拥有所有权限，客户只能操作自己的评价
                const canManageReview = user?.role === 'admin' || 
                  (user?.role === 'customer' && isAuthor);
                
                if (!canManageReview) {
                  return <span className="text-gray-500">无操作权限</span>;
                }
                
                return (
                  <Space>
                    {record.status === 'published' ? (
                      <PermissionChecker
                        menuKey="reviews"
                        requiredPermission={isAuthor ? "write" : "manage"}
                        buttonProps={{
                          size: "small",
                          onClick: () => handleStatusChange(record, 'hidden')
                        }}
                        noPermissionTip="您没有管理评价的权限"
                      >
                        隐藏
                      </PermissionChecker>
                    ) : (
                      <PermissionChecker
                        menuKey="reviews"
                        requiredPermission={isAuthor ? "write" : "manage"}
                        buttonProps={{
                          type: "primary",
                          size: "small",
                          onClick: () => handleStatusChange(record, 'published')
                        }}
                        noPermissionTip="您没有管理评价的权限"
                      >
                        发布
                      </PermissionChecker>
                    )}
                  </Space>
                );
              },
            },
          ]}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            onChange: (p, s) => {
              setPage(p);
              if (s !== pageSize) {
                setPageSize(s);
              }
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条评价`,
          }}
        />
      </Card>
    </div>
  );
} 
