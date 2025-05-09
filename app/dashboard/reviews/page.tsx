'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  message,
  Typography,
  Tooltip,
  Rate,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

/**
 * 评论状态枚举
 * 描述评论在系统中的状态
 */
enum ReviewStatus {
  VISIBLE = 'published',    // 可见/已发布
  HIDDEN = 'hidden'         // 已隐藏
}

/**
 * 评论对象接口定义
 * 描述系统中评论的数据结构
 */
interface Review {
  _id: string;             // 评论ID
  maintenanceId?: string;  // 关联的维修记录ID
  authorName: string;      // 评论作者姓名
  rating: number;          // 评分(1-5)
  content: string;         // 评论内容
  status: string;          // 评论状态
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
  targetId?: any;          // 目标ID（技师）
  targetType?: string;     // 目标类型
  workOrder?: string;      // 工单ID
  workOrderNumber?: string; // 工单编号
  author?: {              // 作者详细信息
    _id: string;
    username: string;
    phone?: string;
    email?: string;
  };
}

/**
 * 评论状态颜色映射
 * 为不同状态提供统一的样式配置
 */
const reviewStatusMap: Record<string, { text: string; color: string }> = {
  [ReviewStatus.VISIBLE]: { text: '已启用', color: 'green' },
  [ReviewStatus.HIDDEN]: { text: '已隐藏', color: 'gray' },
};

/**
 * 评论管理页面组件
 * 负责展示所有评论记录，并提供审核、筛选和管理功能
 */
const ReviewsPage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 状态管理
  const [loading, setLoading] = useState(false);            // 加载状态
  const [reviews, setReviews] = useState<Review[]>([]);     // 评论数据
  const [currentPage, setCurrentPage] = useState(1);        // 当前页码
  const [pageSize, setPageSize] = useState(10);             // 每页显示条数
  const [total, setTotal] = useState(0);                    // 总评论数

  /**
   * 组件初始化时检查用户登录状态
   * 未登录则重定向到登录页
   */
  useEffect(() => {
    if (!user) {
      console.log('用户未登录，重定向到登录页面');
      router.push('/login');
      return;
    }

    console.log('用户已登录，角色:', user.role);
    fetchReviews();      // 获取评论列表
  }, [user, router]);

  /**
   * 获取评论列表数据
   * 从API获取评论数据并更新状态
   */
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取评论列表失败');
      }
      
      if (result.success && result.data) {
        // 处理分页数据结构
        if (Array.isArray(result.data.items)) {
          console.log('获取到评论数据:', result.data.items.length);
          setReviews(result.data.items);
          setTotal(result.data.total || result.data.items.length);
        } else if (Array.isArray(result.data)) {
          // 兼容旧版API可能直接返回数组的情况
          console.log('获取到评论数据:', result.data.length);
          setReviews(result.data);
          setTotal(result.data.length);
        } else {
          console.error('评论列表数据格式错误:', result);
          setReviews([]);
          setTotal(0);
        }
      } else {
        console.error('评论列表数据格式错误:', result);
        setReviews([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('获取评论列表失败:', error);
      message.error(error.message || '获取评论列表失败');
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新评论状态
   * 向API发送请求更新评论审核状态
   * @param reviewId 评论ID
   * @param status 新状态
   */
  const updateReviewStatus = async (reviewId: string, status: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 更新本地状态而不是重新获取所有数据
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId ? { ...review, status } : review
          )
        );
        message.success('评论状态已更新');
      } else {
        message.error(result.message || '更新评论状态失败');
      }
    } catch (error: any) {
      console.error('更新评论状态出错:', error);
      message.error('更新评论状态时发生错误');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 表格列配置
   * 定义评论表格的各列显示和交互行为
   */
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
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record: any) => {
        const phone = record.author?.phone || '-';
        const email = record.author?.email || '-';
        
        return (
          <>
            <div>{phone && typeof phone === 'string' && phone.length > 4 ? `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}` : phone}</div>
            <div>{email || '-'}</div>
          </>
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
        const statusConfig = reviewStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Review) => {
        // 判断当前用户是否为评价作者
        const isAuthor = user && 
          ((typeof record.author === 'object' && record.author?._id === user._id) || 
           (typeof record.author === 'string' && record.author === user._id));
        
        // 是否为管理员
        const isAdmin = user?.role === 'admin';
        
        // 当前评论是否已隐藏
        const isHidden = record.status === ReviewStatus.HIDDEN;
        
        // 只有管理员和作者可以隐藏/显示评论
        if (isAdmin || isAuthor) {
          return (
            <Button
              danger={!isHidden}
              size="small"
              onClick={() => updateReviewStatus(
                record._id, 
                isHidden ? ReviewStatus.VISIBLE : ReviewStatus.HIDDEN
              )}
            >
              {isHidden ? '显示' : '隐藏'}
            </Button>
          );
        }
        
        // 如果没有操作权限
        return <span className="text-gray-500">无操作权限</span>;
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
          columns={columns}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (p, s) => {
              setCurrentPage(p);
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

export default ReviewsPage; 
