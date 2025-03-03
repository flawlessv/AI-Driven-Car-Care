'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Timeline,
  message,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Spin,
  Rate,
} from 'antd';
import {
  EditOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import type { MaintenanceRecord, MaintenanceStatus } from '@/app/dashboard/maintenance/types';

const statusColors: Record<MaintenanceStatus, string> = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const statusText: Record<MaintenanceStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export default function MaintenanceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MaintenanceRecord | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    fetchMaintenanceDetail();
  }, [params.id]);

  const fetchMaintenanceDetail = async () => {
    try {
      const response = await fetch(`/api/maintenance/${params.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '获取保养详情失败');
      }

      // 添加调试信息
      console.log('维修记录详情:', {
        data: result.data,
        customer: result.data.customer,
        technician: result.data.technician,
        response: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        rawResult: result
      });

      setData(result.data);
    } catch (error: any) {
      console.error('获取保养详情失败:', error);
      message.error(error.message || '获取保养详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (values: any) => {
    try {
      const response = await fetch(`/api/maintenance/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '更新状态失败');
      }

      message.success('状态更新成功');
      setStatusModalVisible(false);
      form.resetFields();
      fetchMaintenanceDetail();
    } catch (error: any) {
      message.error(error.message || '更新状态失败');
    }
  };

  const handleSubmitReview = async (values: any) => {
    try {
      if (!data?.customer?._id) {
        message.error('客户信息不完整，无法提交评价');
        return;
      }
      
      if (!data?.technician?._id) {
        message.error('技师信息不完整，无法提交评价');
        return;
      }

      // 打印调试信息
      console.log('提交评价数据:', {
        customer: data.customer,
        technician: data.technician,
        values
      });

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: data.customer._id,
          targetType: 'technician',
          targetId: data.technician._id,
          maintenanceRecord: params.id,
          rating: values.rating,
          content: values.content,
          tags: values.tags || [],
          images: values.images || [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '提交评价失败');
      }

      message.success('评价提交成功');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      fetchMaintenanceDetail();
    } catch (error: any) {
      console.error('提交评价失败:', error);
      message.error(error.message || '提交评价失败，请确保所有必要信息完整');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center">
            <h3 className="text-lg mb-4">未找到保养记录</h3>
            <Button onClick={() => router.back()}>返回</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="maintenance-detail">
      <Card
        title="维修记录详情"
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              返回
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>未找到维修记录</p>
          </div>
        ) : (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="车辆信息">
              {data.vehicle ? `${data.vehicle.brand || ''} ${data.vehicle.model || ''} (${data.vehicle.licensePlate || ''})` : '未指定车辆'}
            </Descriptions.Item>
            <Descriptions.Item label="保养类型">
              {data.type === 'regular' ? '常规保养' : data.type === 'repair' ? '维修' : '年检'}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={statusColors[data.status]}>
                {statusText[data.status]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {dayjs(data.startDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="完成日期">
              {data.completionDate ? dayjs(data.completionDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="费用">
              ¥{(data.cost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="客户">
              {data.customer?.name || '未指定'} - {data.customer?.phone || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="技师">
              {data.technician?.name || '未指定'} ({data.technician?.level || 'N/A'})
            </Descriptions.Item>
            <Descriptions.Item label="里程数">
              {data.mileage?.toLocaleString() || 'N/A'} km
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {data.description}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}