'use client';

import React, { useState, useEffect } from 'react';
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
  Avatar,
} from 'antd';
import {
  StarOutlined,
  MessageOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CommentOutlined,
  CarOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/lib/store';
import PermissionChecker from '@/app/components/PermissionChecker';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 评论状态枚举
 * 描述评论在系统中的状态
 */
enum ReviewStatus {
  PENDING = 'pending',    // 待审核
  APPROVED = 'approved',  // 已批准
  REJECTED = 'rejected'   // 已拒绝
}

/**
 * 评论对象接口定义
 * 描述系统中评论的数据结构
 */
interface Review {
  _id: string;             // 评论ID
  maintenanceId: string;   // 关联的维修记录ID
  technicianId: string;    // 技师ID
  authorId: string;        // 评论作者ID（客户）
  authorName: string;      // 评论作者姓名
  vehicleName: string;     // 车辆名称
  rating: number;          // 评分(1-5)
  comment: string;         // 评论内容
  status: ReviewStatus;    // 评论状态
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
  technicianName?: string; // 技师姓名（可选）
  workOrder?: string;      // 工单ID
  workOrderNumber?: string; // 工单编号
  author?: {              // 作者详细信息
    _id: string;
    username: string;
    phone?: string;
    email?: string;
  };
  authorPhone?: string;    // 作者电话
  authorEmail?: string;    // 作者邮箱
}

/**
 * 技师信息接口
 * 用于显示和过滤评论中的技师信息
 */
interface Technician {
  _id: string;       // 技师ID
  username: string;  // 用户名
  fullName: string;  // 全名
}

/**
 * 评论状态颜色映射
 * 为不同状态提供统一的样式配置
 */
const reviewStatusMap: Record<string, { text: string; color: string }> = {
  [ReviewStatus.PENDING]: { text: '待审核', color: 'orange' },
  [ReviewStatus.APPROVED]: { text: '已批准', color: 'green' },
  [ReviewStatus.REJECTED]: { text: '已拒绝', color: 'red' },
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
  const [statusFilter, setStatusFilter] = useState<string>('all');  // 状态筛选
  const [technicianFilter, setTechnicianFilter] = useState<string>('all'); // 技师筛选
  const [ratingFilter, setRatingFilter] = useState<string>('all');   // 评分筛选
  const [technicians, setTechnicians] = useState<Technician[]>([]);  // 技师列表
  const [searchText, setSearchText] = useState('');         // 搜索文本
  const [selectedReview, setSelectedReview] = useState<Review | null>(null); // 当前选中评论
  const [detailModalVisible, setDetailModalVisible] = useState(false); // 详情模态框显示状态

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
    fetchTechnicians();  // 获取技师列表
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
      
      if (Array.isArray(result.data)) {
        console.log('获取到评论数据:', result.data.length);
        setReviews(result.data);
        setTotal(result.data.length);
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
   * 获取技师列表
   * 用于筛选评论的技师下拉选择
   */
  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/users?role=technician', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '获取技师列表失败');
      }
      
      if (Array.isArray(result.data)) {
        // 转换技师数据格式以适合下拉选择器
        const techList = result.data.map((tech: any) => ({
          _id: tech._id,
          username: tech.username,
          fullName: tech.fullName || tech.username
        }));
        
        setTechnicians(techList);
      } else {
        console.error('技师列表数据格式错误:', result);
        setTechnicians([]);
      }
    } catch (error: any) {
      console.error('获取技师列表失败:', error);
      message.error(error.message || '获取技师列表失败');
      setTechnicians([]);
    }
  };

  /**
   * 更新评论状态
   * 向API发送请求更新评论审核状态
   * @param reviewId 评论ID
   * @param status 新状态
   */
  const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // 更新本地状态而不是重新获取所有数据
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId ? { ...review, status } : review
          )
        );
        message.success('评论状态已更新');
      } else {
        message.error('更新评论状态失败');
      }
    } catch (error) {
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
      dataIndex: 'comment',
      key: 'comment',
      width: 300,
      ellipsis: true,
      render: (text: string, record: Review) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record: Review) => {
        const phone = record.authorPhone || record.author?.phone || '-';
        const email = record.authorEmail || record.author?.email || '-';
        
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
        return <Tag color={reviewStatusMap[status].color}>{reviewStatusMap[status].text}</Tag>;
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
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => updateReviewStatus(record._id, ReviewStatus.APPROVED)}
                      disabled={record.status === ReviewStatus.APPROVED}
                    >
                      通过
                    </Button>
                    <Button
                      size="small"
                      onClick={() => updateReviewStatus(record._id, ReviewStatus.PENDING)}
                      disabled={record.status === ReviewStatus.PENDING}
                    >
                      待审核
                    </Button>
                    <Button
                      danger
                      size="small"
                      onClick={() => updateReviewStatus(record._id, ReviewStatus.REJECTED)}
                      disabled={record.status === ReviewStatus.REJECTED}
                    >
                      拒绝
                    </Button>
                  </Space>
                );
              },
            },
          ]}
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
